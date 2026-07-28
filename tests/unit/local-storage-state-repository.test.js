import test from 'node:test';
import assert from 'node:assert/strict';

import {APP_CONFIG} from '../../src/scripts/core/config.js';
import {
	LocalStorageStateRepository
} from '../../src/scripts/data/local/local-storage-state-repository.js';
import {
	DATA_ERROR_CATEGORIES,
	DATA_ERROR_CODES
} from '../../src/scripts/shared/errors/data-error.constants.js';
import {isDataError} from '../../src/scripts/shared/errors/data-error.js';
import {isResult} from '../../src/scripts/shared/result.js';
import {FakeStorage} from '../helpers/fake-storage.js';
import {loadJsonFixture} from '../helpers/load-json-fixture.js';

const PRIMARY_KEY = APP_CONFIG.storageKey;
const LEGACY_KEY = APP_CONFIG.legacyStorageKeys[0];

function createRepository(storage, options = {}) {
	return new LocalStorageStateRepository({
		storage,
		probeKey: 'flashcore.test.probe',
		...options
	});
}

test('adaptador local mantém as chaves homologadas da v0.1', () => {
	const storage = new FakeStorage();
	const repository = createRepository(storage);
	const info = repository.getStorageInfo();

	assert.equal(info.ok, true);
	assert.equal(info.data.technology, 'localStorage');
	assert.equal(info.data.primaryKey, 'flashcore.app.v0.1');
	assert.deepEqual(info.data.legacyKeys, ['flashcore.v1.1']);
	assert.equal(PRIMARY_KEY, 'flashcore.app.v0.1');
	assert.equal(LEGACY_KEY, 'flashcore.v1.1');
});

test('readPrimary informa ausência sem criar estado silenciosamente', () => {
	const storage = new FakeStorage();
	const repository = createRepository(storage);
	const result = repository.readPrimary();

	assert.equal(isResult(result), true);
	assert.equal(result.ok, true);
	assert.deepEqual(result.data, {
		state: null,
		key: PRIMARY_KEY,
		exists: false
	});
	assert.deepEqual(storage.getSnapshot(), {});
});

test('readPrimary devolve o estado bruto sem normalização silenciosa', async () => {
	const state = await loadJsonFixture(
		'states/state-v0.1-normal.json'
	);
	state.extraField = 'preservado';

	const storage = new FakeStorage({
		entries: {
			[PRIMARY_KEY]: JSON.stringify(state)
		}
	});
	const repository = createRepository(storage);
	const result = repository.readPrimary();

	assert.equal(result.ok, true);
	assert.equal(result.data.exists, true);
	assert.deepEqual(result.data.state, state);
	assert.equal(result.data.state.extraField, 'preservado');
	assert.equal(result.metadata.bytes > 0, true);
});

test('readPrimary transforma JSON corrompido em DataError controlado', () => {
	const storage = new FakeStorage({
		entries: {
			[PRIMARY_KEY]: '{"schemaVersion": 1'
		}
	});
	const repository = createRepository(storage);
	const result = repository.readPrimary();

	assert.equal(result.ok, false);
	assert.equal(isDataError(result.error), true);
	assert.equal(
		result.error.code,
		DATA_ERROR_CODES.STORAGE_READ_FAILED
	);
	assert.equal(
		result.error.category,
		DATA_ERROR_CATEGORIES.SERIALIZATION
	);
	assert.equal(result.error.context.stage, 'parse');
	assert.equal(storage.getItem(PRIMARY_KEY), '{"schemaVersion": 1');
});

test('writePrimary grava, relê e confirma uma cópia independente', async () => {
	const state = await loadJsonFixture(
		'states/state-v0.1-normal.json'
	);
	const storage = new FakeStorage();
	const repository = createRepository(storage);
	const result = repository.writePrimary(state);

	state.decks[0].name = 'Alterado depois da gravação';
	result.data.state.cards[0].front = 'Alterado no resultado';

	const read = repository.readPrimary();

	assert.equal(result.ok, true);
	assert.equal(result.data.verified, true);
	assert.equal(result.metadata.verified, true);
	assert.equal(read.data.state.decks[0].name, 'Matemática');
	assert.equal(
		read.data.state.cards[0].front,
		'Qual é a fórmula da área do círculo?'
	);
});

test('writePrimary rejeita candidatos sem representação JSON', () => {
	const storage = new FakeStorage();
	const repository = createRepository(storage);
	const circular = {};
	circular.self = circular;

	const result = repository.writePrimary(circular);

	assert.equal(result.ok, false);
	assert.equal(
		result.error.code,
		DATA_ERROR_CODES.STORAGE_WRITE_FAILED
	);
	assert.equal(
		result.error.category,
		DATA_ERROR_CATEGORIES.SERIALIZATION
	);
	assert.equal(result.error.context.stage, 'serialize');
	assert.deepEqual(storage.getSnapshot(), {});
});

test('writePrimary diferencia cota excedida de falha genérica', () => {
	const quotaError = new Error('Cota excedida');
	quotaError.name = 'QuotaExceededError';

	const storage = new FakeStorage({
		failures: {
			setItem: quotaError
		}
	});
	const repository = createRepository(storage);
	const result = repository.writePrimary({schemaVersion: 1});

	assert.equal(result.ok, false);
	assert.equal(
		result.error.code,
		DATA_ERROR_CODES.STORAGE_QUOTA_EXCEEDED
	);
	assert.equal(result.error.retryable, false);
});

test('writePrimary detecta divergência na verificação posterior', () => {
	const storage = new FakeStorage({
		setTransform: ({key, value}) =>
			key === PRIMARY_KEY ? `${value} ` : value
	});
	const repository = createRepository(storage);
	const result = repository.writePrimary({schemaVersion: 1});

	assert.equal(result.ok, false);
	assert.equal(
		result.error.code,
		DATA_ERROR_CODES.STORAGE_VERIFICATION_FAILED
	);
	assert.equal(result.error.context.stage, 'compare');
	assert.equal(result.metadata.verified, false);
});

test('replaceSafely usa a estratégia transitória verificada da v0.1', async () => {
	const emptyState = await loadJsonFixture(
		'states/state-v0.1-empty.json'
	);
	const normalState = await loadJsonFixture(
		'states/state-v0.1-normal.json'
	);
	const storage = new FakeStorage({
		entries: {
			[PRIMARY_KEY]: JSON.stringify(emptyState)
		}
	});
	const repository = createRepository(storage);
	const result = repository.replaceSafely(normalState, {
		reason: 'unit-test'
	});

	assert.equal(result.ok, true);
	assert.deepEqual(result.data.previousState, emptyState);
	assert.deepEqual(result.data.state, normalState);
	assert.equal(result.data.verified, true);
	assert.equal(result.data.rolledBack, false);
	assert.equal(result.metadata.strategy, 'verified-direct-v0.1');
	assert.equal(result.metadata.transitional, true);
	assert.equal(result.metadata.options.reason, 'unit-test');
});

test('clearPrimary remove somente a chave principal e confirma a remoção', async () => {
	const state = await loadJsonFixture(
		'states/state-v0.1-normal.json'
	);
	const storage = new FakeStorage({
		entries: {
			[PRIMARY_KEY]: JSON.stringify(state),
			[LEGACY_KEY]: JSON.stringify({decks: [], cards: []}),
			'outro.app': 'preservado'
		}
	});
	const repository = createRepository(storage);
	const result = repository.clearPrimary({reason: 'reset'});

	assert.equal(result.ok, true);
	assert.equal(result.data.cleared, true);
	assert.deepEqual(result.data.previousState, state);
	assert.equal(result.metadata.verified, true);
	assert.equal(storage.getItem(PRIMARY_KEY), null);
	assert.notEqual(storage.getItem(LEGACY_KEY), null);
	assert.equal(storage.getItem('outro.app'), 'preservado');
});

test('clearPrimary também remove uma chave corrompida sem criar fallback', () => {
	const storage = new FakeStorage({
		entries: {
			[PRIMARY_KEY]: '{inválido'
		}
	});
	const repository = createRepository(storage);
	const result = repository.clearPrimary();

	assert.equal(result.ok, true);
	assert.equal(result.data.previousState, null);
	assert.equal(result.metadata.previousStateReadable, false);
	assert.equal(storage.getItem(PRIMARY_KEY), null);
});

test('readLegacySources consulta fontes autorizadas sem alterá-las', () => {
	const legacyState = {
		settings: {theme: 'dark'},
		decks: [],
		cards: []
	};
	const serializedLegacy = JSON.stringify(legacyState);
	const storage = new FakeStorage({
		entries: {
			[LEGACY_KEY]: serializedLegacy,
			'fonte.nao.autorizada': JSON.stringify({secret: true})
		}
	});
	const repository = createRepository(storage);
	const result = repository.readLegacySources();

	assert.equal(result.ok, true);
	assert.deepEqual(result.data, [{
		key: LEGACY_KEY,
		state: legacyState,
		exists: true
	}]);
	assert.equal(result.metadata.count, 1);
	assert.deepEqual(result.metadata.checkedKeys, [LEGACY_KEY]);
	assert.equal(storage.getItem(LEGACY_KEY), serializedLegacy);
});

test('recuperação permanece neutra enquanto staging e rollback não existem', () => {
	const repository = createRepository(new FakeStorage());
	const result = repository.recoverInterruptedOperation();

	assert.equal(result.ok, true);
	assert.deepEqual(result.data, {
		recovered: false,
		source: null,
		state: null
	});
	assert.equal(
		result.metadata.reason,
		'recovery-keys-not-configured'
	);
	assert.equal(result.metadata.transitional, true);
});

test('getStorageInfo testa acesso sem apagar um valor de prova existente', () => {
	const storage = new FakeStorage({
		entries: {
			'flashcore.test.probe': 'valor-anterior'
		}
	});
	const repository = createRepository(storage);
	const result = repository.getStorageInfo();

	assert.equal(result.ok, true);
	assert.equal(result.data.available, true);
	assert.equal(result.data.readable, true);
	assert.equal(result.data.writable, true);
	assert.equal(
		storage.getItem('flashcore.test.probe'),
		'valor-anterior'
	);
});

test('armazenamento indisponível gera falha estruturada e diagnóstico seguro', () => {
	const repository = createRepository(null);
	const read = repository.readPrimary();
	const write = repository.writePrimary({schemaVersion: 1});
	const info = repository.getStorageInfo();

	assert.equal(read.ok, false);
	assert.equal(write.ok, false);
	assert.equal(
		read.error.code,
		DATA_ERROR_CODES.STORAGE_UNAVAILABLE
	);
	assert.equal(
		write.error.code,
		DATA_ERROR_CODES.STORAGE_UNAVAILABLE
	);
	assert.equal(info.ok, true);
	assert.equal(info.data.available, false);
	assert.equal(info.data.readable, false);
	assert.equal(info.data.writable, false);
});

test('construtor rejeita chaves e opções estruturais inválidas', () => {
	const storage = new FakeStorage();

	assert.throws(
		() => createRepository(storage, {primaryKey: ''}),
		/primaryKey deve ser uma string não vazia/
	);
	assert.throws(
		() => createRepository(storage, {legacyKeys: 'inválido'}),
		/legacyKeys deve ser uma lista/
	);
	assert.throws(
		() => createRepository(storage).clearPrimary([]),
		/options deve ser um objeto/
	);
});
