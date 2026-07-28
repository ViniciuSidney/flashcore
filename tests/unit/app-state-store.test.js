import test from 'node:test';
import assert from 'node:assert/strict';

import {
	APP_STATE_PHASES,
	AppStateStore
} from '../../src/scripts/core/app-state-store.js';
import {
	DATA_ERROR_CATEGORIES,
	DATA_ERROR_CODES
} from '../../src/scripts/shared/errors/data-error.constants.js';
import {DataError} from '../../src/scripts/shared/errors/data-error.js';
import {
	createFailureResult
} from '../../src/scripts/shared/result.js';
import {
	StateSchemaService
} from '../../src/scripts/data/validation/state-schema.service.js';
import {
	InMemoryStateRepository
} from '../helpers/in-memory-state-repository.js';
import {loadJsonFixture} from '../helpers/load-json-fixture.js';

function createWriteFailure() {
	return createFailureResult(
		new DataError({
			code: DATA_ERROR_CODES.STORAGE_WRITE_FAILED,
			category: DATA_ERROR_CATEGORIES.STORAGE,
			userMessageKey: 'errors.storage.writeFailed',
			technicalMessage: 'Falha de gravação simulada.',
			retryable: true,
			context: {
				stage: 'unit-test'
			}
		})
	);
}

class FailingWriteRepository extends InMemoryStateRepository {
	writeCalls = 0;

	writePrimary() {
		this.writeCalls += 1;
		return createWriteFailure();
	}
}

class DeferredWriteRepository extends InMemoryStateRepository {
	#pendingWrite = null;
	#pendingSignalResolve = null;
	#pendingSignal = new Promise((resolve) => {
		this.#pendingSignalResolve = resolve;
	});

	writePrimary(candidate) {
		return new Promise((resolve) => {
			this.#pendingWrite = () => resolve(super.writePrimary(candidate));
			this.#pendingSignalResolve();
		});
	}

	waitUntilPending() {
		return this.#pendingSignal;
	}

	resolvePendingWrite() {
		if (this.#pendingWrite === null) {
			throw new Error('Nenhuma gravação está pendente.');
		}

		const pendingWrite = this.#pendingWrite;
		this.#pendingWrite = null;
		pendingWrite();
	}
}

function createStore({
	repository,
	initialState,
	clock = () => 1800000000000,
	normalizeInternalState = (state) => state
}) {
	return new AppStateStore({
		repository,
		schemaService: new StateSchemaService(),
		createInitialState: () => structuredClone(initialState),
		normalizeInternalState,
		clock
	});
}

test('AppStateStore inicia em estado ocioso e expõe fases estáveis', async () => {
	const initialState = await loadJsonFixture('states/state-v0.1-empty.json');
	const store = createStore({
		repository: new InMemoryStateRepository({primary: initialState}),
		initialState
	});

	assert.equal(APP_STATE_PHASES.IDLE, 'idle');
	assert.equal(APP_STATE_PHASES.READY, 'ready');
	assert.deepEqual(store.getStatus(), {
		phase: 'idle',
		initialized: false,
		operationPending: false,
		revision: 0,
		lastError: null
	});
	assert.equal(Object.isFrozen(store.getStatus()), true);
	assert.equal(store.getSnapshot(), null);
});

test('AppStateStore rejeita dependências inválidas', async () => {
	const initialState = await loadJsonFixture('states/state-v0.1-empty.json');
	const repository = new InMemoryStateRepository({primary: initialState});
	const schemaService = new StateSchemaService();

	assert.throws(
		() => new AppStateStore({
			repository: {},
			schemaService,
			createInitialState: () => initialState
		}),
		/StateRepository inválido/
	);

	assert.throws(
		() => new AppStateStore({
			repository,
			schemaService: {},
			createInitialState: () => initialState
		}),
		/schemaService deve fornecer o método validate/
	);

	assert.throws(
		() => new AppStateStore({
			repository,
			schemaService,
			createInitialState: null
		}),
		/createInitialState deve ser uma função/
	);
});

test('initialize carrega e valida o estado persistido sem regravá-lo', async () => {
	const state = await loadJsonFixture('states/state-v0.1-normal.json');
	const repository = new InMemoryStateRepository({primary: state});
	const store = createStore({repository, initialState: state});

	const result = await store.initialize();

	assert.equal(result.ok, true);
	assert.equal(result.data.source, 'primary');
	assert.equal(result.data.revision, 1);
	assert.deepEqual(repository.getPrimarySnapshot(), state);
	assert.equal(store.getStatus().phase, APP_STATE_PHASES.READY);
	assert.equal(store.getStatus().initialized, true);
});

test('initialize persiste o estado inicial antes de confirmá-lo em memória', async () => {
	const initialState = await loadJsonFixture('states/state-v0.1-empty.json');
	const repository = new InMemoryStateRepository();
	const store = createStore({repository, initialState});

	const result = await store.initialize();

	assert.equal(result.ok, true);
	assert.equal(result.data.source, 'initial');
	assert.deepEqual(repository.getPrimarySnapshot(), initialState);
	assert.deepEqual(store.getSnapshot(), initialState);
});

test('initialize não substitui silenciosamente um estado persistido inválido', async () => {
	const initialState = await loadJsonFixture('states/state-v0.1-empty.json');
	const invalidState = await loadJsonFixture('states/state-v0.1-duplicate-ids.json');
	const repository = new InMemoryStateRepository({primary: invalidState});
	const store = createStore({repository, initialState});

	const result = await store.initialize();

	assert.equal(result.ok, false);
	assert.equal(result.error.code, DATA_ERROR_CODES.STATE_INVALID);
	assert.deepEqual(repository.getPrimarySnapshot(), invalidState);
	assert.equal(store.getSnapshot(), null);
	assert.equal(store.getStatus().phase, APP_STATE_PHASES.ERROR);
});

test('initialize mantém a memória vazia quando a primeira gravação falha', async () => {
	const initialState = await loadJsonFixture('states/state-v0.1-empty.json');
	const repository = new FailingWriteRepository();
	const store = createStore({repository, initialState});

	const result = await store.initialize();

	assert.equal(result.ok, false);
	assert.equal(result.error.code, DATA_ERROR_CODES.STORAGE_WRITE_FAILED);
	assert.equal(store.getSnapshot(), null);
	assert.equal(store.getStatus().initialized, false);
	assert.equal(store.getStatus().lastError.code, DATA_ERROR_CODES.STORAGE_WRITE_FAILED);
});

test('getSnapshot devolve uma cópia profundamente protegida', async () => {
	const state = await loadJsonFixture('states/state-v0.1-normal.json');
	const store = createStore({
		repository: new InMemoryStateRepository({primary: state}),
		initialState: state
	});
	await store.initialize();

	const snapshot = store.getSnapshot();

	assert.equal(Object.isFrozen(snapshot), true);
	assert.equal(Object.isFrozen(snapshot.decks), true);
	assert.equal(Object.isFrozen(snapshot.decks[0]), true);
	assert.throws(
		() => {
			snapshot.decks[0].name = 'Alteração externa';
		},
		TypeError
	);
	assert.equal(store.getSnapshot().decks[0].name, 'Matemática');
});

test('executeMutation persiste, confirma e somente então atualiza a memória', async () => {
	const state = await loadJsonFixture('states/state-v0.1-normal.json');
	const repository = new InMemoryStateRepository({primary: state});
	const store = createStore({repository, initialState: state});
	await store.initialize();

	const notifications = [];
	store.subscribe((snapshot, reason) => {
		notifications.push({snapshot, reason});
	});

	const result = await store.executeMutation((draft) => {
		draft.settings.reviewLimit = 30;
	}, {
		reason: 'settings-update'
	});

	assert.equal(result.ok, true);
	assert.equal(result.data.snapshot.settings.reviewLimit, 30);
	assert.equal(result.data.snapshot.updatedAt, 1800000000000);
	assert.equal(repository.getPrimarySnapshot().settings.reviewLimit, 30);
	assert.equal(store.getSnapshot().settings.reviewLimit, 30);
	assert.equal(notifications.length, 1);
	assert.equal(notifications[0].reason, 'settings-update');
	assert.equal(notifications[0].snapshot.settings.reviewLimit, 30);
});

test('falha de persistência preserva o snapshot e não notifica listeners', async () => {
	const state = await loadJsonFixture('states/state-v0.1-normal.json');
	const repository = new FailingWriteRepository({primary: state});
	const store = createStore({repository, initialState: state});
	await store.initialize();

	let notifications = 0;
	store.subscribe(() => {
		notifications += 1;
	});

	const before = store.getSnapshot();
	const result = await store.executeMutation((draft) => {
		draft.settings.reviewLimit = 99;
	});

	assert.equal(result.ok, false);
	assert.equal(result.error.code, DATA_ERROR_CODES.STORAGE_WRITE_FAILED);
	assert.deepEqual(store.getSnapshot(), before);
	assert.deepEqual(repository.getPrimarySnapshot(), state);
	assert.equal(notifications, 0);
	assert.equal(store.getStatus().phase, APP_STATE_PHASES.READY);
});

test('erro do mutator não altera nem persiste o estado', async () => {
	const state = await loadJsonFixture('states/state-v0.1-normal.json');
	const repository = new InMemoryStateRepository({primary: state});
	const store = createStore({repository, initialState: state});
	await store.initialize();

	const result = await store.executeMutation(() => {
		throw new Error('Mutação interrompida');
	});

	assert.equal(result.ok, false);
	assert.equal(result.error.code, DATA_ERROR_CODES.STATE_INVALID);
	assert.deepEqual(store.getSnapshot(), state);
	assert.deepEqual(repository.getPrimarySnapshot(), state);
});

test('uma mutação pendente bloqueia outra mutação simultânea', async () => {
	const state = await loadJsonFixture('states/state-v0.1-normal.json');
	const repository = new DeferredWriteRepository({primary: state});
	const store = createStore({repository, initialState: state});
	await store.initialize();

	const firstMutation = store.executeMutation((draft) => {
		draft.settings.reviewLimit = 25;
	});

	await repository.waitUntilPending();

	const blocked = await store.executeMutation((draft) => {
		draft.settings.reviewLimit = 50;
	});

	assert.equal(blocked.ok, false);
	assert.equal(blocked.error.code, DATA_ERROR_CODES.OPERATION_IN_PROGRESS);
	assert.equal(store.getStatus().operationPending, true);

	repository.resolvePendingWrite();
	const completed = await firstMutation;

	assert.equal(completed.ok, true);
	assert.equal(store.getSnapshot().settings.reviewLimit, 25);
});

test('replaceCommittedState troca somente a memória após nova validação', async () => {
	const state = await loadJsonFixture('states/state-v0.1-normal.json');
	const repository = new InMemoryStateRepository({primary: state});
	const store = createStore({repository, initialState: state});
	await store.initialize();

	const replacement = structuredClone(state);
	replacement.decks[0].name = 'Baralho restaurado';

	const result = await store.replaceCommittedState(replacement, 'restore');

	assert.equal(result.ok, true);
	assert.equal(store.getSnapshot().decks[0].name, 'Baralho restaurado');
	assert.equal(repository.getPrimarySnapshot().decks[0].name, 'Matemática');
	assert.equal(result.metadata.committedExternally, true);
});

test('resetToInitialState persiste e confirma o estado inicial', async () => {
	const state = await loadJsonFixture('states/state-v0.1-normal.json');
	const initialState = await loadJsonFixture('states/state-v0.1-empty.json');
	const repository = new InMemoryStateRepository({primary: state});
	const store = createStore({repository, initialState});
	await store.initialize();

	const result = await store.resetToInitialState({reason: 'delete-all'});

	assert.equal(result.ok, true);
	assert.deepEqual(store.getSnapshot(), initialState);
	assert.deepEqual(repository.getPrimarySnapshot(), initialState);
	assert.equal(result.data.reason, 'delete-all');
});

test('subscribe permite cancelar notificações futuras', async () => {
	const state = await loadJsonFixture('states/state-v0.1-normal.json');
	const store = createStore({
		repository: new InMemoryStateRepository({primary: state}),
		initialState: state
	});
	await store.initialize();

	let notifications = 0;
	const unsubscribe = store.subscribe(() => {
		notifications += 1;
	});
	unsubscribe();

	await store.executeMutation((draft) => {
		draft.settings.reviewLimit = 40;
	});

	assert.equal(notifications, 0);
});
