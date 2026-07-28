import test from 'node:test';
import assert from 'node:assert/strict';

import {FakeStorage} from '../helpers/fake-storage.js';
import {loadJsonFixture} from '../helpers/load-json-fixture.js';

const PRIMARY_KEY = 'flashcore.app.v0.1';
const LEGACY_KEY = 'flashcore.v1.1';
let importSequence = 0;

function installStorage(storage) {
	const previousDescriptor = Object.getOwnPropertyDescriptor(
		globalThis,
		'localStorage'
	);

	Object.defineProperty(globalThis, 'localStorage', {
		configurable: true,
		writable: true,
		value: storage
	});

	return () => {
		if (previousDescriptor) {
			Object.defineProperty(
				globalThis,
				'localStorage',
				previousDescriptor
			);
			return;
		}

		delete globalThis.localStorage;
	};
}

async function importStateWithStorage(storage) {
	const restoreStorage = installStorage(storage);
	const moduleUrl = new URL(
		'../../src/scripts/core/state.js',
		import.meta.url
	);
	moduleUrl.searchParams.set('integration', String(++importSequence));

	try {
		const stateModule = await import(moduleUrl.href);
		return {stateModule, restoreStorage};
	} catch (error) {
		restoreStorage();
		throw error;
	}
}

async function withStateModule(storage, callback) {
	const {stateModule, restoreStorage} = await importStateWithStorage(storage);
	try {
		return await callback(stateModule);
	} finally {
		restoreStorage();
	}
}

test('state.js conecta a aplicação ao AppStateStore', async (t) => {
	await t.test('inicializa a chave principal homologada antes do primeiro acesso', async () => {
		const state = await loadJsonFixture('states/state-v0.1-normal.json');
		const storage = new FakeStorage({
			entries: {[PRIMARY_KEY]: JSON.stringify(state)}
		});

		await withStateModule(storage, async (stateModule) => {
			assert.throws(() => stateModule.getState(), /ainda não foi inicializado/);

			const initialization = await stateModule.initializeState();

			assert.equal(initialization.ok, true);
			assert.equal(initialization.data.source, 'primary');
			assert.equal(stateModule.getState().decks.length, 2);
			assert.equal(stateModule.getStateStatus().phase, 'ready');
		});
	});

	await t.test('migra a fonte legada e preserva sua chave', async () => {
		const legacy = await loadJsonFixture('states/state-legacy-v1.1.json');
		const serializedLegacy = JSON.stringify(legacy);
		const storage = new FakeStorage({
			entries: {[LEGACY_KEY]: serializedLegacy}
		});

		await withStateModule(storage, async (stateModule) => {
			const initialization = await stateModule.initializeState();
			const persisted = JSON.parse(storage.getItem(PRIMARY_KEY));

			assert.equal(initialization.ok, true);
			assert.equal(stateModule.getState().decks[0].id, 'legacy-deck-001');
			assert.equal(persisted.schemaVersion, 1);
			assert.deepEqual(persisted.sessions, []);
			assert.equal(storage.getItem(LEGACY_KEY), serializedLegacy);
		});
	});

	await t.test('mutateState persiste antes de publicar o novo snapshot', async () => {
		const emptyState = await loadJsonFixture('states/state-v0.1-empty.json');
		const storage = new FakeStorage({
			entries: {[PRIMARY_KEY]: JSON.stringify(emptyState)}
		});

		await withStateModule(storage, async (stateModule) => {
			await stateModule.initializeState();
			const notifications = [];
			const unsubscribe = stateModule.subscribeState(
				(snapshot, reason) => notifications.push({snapshot, reason})
			);

			const result = await stateModule.mutateState((draft) => {
				draft.decks.push({
					id: 'deck-c3',
					name: 'Integração C3',
					description: '',
					color: '#2563eb',
					icon: '📘',
					createdAt: 1700000000000,
					updatedAt: 1700000000000,
					lastOpenedAt: 0
				});
			}, 'integration-test');
			unsubscribe();

			const persisted = JSON.parse(storage.getItem(PRIMARY_KEY));

			assert.equal(result.ok, true);
			assert.equal(result.data.snapshot.decks.length, 1);
			assert.deepEqual(persisted, result.data.snapshot);
			assert.equal(stateModule.getState().decks.length, 1);
			assert.equal(notifications.length, 1);
			assert.equal(notifications[0].reason, 'integration-test');
		});
	});

	await t.test('getState entrega snapshots protegidos contra mutação externa', async () => {
		const state = await loadJsonFixture('states/state-v0.1-normal.json');
		const storage = new FakeStorage({
			entries: {[PRIMARY_KEY]: JSON.stringify(state)}
		});

		await withStateModule(storage, async (stateModule) => {
			await stateModule.initializeState();
			const snapshot = stateModule.getState();

			assert.equal(Object.isFrozen(snapshot), true);
			assert.equal(Object.isFrozen(snapshot.decks[0]), true);
			assert.throws(() => {
				snapshot.decks[0].name = 'Alteração externa';
			}, TypeError);
			assert.equal(stateModule.getState().decks[0].name, 'Matemática');
		});
	});

	await t.test('replaceState mantém a substituição completa homologada', async () => {
		const emptyState = await loadJsonFixture('states/state-v0.1-empty.json');
		const normalState = await loadJsonFixture('states/state-v0.1-normal.json');
		const storage = new FakeStorage({
			entries: {[PRIMARY_KEY]: JSON.stringify(emptyState)}
		});

		await withStateModule(storage, async (stateModule) => {
			await stateModule.initializeState();
			const result = await stateModule.replaceState(
				normalState,
				'integration-replace'
			);
			const persisted = JSON.parse(storage.getItem(PRIMARY_KEY));

			assert.equal(result.ok, true);
			assert.equal(result.data.snapshot.decks.length, 2);
			assert.equal(result.data.snapshot.cards.length, 3);
			assert.deepEqual(persisted, result.data.snapshot);
		});
	});

	await t.test('resetState reinicializa somente a chave principal', async () => {
		const normalState = await loadJsonFixture('states/state-v0.1-normal.json');
		const serializedLegacy = JSON.stringify({decks: [], cards: []});
		const storage = new FakeStorage({
			entries: {
				[PRIMARY_KEY]: JSON.stringify(normalState),
				[LEGACY_KEY]: serializedLegacy
			}
		});

		await withStateModule(storage, async (stateModule) => {
			await stateModule.initializeState();
			const result = await stateModule.resetState();
			const persisted = JSON.parse(storage.getItem(PRIMARY_KEY));

			assert.equal(result.ok, true);
			assert.deepEqual(result.data.snapshot.decks, []);
			assert.deepEqual(result.data.snapshot.cards, []);
			assert.deepEqual(result.data.snapshot.sessions, []);
			assert.deepEqual(persisted, result.data.snapshot);
			assert.equal(storage.getItem(LEGACY_KEY), serializedLegacy);
		});
	});

	await t.test('falha de gravação preserva memória, persistência e listeners', async () => {
		const emptyState = await loadJsonFixture('states/state-v0.1-empty.json');
		let failWrites = false;
		const storage = new FakeStorage({
			entries: {[PRIMARY_KEY]: JSON.stringify(emptyState)},
			failures: {
				setItem: () => failWrites ? new Error('Falha simulada') : null
			}
		});

		await withStateModule(storage, async (stateModule) => {
			await stateModule.initializeState();
			let notifications = 0;
			stateModule.subscribeState(() => {
				notifications += 1;
			});
			failWrites = true;

			const originalConsoleError = console.error;
			console.error = () => {};
			try {
				const result = await stateModule.mutateState((draft) => {
					draft.settings.theme = 'dark';
				});
				const persisted = JSON.parse(storage.getItem(PRIMARY_KEY));

				assert.equal(result.ok, false);
				assert.equal(result.error.code, 'STORAGE_WRITE_FAILED');
				assert.equal(stateModule.getState().settings.theme, 'system');
				assert.equal(persisted.settings.theme, 'system');
				assert.equal(notifications, 0);
			} finally {
				console.error = originalConsoleError;
			}
		});
	});
});
