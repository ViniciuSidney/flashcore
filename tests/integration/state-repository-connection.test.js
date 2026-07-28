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
		return await import(moduleUrl.href);
	} finally {
		restoreStorage();
	}
}

test('state.js usa StateRepository sem alterar o fluxo funcional', async (t) => {
	await t.test('carrega a chave principal homologada', async () => {
		const state = await loadJsonFixture(
			'states/state-v0.1-normal.json'
		);
		const storage = new FakeStorage({
			entries: {
				[PRIMARY_KEY]: JSON.stringify(state)
			}
		});
		const stateModule = await importStateWithStorage(storage);

		assert.equal(stateModule.getState().decks.length, 2);
		assert.equal(stateModule.getState().cards.length, 3);
		assert.equal(
			stateModule.getState().decks[0].id,
			'deck-matematica'
		);
	});

	await t.test('migra a fonte legada e preserva sua chave', async () => {
		const legacy = await loadJsonFixture(
			'states/state-legacy-v1.1.json'
		);
		const serializedLegacy = JSON.stringify(legacy);
		const storage = new FakeStorage({
			entries: {
				[LEGACY_KEY]: serializedLegacy
			}
		});
		const stateModule = await importStateWithStorage(storage);
		const persisted = JSON.parse(storage.getItem(PRIMARY_KEY));

		assert.equal(
			stateModule.getState().decks[0].id,
			'legacy-deck-001'
		);
		assert.equal(persisted.schemaVersion, 1);
		assert.deepEqual(persisted.sessions, []);
		assert.equal(storage.getItem(LEGACY_KEY), serializedLegacy);
	});

	await t.test('mutateState persiste e notifica os listeners', async () => {
		const emptyState = await loadJsonFixture(
			'states/state-v0.1-empty.json'
		);
		const storage = new FakeStorage({
			entries: {
				[PRIMARY_KEY]: JSON.stringify(emptyState)
			}
		});
		const stateModule = await importStateWithStorage(storage);
		const notifications = [];
		const unsubscribe = stateModule.subscribeState(
			(snapshot, reason) => notifications.push({snapshot, reason})
		);

		const result = stateModule.mutateState((draft) => {
			draft.decks.push({
				id: 'deck-b5',
				name: 'Integração B5',
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

		assert.equal(result.decks.length, 1);
		assert.deepEqual(persisted, result);
		assert.equal(notifications.length, 1);
		assert.equal(notifications[0].reason, 'integration-test');
		assert.equal(notifications[0].snapshot, result);
	});

	await t.test('replaceState mantém a substituição completa homologada', async () => {
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
		const stateModule = await importStateWithStorage(storage);
		const result = stateModule.replaceState(
			normalState,
			'integration-replace'
		);
		const persisted = JSON.parse(storage.getItem(PRIMARY_KEY));

		assert.equal(result.decks.length, 2);
		assert.equal(result.cards.length, 3);
		assert.deepEqual(persisted, result);
	});

	await t.test('resetState reinicializa somente a chave principal', async () => {
		const normalState = await loadJsonFixture(
			'states/state-v0.1-normal.json'
		);
		const legacyState = {
			decks: [],
			cards: []
		};
		const serializedLegacy = JSON.stringify(legacyState);
		const storage = new FakeStorage({
			entries: {
				[PRIMARY_KEY]: JSON.stringify(normalState),
				[LEGACY_KEY]: serializedLegacy
			}
		});
		const stateModule = await importStateWithStorage(storage);
		const result = stateModule.resetState();
		const persisted = JSON.parse(storage.getItem(PRIMARY_KEY));

		assert.deepEqual(result.decks, []);
		assert.deepEqual(result.cards, []);
		assert.deepEqual(result.sessions, []);
		assert.deepEqual(persisted, result);
		assert.equal(storage.getItem(LEGACY_KEY), serializedLegacy);
	});

	await t.test('falha de gravação mantém a semântica transitória da B5', async () => {
		const emptyState = await loadJsonFixture(
			'states/state-v0.1-empty.json'
		);
		const storage = new FakeStorage({
			entries: {
				[PRIMARY_KEY]: JSON.stringify(emptyState)
			},
			failures: {
				setItem: new Error('Falha simulada')
			}
		});
		const originalConsoleError = console.error;
		const errors = [];
		console.error = (...args) => errors.push(args);

		try {
			const stateModule = await importStateWithStorage(storage);
			const result = stateModule.mutateState((draft) => {
				draft.settings.theme = 'dark';
			});
			const persisted = JSON.parse(storage.getItem(PRIMARY_KEY));

			assert.equal(result.settings.theme, 'dark');
			assert.equal(stateModule.getState().settings.theme, 'dark');
			assert.equal(persisted.settings.theme, 'system');
			assert.equal(errors.length, 1);
			assert.match(
				errors[0][0],
				/Não foi possível salvar os dados locais/
			);
		} finally {
			console.error = originalConsoleError;
		}
	});
});
