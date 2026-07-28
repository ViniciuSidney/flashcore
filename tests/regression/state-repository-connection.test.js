import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const stateModuleUrl = new URL(
	'../../src/scripts/core/state.js',
	import.meta.url
);

test('state.js depende do adaptador oficial de persistência', async () => {
	const source = await readFile(stateModuleUrl, 'utf8');

	assert.match(source, /LocalStorageStateRepository/);
	assert.match(source, /stateRepository\.readPrimary\(\)/);
	assert.match(source, /stateRepository\.writePrimary\(candidate\)/);
	assert.match(source, /stateRepository\.readLegacySources\(\)/);
	assert.match(source, /stateRepository\.clearPrimary\(/);
});

test('state.js não cria acesso paralelo pelo helper legado', async () => {
	const source = await readFile(stateModuleUrl, 'utf8');

	assert.doesNotMatch(source, /shared\/storage\.js/);
	assert.doesNotMatch(source, /getStorageItem/);
	assert.doesNotMatch(source, /setStorageItem/);
	assert.doesNotMatch(source, /removeStorageItem/);
});
