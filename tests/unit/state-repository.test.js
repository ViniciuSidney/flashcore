import test from 'node:test';
import assert from 'node:assert/strict';

import {
	STATE_REPOSITORY_METHODS,
	StateRepository,
	assertStateRepository,
	getMissingStateRepositoryMethods,
	isStateRepository
} from '../../src/scripts/data/contracts/state-repository.js';
import {isResult} from '../../src/scripts/shared/result.js';
import {InMemoryStateRepository} from '../helpers/in-memory-state-repository.js';
import {loadJsonFixture} from '../helpers/load-json-fixture.js';

test('contrato StateRepository mantém as operações mínimas aprovadas', () => {
	assert.deepEqual(STATE_REPOSITORY_METHODS, [
		'readPrimary',
		'writePrimary',
		'replaceSafely',
		'clearPrimary',
		'readLegacySources',
		'recoverInterruptedOperation',
		'getStorageInfo'
	]);
	assert.equal(Object.isFrozen(STATE_REPOSITORY_METHODS), true);
});

test('StateRepository não pode ser instanciado diretamente', () => {
	assert.throws(
		() => new StateRepository(),
		/contrato abstrato/
	);
});

test('subclasse incompleta não satisfaz o contrato', () => {
	class IncompleteRepository extends StateRepository {
		readPrimary() {
			return null;
		}
	}

	const repository = new IncompleteRepository();
	const missingMethods = getMissingStateRepositoryMethods(repository);

	assert.equal(isStateRepository(repository), false);
	assert.deepEqual(missingMethods, [
		'writePrimary',
		'replaceSafely',
		'clearPrimary',
		'readLegacySources',
		'recoverInterruptedOperation',
		'getStorageInfo'
	]);
	assert.equal(Object.isFrozen(missingMethods), true);
	assert.throws(
		() => assertStateRepository(repository),
		/writePrimary, replaceSafely/
	);
});

test('objeto compatível por contrato é aceito sem herança obrigatória', () => {
	const repository = Object.fromEntries(
		STATE_REPOSITORY_METHODS.map((methodName) => [
			methodName,
			() => null
		])
	);

	assert.equal(isStateRepository(repository), true);
	assert.equal(assertStateRepository(repository), repository);
	assert.deepEqual(getMissingStateRepositoryMethods(repository), []);
});

test('valores ausentes ou não objetos são rejeitados pelo contrato', () => {
	assert.equal(isStateRepository(null), false);
	assert.equal(isStateRepository({}), false);
	assert.deepEqual(
		getMissingStateRepositoryMethods(null),
		STATE_REPOSITORY_METHODS
	);
	assert.throws(
		() => assertStateRepository(null),
		/StateRepository inválido/
	);
});

test('InMemoryStateRepository implementa integralmente o contrato', () => {
	const repository = new InMemoryStateRepository();

	assert.ok(repository instanceof StateRepository);
	assert.equal(isStateRepository(repository), true);
	assert.equal(assertStateRepository(repository), repository);
});

test('readPrimary informa ausência sem criar estado silenciosamente', () => {
	const repository = new InMemoryStateRepository();
	const result = repository.readPrimary();

	assert.equal(isResult(result), true);
	assert.equal(result.ok, true);
	assert.deepEqual(result.data, {
		state: null,
		key: 'memory.flashcore.primary',
		exists: false
	});
	assert.equal(result.metadata.exists, false);
});

test('writePrimary armazena e devolve cópias independentes verificadas', async () => {
	const original = await loadJsonFixture(
		'states/state-v0.1-normal.json'
	);
	const repository = new InMemoryStateRepository();
	const written = repository.writePrimary(original);

	original.decks[0].name = 'Alterado fora do repositório';
	written.data.state.cards[0].front = 'Alterado no resultado';

	const read = repository.readPrimary();

	assert.equal(written.ok, true);
	assert.equal(written.data.verified, true);
	assert.equal(read.data.exists, true);
	assert.equal(read.data.state.decks[0].name, 'Matemática');
	assert.equal(
		read.data.state.cards[0].front,
		'Qual é a fórmula da área do círculo?'
	);
});

test('replaceSafely preserva a cópia anterior e confirma o candidato', async () => {
	const emptyState = await loadJsonFixture(
		'states/state-v0.1-empty.json'
	);
	const normalState = await loadJsonFixture(
		'states/state-v0.1-normal.json'
	);
	const repository = new InMemoryStateRepository({
		primary: emptyState
	});

	const result = repository.replaceSafely(normalState, {
		reason: 'unit-test'
	});

	assert.equal(result.ok, true);
	assert.equal(result.data.verified, true);
	assert.equal(result.data.rolledBack, false);
	assert.deepEqual(result.data.previousState, emptyState);
	assert.deepEqual(repository.getPrimarySnapshot(), normalState);
	assert.equal(result.metadata.options.reason, 'unit-test');
});

test('clearPrimary remove somente a cópia principal em memória', async () => {
	const state = await loadJsonFixture(
		'states/state-v0.1-normal.json'
	);
	const repository = new InMemoryStateRepository({
		primary: state
	});

	const cleared = repository.clearPrimary({
		reason: 'reset'
	});
	const read = repository.readPrimary();

	assert.equal(cleared.ok, true);
	assert.equal(cleared.data.cleared, true);
	assert.deepEqual(cleared.data.previousState, state);
	assert.equal(read.data.exists, false);
	assert.equal(read.data.state, null);
});

test('fontes legadas, recuperação e informações de armazenamento são isoladas', () => {
	const legacySources = [{
		key: 'flashcore.app.v0.1',
		state: {
			schemaVersion: 1
		}
	}];
	const repository = new InMemoryStateRepository({legacySources});

	const legacyResult = repository.readLegacySources();
	const recoveryResult = repository.recoverInterruptedOperation();
	const infoResult = repository.getStorageInfo();

	legacySources[0].state.schemaVersion = 999;
	legacyResult.data[0].state.schemaVersion = 2;

	assert.equal(
		repository.readLegacySources().data[0].state.schemaVersion,
		1
	);
	assert.deepEqual(recoveryResult.data, {
		recovered: false,
		source: null,
		state: null
	});
	assert.equal(infoResult.data.technology, 'memory');
	assert.equal(infoResult.data.available, true);
	assert.equal(infoResult.data.writable, true);
});

test('InMemoryStateRepository rejeita configuração legada inválida', () => {
	assert.throws(
		() => new InMemoryStateRepository({
			legacySources: 'inválido'
		}),
		/legacySources deve ser uma lista/
	);
});
