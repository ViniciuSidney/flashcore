import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const stateModuleUrl = new URL(
	'../../src/scripts/core/state.js',
	import.meta.url
);

test('state.js usa AppStateStore e o adaptador oficial de persistência', async () => {
	const source = await readFile(stateModuleUrl, 'utf8');

	assert.match(source, /AppStateStore/);
	assert.match(source, /LocalStorageStateRepository/);
	assert.match(source, /StateSchemaService/);
	assert.match(source, /appStateStore\.initialize\(\)/);
	assert.match(source, /appStateStore\.executeMutation/);
	assert.match(source, /appStateStore\.resetToInitialState/);
	assert.match(source, /stateRepository\.readLegacySources\(\)/);
});

test('state.js não cria acesso paralelo nem memória otimista', async () => {
	const source = await readFile(stateModuleUrl, 'utf8');

	assert.doesNotMatch(source, /shared\/storage\.js/);
	assert.doesNotMatch(source, /getStorageItem/);
	assert.doesNotMatch(source, /setStorageItem/);
	assert.doesNotMatch(source, /removeStorageItem/);
	assert.doesNotMatch(source, /let state\s*=/);
});

test('mutações públicas aguardam confirmação do AppStateStore', async () => {
	const source = await readFile(stateModuleUrl, 'utf8');

	assert.match(source, /export async function mutateState/);
	assert.match(source, /await appStateStore\.executeMutation/);
	assert.match(source, /export async function replaceState/);
	assert.match(source, /export async function resetState/);
});
