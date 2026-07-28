import {
	assertStateRepository
} from '../data/contracts/state-repository.js';
import {
	DATA_ERROR_CATEGORIES,
	DATA_ERROR_CODES
} from '../shared/errors/data-error.constants.js';
import {DataError} from '../shared/errors/data-error.js';
import {
	createFailureResult,
	createSuccessResult,
	isResult
} from '../shared/result.js';

export const APP_STATE_PHASES = Object.freeze({
	IDLE: 'idle',
	INITIALIZING: 'initializing',
	READY: 'ready',
	MUTATING: 'mutating',
	REPLACING: 'replacing',
	RESETTING: 'resetting',
	ERROR: 'error'
});

function isPlainObject(value) {
	if (value === null || typeof value !== 'object') return false;
	const prototype = Object.getPrototypeOf(value);
	return prototype === Object.prototype || prototype === null;
}

function cloneValue(value) {
	if (typeof structuredClone === 'function') {
		return structuredClone(value);
	}

	return JSON.parse(JSON.stringify(value));
}

function deepFreeze(value, visited = new WeakSet()) {
	if (
		value === null ||
		typeof value !== 'object' ||
		visited.has(value)
	) {
		return value;
	}

	visited.add(value);

	for (const nestedValue of Object.values(value)) {
		deepFreeze(nestedValue, visited);
	}

	return Object.freeze(value);
}

function createProtectedCopy(value) {
	return deepFreeze(cloneValue(value));
}

function requireFunction(value, fieldName) {
	if (typeof value !== 'function') {
		throw new TypeError(`${fieldName} deve ser uma função.`);
	}

	return value;
}

function requireSchemaService(schemaService) {
	if (!schemaService || typeof schemaService.validate !== 'function') {
		throw new TypeError(
			'schemaService deve fornecer o método validate.'
		);
	}

	return schemaService;
}

function normalizeContext(context, defaultReason) {
	const source = typeof context === 'string'
		? {reason: context}
		: context;

	if (!isPlainObject(source)) {
		throw new TypeError('context deve ser um objeto ou uma string.');
	}

	const reason = source.reason ?? defaultReason;

	if (typeof reason !== 'string' || reason.trim() === '') {
		throw new TypeError('context.reason deve ser uma string não vazia.');
	}

	return Object.freeze({
		...source,
		reason: reason.trim()
	});
}

function createStoreError({
	code,
	category = DATA_ERROR_CATEGORIES.OPERATION,
	userMessageKey,
	technicalMessage,
	retryable = false,
	cause = null,
	context = {}
}) {
	return new DataError({
		code,
		category,
		userMessageKey,
		technicalMessage,
		retryable,
		cause,
		context
	});
}

function mergeWarnings(...warningLists) {
	return warningLists.flatMap((warnings) =>
		Array.isArray(warnings) ? warnings : []
	);
}

/**
 * Fonte oficial do estado de estudo em memória.
 *
 * O store mantém o snapshot protegido e só o substitui depois que uma escrita
 * comum foi confirmada pelo StateRepository. A conexão com a aplicação atual
 * ocorrerá em uma etapa posterior do Bloco C.
 */
export class AppStateStore {
	#repository;
	#schemaService;
	#createInitialState;
	#normalizeInternalState;
	#clock;
	#listeners = new Set();
	#snapshot = null;
	#phase = APP_STATE_PHASES.IDLE;
	#initialized = false;
	#operationPending = false;
	#revision = 0;
	#lastError = null;

	constructor({
		repository,
		schemaService,
		createInitialState,
		normalizeInternalState = (state) => state,
		clock = () => Date.now()
	} = {}) {
		this.#repository = assertStateRepository(repository);
		this.#schemaService = requireSchemaService(schemaService);
		this.#createInitialState = requireFunction(
			createInitialState,
			'createInitialState'
		);
		this.#normalizeInternalState = requireFunction(
			normalizeInternalState,
			'normalizeInternalState'
		);
		this.#clock = requireFunction(clock, 'clock');
	}

	async initialize() {
		if (this.#initialized && this.#phase === APP_STATE_PHASES.READY) {
			return createSuccessResult(
				this.#buildOperationData('initialize'),
				{
					metadata: {
						phase: this.#phase,
						alreadyInitialized: true
					}
				}
			);
		}

		const lockResult = this.#beginOperation(
			APP_STATE_PHASES.INITIALIZING,
			'initialize'
		);
		if (!lockResult.ok) return lockResult;

		const readResult = await this.#callRepository(
			'readPrimary',
			[],
			{
				failureCode: DATA_ERROR_CODES.STORAGE_READ_FAILED,
				operation: 'initialize'
			}
		);

		if (!readResult.ok) {
			return this.#finishInitializationFailure(readResult);
		}

		const persistedState = readResult.data?.state ?? null;
		const exists = readResult.data?.exists === true;

		if (exists && persistedState !== null) {
			const validationResult = this.#validateCandidate(
				persistedState,
				'initialize-primary'
			);

			if (!validationResult.ok) {
				return this.#finishInitializationFailure(validationResult);
			}

			const snapshot = this.#commitSnapshot(
				validationResult.data.state,
				'initialize'
			);

			return createSuccessResult(
				{
					snapshot,
					revision: this.#revision,
					source: 'primary'
				},
				{
					warnings: mergeWarnings(
						readResult.warnings,
						validationResult.warnings
					),
					metadata: {
						phase: this.#phase,
						initialized: true,
						source: 'primary'
					}
				}
			);
		}

		const initialResult = await this.#prepareInitialState('initialize');
		if (!initialResult.ok) {
			return this.#finishInitializationFailure(initialResult);
		}

		const writeResult = await this.#persistAndVerify(
			initialResult.data.state,
			'initialize'
		);
		if (!writeResult.ok) {
			return this.#finishInitializationFailure(writeResult);
		}

		const snapshot = this.#commitSnapshot(
			writeResult.data.state,
			'initialize'
		);

		return createSuccessResult(
			{
				snapshot,
				revision: this.#revision,
				source: 'initial'
			},
			{
				warnings: mergeWarnings(
					readResult.warnings,
					initialResult.warnings,
					writeResult.warnings
				),
				metadata: {
					phase: this.#phase,
					initialized: true,
					source: 'initial'
				}
			}
		);
	}

	getSnapshot() {
		return this.#snapshot === null
			? null
			: createProtectedCopy(this.#snapshot);
	}

	subscribe(listener) {
		requireFunction(listener, 'listener');
		this.#listeners.add(listener);

		return () => {
			this.#listeners.delete(listener);
		};
	}

	async executeMutation(mutator, context = {}) {
		requireFunction(mutator, 'mutator');
		const normalizedContext = normalizeContext(context, 'update');

		const readinessResult = this.#requireReady('executeMutation');
		if (!readinessResult.ok) return readinessResult;

		const lockResult = this.#beginOperation(
			APP_STATE_PHASES.MUTATING,
			'executeMutation'
		);
		if (!lockResult.ok) return lockResult;

		let candidate;

		try {
			const draft = cloneValue(this.#snapshot);
			const mutationOutput = await mutator(draft);
			candidate = isPlainObject(mutationOutput)
				? cloneValue(mutationOutput)
				: draft;

			if (isPlainObject(candidate) && 'updatedAt' in candidate) {
				candidate.updatedAt = this.#clock();
			}

			candidate = await this.#normalizeCandidate(candidate);
		} catch (cause) {
			return this.#finishReadyFailure(
				createFailureResult(
					createStoreError({
						code: DATA_ERROR_CODES.STATE_INVALID,
						userMessageKey: 'errors.state.mutationFailed',
						technicalMessage: 'A mutação do estado falhou antes da persistência.',
						retryable: false,
						cause,
						context: {
							operation: 'executeMutation',
							reason: normalizedContext.reason,
							stage: 'mutate'
						}
					})
				)
			);
		}

		const validationResult = this.#validateCandidate(
			candidate,
			'mutation-candidate'
		);
		if (!validationResult.ok) {
			return this.#finishReadyFailure(validationResult);
		}

		const writeResult = await this.#persistAndVerify(
			validationResult.data.state,
			'executeMutation'
		);
		if (!writeResult.ok) {
			return this.#finishReadyFailure(writeResult);
		}

		const snapshot = this.#commitSnapshot(
			writeResult.data.state,
			normalizedContext.reason
		);

		return createSuccessResult(
			{
				snapshot,
				revision: this.#revision,
				reason: normalizedContext.reason
			},
			{
				warnings: mergeWarnings(
					validationResult.warnings,
					writeResult.warnings
				),
				metadata: {
					phase: this.#phase,
					operation: 'executeMutation',
					reason: normalizedContext.reason,
					persisted: true
				}
			}
		);
	}

	async replaceCommittedState(nextState, context = {}) {
		const normalizedContext = normalizeContext(context, 'replace');

		const readinessResult = this.#requireReady('replaceCommittedState');
		if (!readinessResult.ok) return readinessResult;

		const lockResult = this.#beginOperation(
			APP_STATE_PHASES.REPLACING,
			'replaceCommittedState'
		);
		if (!lockResult.ok) return lockResult;

		const validationResult = this.#validateCandidate(
			nextState,
			'replace-committed-state'
		);
		if (!validationResult.ok) {
			return this.#finishReadyFailure(validationResult);
		}

		const snapshot = this.#commitSnapshot(
			validationResult.data.state,
			normalizedContext.reason
		);

		return createSuccessResult(
			{
				snapshot,
				revision: this.#revision,
				reason: normalizedContext.reason
			},
			{
				warnings: validationResult.warnings,
				metadata: {
					phase: this.#phase,
					operation: 'replaceCommittedState',
					committedExternally: true
				}
			}
		);
	}

	async resetToInitialState(context = {}) {
		const normalizedContext = normalizeContext(context, 'reset');

		const readinessResult = this.#requireReady('resetToInitialState');
		if (!readinessResult.ok) return readinessResult;

		const lockResult = this.#beginOperation(
			APP_STATE_PHASES.RESETTING,
			'resetToInitialState'
		);
		if (!lockResult.ok) return lockResult;

		const initialResult = await this.#prepareInitialState('reset');
		if (!initialResult.ok) {
			return this.#finishReadyFailure(initialResult);
		}

		const writeResult = await this.#persistAndVerify(
			initialResult.data.state,
			'resetToInitialState'
		);
		if (!writeResult.ok) {
			return this.#finishReadyFailure(writeResult);
		}

		const snapshot = this.#commitSnapshot(
			writeResult.data.state,
			normalizedContext.reason
		);

		return createSuccessResult(
			{
				snapshot,
				revision: this.#revision,
				reason: normalizedContext.reason
			},
			{
				warnings: mergeWarnings(
					initialResult.warnings,
					writeResult.warnings
				),
				metadata: {
					phase: this.#phase,
					operation: 'resetToInitialState',
					persisted: true
				}
			}
		);
	}

	getStatus() {
		const lastError = this.#lastError === null
			? null
			: Object.freeze({
				code: this.#lastError.code,
				category: this.#lastError.category,
				retryable: this.#lastError.retryable
			});

		return Object.freeze({
			phase: this.#phase,
			initialized: this.#initialized,
			operationPending: this.#operationPending,
			revision: this.#revision,
			lastError
		});
	}

	#buildOperationData(reason) {
		return {
			snapshot: this.getSnapshot(),
			revision: this.#revision,
			reason
		};
	}

	#beginOperation(phase, operation) {
		if (this.#operationPending) {
			return this.#createOperationInProgressResult(operation);
		}

		this.#operationPending = true;
		this.#phase = phase;
		return createSuccessResult(null);
	}

	#requireReady(operation) {
		if (this.#initialized && this.#phase === APP_STATE_PHASES.READY) {
			return createSuccessResult(null);
		}

		return createFailureResult(
			createStoreError({
				code: DATA_ERROR_CODES.OPERATION_IN_PROGRESS,
				userMessageKey: 'errors.state.notReady',
				technicalMessage: 'O estado da aplicação ainda não está pronto para esta operação.',
				retryable: true,
				context: {
					operation,
					phase: this.#phase,
					initialized: this.#initialized
				}
			})
		);
	}

	#createOperationInProgressResult(operation) {
		return createFailureResult(
			createStoreError({
				code: DATA_ERROR_CODES.OPERATION_IN_PROGRESS,
				userMessageKey: 'errors.operation.inProgress',
				technicalMessage: 'Já existe uma operação de estado em andamento.',
				retryable: true,
				context: {
					operation,
					phase: this.#phase
				}
			})
		);
	}

	async #prepareInitialState(stage) {
		let candidate;

		try {
			candidate = await this.#createInitialState();
			candidate = await this.#normalizeCandidate(candidate);
		} catch (cause) {
			return createFailureResult(
				createStoreError({
					code: DATA_ERROR_CODES.STATE_INVALID,
					category: DATA_ERROR_CATEGORIES.VALIDATION,
					userMessageKey: 'errors.state.invalid',
					technicalMessage: 'O estado inicial não pôde ser preparado.',
					retryable: false,
					cause,
					context: {
						operation: stage,
						stage: 'prepare-initial-state'
					}
				})
			);
		}

		return this.#validateCandidate(candidate, `${stage}-initial-state`);
	}

	async #normalizeCandidate(candidate) {
		const draft = cloneValue(candidate);
		const normalized = await this.#normalizeInternalState(draft);
		return cloneValue(normalized === undefined ? draft : normalized);
	}

	#validateCandidate(candidate, stage) {
		let result;

		try {
			result = this.#schemaService.validate(candidate);
		} catch (cause) {
			return createFailureResult(
				createStoreError({
					code: DATA_ERROR_CODES.STATE_INVALID,
					category: DATA_ERROR_CATEGORIES.VALIDATION,
					userMessageKey: 'errors.state.invalid',
					technicalMessage: 'A validação do estado falhou de forma inesperada.',
					retryable: false,
					cause,
					context: {stage}
				})
			);
		}

		if (!isResult(result)) {
			return createFailureResult(
				createStoreError({
					code: DATA_ERROR_CODES.STATE_INVALID,
					category: DATA_ERROR_CATEGORIES.VALIDATION,
					userMessageKey: 'errors.state.invalid',
					technicalMessage: 'O serviço de schema devolveu um resultado inválido.',
					retryable: false,
					context: {stage}
				})
			);
		}

		return result;
	}

	async #persistAndVerify(candidate, operation) {
		const writeResult = await this.#callRepository(
			'writePrimary',
			[candidate],
			{
				failureCode: DATA_ERROR_CODES.STORAGE_WRITE_FAILED,
				operation
			}
		);
		if (!writeResult.ok) return writeResult;

		if (!writeResult.data || !('state' in writeResult.data)) {
			return createFailureResult(
				createStoreError({
					code: DATA_ERROR_CODES.STORAGE_VERIFICATION_FAILED,
					category: DATA_ERROR_CATEGORIES.STORAGE,
					userMessageKey: 'errors.storage.verificationFailed',
					technicalMessage: 'O repositório não devolveu o estado persistido para verificação.',
					retryable: true,
					context: {
						operation,
						stage: 'verify-write-result'
					}
				}),
				{
					warnings: writeResult.warnings,
					metadata: writeResult.metadata
				}
			);
		}

		const validationResult = this.#validateCandidate(
			writeResult.data.state,
			`${operation}-persisted-state`
		);
		if (!validationResult.ok) return validationResult;

		return createSuccessResult(
			validationResult.data,
			{
				warnings: mergeWarnings(
					writeResult.warnings,
					validationResult.warnings
				),
				metadata: {
					...writeResult.metadata,
					verifiedByStore: true
				}
			}
		);
	}

	async #callRepository(methodName, args, {
		failureCode,
		operation
	}) {
		let result;

		try {
			result = await this.#repository[methodName](...args);
		} catch (cause) {
			return createFailureResult(
				createStoreError({
					code: failureCode,
					category: DATA_ERROR_CATEGORIES.STORAGE,
					userMessageKey: failureCode === DATA_ERROR_CODES.STORAGE_READ_FAILED
						? 'errors.storage.readFailed'
						: 'errors.storage.writeFailed',
					technicalMessage: `O repositório falhou durante ${methodName}.`,
					retryable: true,
					cause,
					context: {
						operation,
						methodName,
						stage: 'repository-call'
					}
				})
			);
		}

		if (!isResult(result)) {
			return createFailureResult(
				createStoreError({
					code: failureCode,
					category: DATA_ERROR_CATEGORIES.STORAGE,
					userMessageKey: failureCode === DATA_ERROR_CODES.STORAGE_READ_FAILED
						? 'errors.storage.readFailed'
						: 'errors.storage.writeFailed',
					technicalMessage: `O repositório devolveu um resultado inválido em ${methodName}.`,
					retryable: false,
					context: {
						operation,
						methodName,
						stage: 'repository-result'
					}
				})
			);
		}

		return result;
	}

	#commitSnapshot(candidate, reason) {
		this.#snapshot = createProtectedCopy(candidate);
		this.#revision += 1;
		this.#initialized = true;
		this.#operationPending = false;
		this.#phase = APP_STATE_PHASES.READY;
		this.#lastError = null;

		const publicSnapshot = this.getSnapshot();
		this.#notify(publicSnapshot, reason);
		return publicSnapshot;
	}

	#notify(snapshot, reason) {
		for (const listener of this.#listeners) {
			try {
				listener(snapshot, reason);
			} catch (error) {
				console.error('Um listener do AppStateStore falhou:', error);
			}
		}
	}

	#finishInitializationFailure(result) {
		this.#operationPending = false;
		this.#initialized = false;
		this.#phase = APP_STATE_PHASES.ERROR;
		this.#lastError = result.error;
		return result;
	}

	#finishReadyFailure(result) {
		this.#operationPending = false;
		this.#phase = APP_STATE_PHASES.READY;
		this.#lastError = result.error;
		return result;
	}
}
