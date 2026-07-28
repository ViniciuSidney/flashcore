import {
	DATA_ERROR_CATEGORIES,
	DATA_ERROR_CODES
} from '../shared/errors/data-error.constants.js';
import {DataError} from '../shared/errors/data-error.js';
import {
	createFailureResult,
	createSuccessResult
} from '../shared/result.js';

export const OPERATION_TYPES = Object.freeze({
	RESTORE_LOCAL: 'restore-local',
	RESTORE_CLOUD: 'restore-cloud',
	MIGRATION: 'migration',
	DELETE_ALL: 'delete-all',
	RECOVER_ROLLBACK: 'recover-rollback',
	REMOTE_UPLOAD: 'remote-upload',
	REMOTE_DELETE: 'remote-delete'
});

const EXCLUSIVE_OPERATION_TYPES = new Set([
	OPERATION_TYPES.RESTORE_LOCAL,
	OPERATION_TYPES.RESTORE_CLOUD,
	OPERATION_TYPES.MIGRATION,
	OPERATION_TYPES.DELETE_ALL,
	OPERATION_TYPES.RECOVER_ROLLBACK
]);

function requireNonEmptyString(value, fieldName) {
	if (typeof value !== 'string' || value.trim() === '') {
		throw new TypeError(`${fieldName} deve ser uma string não vazia.`);
	}

	return value.trim();
}

function normalizeContext(context) {
	if (
		context === null ||
		typeof context !== 'object' ||
		Array.isArray(context)
	) {
		throw new TypeError('context deve ser um objeto.');
	}

	return Object.freeze({...context});
}

function createDefaultOperationId() {
	if (typeof globalThis.crypto?.randomUUID === 'function') {
		return globalThis.crypto.randomUUID();
	}

	return `operation-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function createOperationInProgressError(operationType, activeOperations) {
	return new DataError({
		code: DATA_ERROR_CODES.OPERATION_IN_PROGRESS,
		category: DATA_ERROR_CATEGORIES.OPERATION,
		userMessageKey: 'errors.operation.inProgress',
		technicalMessage: `A operação ${operationType} não pode ser iniciada enquanto houver uma operação incompatível ativa.`,
		retryable: true,
		context: {
			requestedType: operationType,
			activeTypes: Object.freeze(
				activeOperations.map((operation) => operation.type)
			)
		}
	});
}

export function isExclusiveOperationType(operationType) {
	return EXCLUSIVE_OPERATION_TYPES.has(operationType);
}

export class OperationCoordinator {
	#activeOperations = new Map();
	#clock;
	#idFactory;

	constructor({clock = () => Date.now(), idFactory = createDefaultOperationId} = {}) {
		if (typeof clock !== 'function') {
			throw new TypeError('clock deve ser uma função.');
		}

		if (typeof idFactory !== 'function') {
			throw new TypeError('idFactory deve ser uma função.');
		}

		this.#clock = clock;
		this.#idFactory = idFactory;
	}

	acquire(operationType, {context = {}} = {}) {
		const normalizedType = requireNonEmptyString(
			operationType,
			'operationType'
		);
		const normalizedContext = normalizeContext(context);

		if (this.isLocked(normalizedType)) {
			const activeOperations = this.getActiveOperations();

			return createFailureResult(
				createOperationInProgressError(
					normalizedType,
					activeOperations
				),
				{
					metadata: {
						operationType: normalizedType,
						activeCount: activeOperations.length
					}
				}
			);
		}

		const operationId = requireNonEmptyString(
			this.#idFactory(),
			'idFactory()'
		);

		if (this.#activeOperations.has(operationId)) {
			throw new Error(
				`idFactory gerou um identificador duplicado: ${operationId}`
			);
		}

		const startedAt = this.#clock();

		if (!Number.isFinite(startedAt)) {
			throw new TypeError('clock deve retornar um número finito.');
		}

		const operation = Object.freeze({
			id: operationId,
			type: normalizedType,
			startedAt,
			exclusive: isExclusiveOperationType(normalizedType),
			context: normalizedContext
		});

		this.#activeOperations.set(operationId, operation);

		return createSuccessResult(operation, {
			metadata: {
				activeCount: this.#activeOperations.size
			}
		});
	}

	release(operationId) {
		const normalizedId = requireNonEmptyString(
			operationId,
			'operationId'
		);
		const operation = this.#activeOperations.get(normalizedId) ?? null;

		if (operation === null) {
			return createSuccessResult(
				{
					released: false,
					operation: null
				},
				{
					metadata: {
						activeCount: this.#activeOperations.size,
						reason: 'not-found'
					}
				}
			);
		}

		this.#activeOperations.delete(normalizedId);

		return createSuccessResult(
			{
				released: true,
				operation
			},
			{
				metadata: {
					activeCount: this.#activeOperations.size
				}
			}
		);
	}

	isLocked(operationType) {
		const normalizedType = requireNonEmptyString(
			operationType,
			'operationType'
		);
		const activeOperations = this.getActiveOperations();

		if (
			activeOperations.some(
				(operation) => operation.type === normalizedType
			)
		) {
			return true;
		}

		if (!isExclusiveOperationType(normalizedType)) {
			return false;
		}

		return activeOperations.some((operation) => operation.exclusive);
	}

	getActiveOperations() {
		return Object.freeze([...this.#activeOperations.values()]);
	}
}
