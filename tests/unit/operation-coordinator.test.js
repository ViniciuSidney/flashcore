import test from 'node:test';
import assert from 'node:assert/strict';

import {
	DATA_ERROR_CATEGORIES,
	DATA_ERROR_CODES
} from '../../src/scripts/shared/errors/data-error.constants.js';
import {isDataError} from '../../src/scripts/shared/errors/data-error.js';
import {isResult} from '../../src/scripts/shared/result.js';
import {
	OperationCoordinator,
	OPERATION_TYPES,
	isExclusiveOperationType
} from '../../src/scripts/core/operation-coordinator.js';

function createCoordinator() {
	let nextId = 1;
	let now = 1700000000000;

	return new OperationCoordinator({
		clock: () => now++,
		idFactory: () => `operation-${nextId++}`
	});
}

test('tipos de operação e políticas exclusivas permanecem estáveis', () => {
	assert.equal(OPERATION_TYPES.RESTORE_LOCAL, 'restore-local');
	assert.equal(OPERATION_TYPES.REMOTE_UPLOAD, 'remote-upload');
	assert.equal(
		isExclusiveOperationType(OPERATION_TYPES.MIGRATION),
		true
	);
	assert.equal(
		isExclusiveOperationType(OPERATION_TYPES.REMOTE_UPLOAD),
		false
	);
});

test('acquire registra uma operação e devolve Result de sucesso', () => {
	const coordinator = createCoordinator();
	const result = coordinator.acquire(OPERATION_TYPES.RESTORE_LOCAL, {
		context: {
			source: 'file'
		}
	});

	assert.equal(isResult(result), true);
	assert.equal(result.ok, true);
	assert.equal(result.data.id, 'operation-1');
	assert.equal(result.data.type, 'restore-local');
	assert.equal(result.data.startedAt, 1700000000000);
	assert.equal(result.data.exclusive, true);
	assert.equal(result.data.context.source, 'file');
	assert.equal(result.metadata.activeCount, 1);
	assert.equal(Object.isFrozen(result.data), true);
	assert.equal(Object.isFrozen(result.data.context), true);
});

test('operações duplicadas do mesmo tipo são bloqueadas', () => {
	const coordinator = createCoordinator();

	coordinator.acquire(OPERATION_TYPES.REMOTE_UPLOAD);
	const duplicate = coordinator.acquire(OPERATION_TYPES.REMOTE_UPLOAD);

	assert.equal(duplicate.ok, false);
	assert.equal(isDataError(duplicate.error), true);
	assert.equal(
		duplicate.error.code,
		DATA_ERROR_CODES.OPERATION_IN_PROGRESS
	);
	assert.equal(
		duplicate.error.category,
		DATA_ERROR_CATEGORIES.OPERATION
	);
	assert.equal(duplicate.error.retryable, true);
	assert.equal(
		duplicate.error.context.requestedType,
		OPERATION_TYPES.REMOTE_UPLOAD
	);
	assert.deepEqual(
		duplicate.error.context.activeTypes,
		[OPERATION_TYPES.REMOTE_UPLOAD]
	);
	assert.equal(
		Object.isFrozen(duplicate.error.context.activeTypes),
		true
	);
});

test('uma operação exclusiva bloqueia outra operação exclusiva', () => {
	const coordinator = createCoordinator();

	coordinator.acquire(OPERATION_TYPES.MIGRATION);
	const restore = coordinator.acquire(OPERATION_TYPES.RESTORE_CLOUD);

	assert.equal(restore.ok, false);
	assert.equal(
		restore.error.code,
		DATA_ERROR_CODES.OPERATION_IN_PROGRESS
	);
	assert.equal(coordinator.isLocked(OPERATION_TYPES.DELETE_ALL), true);
});

test('operações remotas diferentes podem coexistir sem duplicidade', () => {
	const coordinator = createCoordinator();

	const upload = coordinator.acquire(OPERATION_TYPES.REMOTE_UPLOAD);
	const deletion = coordinator.acquire(OPERATION_TYPES.REMOTE_DELETE);

	assert.equal(upload.ok, true);
	assert.equal(deletion.ok, true);
	assert.equal(coordinator.getActiveOperations().length, 2);
	assert.equal(coordinator.isLocked(OPERATION_TYPES.REMOTE_UPLOAD), true);
	assert.equal(coordinator.isLocked(OPERATION_TYPES.REMOTE_DELETE), true);
});

test('release libera uma operação ativa e informa o estado atualizado', () => {
	const coordinator = createCoordinator();
	const acquired = coordinator.acquire(OPERATION_TYPES.DELETE_ALL);
	const released = coordinator.release(acquired.data.id);

	assert.equal(released.ok, true);
	assert.equal(released.data.released, true);
	assert.equal(released.data.operation.id, acquired.data.id);
	assert.equal(released.metadata.activeCount, 0);
	assert.equal(coordinator.isLocked(OPERATION_TYPES.DELETE_ALL), false);
});

test('release é idempotente para um identificador já ausente', () => {
	const coordinator = createCoordinator();
	const result = coordinator.release('operation-inexistente');

	assert.equal(result.ok, true);
	assert.equal(result.data.released, false);
	assert.equal(result.data.operation, null);
	assert.equal(result.metadata.reason, 'not-found');
	assert.equal(result.metadata.activeCount, 0);
});

test('getActiveOperations devolve uma lista protegida', () => {
	const coordinator = createCoordinator();

	coordinator.acquire(OPERATION_TYPES.REMOTE_UPLOAD);
	const activeOperations = coordinator.getActiveOperations();

	assert.equal(Object.isFrozen(activeOperations), true);
	assert.equal(Object.isFrozen(activeOperations[0]), true);
	assert.throws(
		() => activeOperations.push({id: 'forjado'}),
		TypeError
	);
	assert.equal(coordinator.getActiveOperations().length, 1);
});

test('coordenadores independentes não compartilham bloqueios', () => {
	const first = createCoordinator();
	const second = createCoordinator();

	first.acquire(OPERATION_TYPES.MIGRATION);

	assert.equal(first.isLocked(OPERATION_TYPES.RESTORE_LOCAL), true);
	assert.equal(second.isLocked(OPERATION_TYPES.RESTORE_LOCAL), false);
});

test('OperationCoordinator rejeita dependências e entradas inválidas', () => {
	assert.throws(
		() => new OperationCoordinator({clock: 123}),
		/clock deve ser uma função/
	);
	assert.throws(
		() => new OperationCoordinator({idFactory: 'id'}),
		/idFactory deve ser uma função/
	);

	const coordinator = createCoordinator();

	assert.throws(
		() => coordinator.acquire(''),
		/operationType deve ser uma string não vazia/
	);
	assert.throws(
		() => coordinator.acquire(OPERATION_TYPES.MIGRATION, {
			context: []
		}),
		/context deve ser um objeto/
	);
	assert.throws(
		() => coordinator.release(''),
		/operationId deve ser uma string não vazia/
	);
});
