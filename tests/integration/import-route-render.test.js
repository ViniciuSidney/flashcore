import test from 'node:test';
import assert from 'node:assert/strict';

import {FakeStorage} from '../helpers/fake-storage.js';
import {loadJsonFixture} from '../helpers/load-json-fixture.js';

const PRIMARY_KEY = 'flashcore.app.v0.1';

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

test('rota de importação renderiza o assistente quando há baralho disponível', async () => {
	const state = await loadJsonFixture('states/state-v0.1-normal.json');
	const storage = new FakeStorage({
		entries: {[PRIMARY_KEY]: JSON.stringify(state)}
	});
	const restoreStorage = installStorage(storage);

	try {
		const stateModule = await import(
			new URL('../../src/scripts/core/state.js', import.meta.url).href
		);
		const initialization = await stateModule.initializeState();
		assert.equal(initialization.ok, true);

		const importerUrl = new URL(
			'../../src/scripts/features/importer/importer.controller.js',
			import.meta.url
		);
		importerUrl.searchParams.set('test', 'import-route-render');
		const {renderImport, resetImport} = await import(importerUrl.href);

		resetImport();
		const html = renderImport();

		assert.equal(typeof html, 'string');
		assert.match(html, /Importar flashcards/);
		assert.match(html, /Etapa 1/);
		assert.match(html, /Baralho de destino/);
		assert.match(html, /Matemática/);
	} finally {
		restoreStorage();
	}
});
