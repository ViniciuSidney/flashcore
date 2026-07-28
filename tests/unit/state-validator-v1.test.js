import test from 'node:test';
import assert from 'node:assert/strict';

import {loadJsonFixture} from '../helpers/load-json-fixture.js';
import {
	STATE_SCHEMA_VERSION_V1,
	validateStateV1
} from '../../src/scripts/data/validation/state-validator-v1.js';

test('validador v1 aceita estados vazio e normal homologados', async () => {
	const emptyState = await loadJsonFixture('states/state-v0.1-empty.json');
	const normalState = await loadJsonFixture('states/state-v0.1-normal.json');

	const emptyResult = validateStateV1(emptyState);
	const normalResult = validateStateV1(normalState);

	assert.equal(STATE_SCHEMA_VERSION_V1, 1);
	assert.equal(emptyResult.valid, true);
	assert.equal(normalResult.valid, true);
	assert.deepEqual(normalResult.summary, {
		decks: 2,
		cards: 3,
		sessions: 1
	});
});

test('validador v1 rejeita IDs duplicados', async () => {
	const state = await loadJsonFixture('states/state-v0.1-duplicate-ids.json');
	const result = validateStateV1(state);

	assert.equal(result.valid, false);
	assert.equal(
		result.errors.filter((issue) => issue.code === 'STATE_DUPLICATE_ID').length,
		2
	);
});

test('validador v1 rejeita card órfão', async () => {
	const state = await loadJsonFixture('states/state-v0.1-orphan-card.json');
	const result = validateStateV1(state);

	assert.equal(result.valid, false);
	assert.ok(
		result.errors.some((issue) => issue.code === 'STATE_CARD_DECK_NOT_FOUND')
	);
});

test('validador v1 rejeita sessão estruturalmente inconsistente', async () => {
	const state = await loadJsonFixture('states/state-v0.1-invalid-session.json');
	const result = validateStateV1(state);

	assert.equal(result.valid, false);
	assert.ok(
		result.errors.some((issue) => issue.path === 'sessions[0].results')
	);
	assert.ok(
		result.errors.some((issue) => issue.code === 'STATE_SESSION_INDEX_OUT_OF_RANGE')
	);
	assert.ok(
		result.errors.some((issue) => issue.code === 'STATE_SESSION_TIME_ORDER_INVALID')
	);
});

test('referências históricas ausentes geram avisos sem invalidar o estado', async () => {
	const state = await loadJsonFixture('states/state-v0.1-normal.json');
	state.cards = [];

	const result = validateStateV1(state);

	assert.equal(result.valid, true);
	assert.ok(
		result.warnings.some((issue) => issue.code === 'STATE_HISTORICAL_CARD_NOT_FOUND')
	);
});

test('validador v1 não modifica o objeto recebido', async () => {
	const state = await loadJsonFixture('states/state-v0.1-normal.json');
	const before = structuredClone(state);

	validateStateV1(state);

	assert.deepEqual(state, before);
});

test('validador v1 rejeita raiz, coleções e campos obrigatórios inválidos', async () => {
	const rootResult = validateStateV1(null);
	assert.equal(rootResult.valid, false);
	assert.equal(rootResult.errors[0].code, 'STATE_ROOT_INVALID');

	const state = await loadJsonFixture('states/state-v0.1-empty.json');
	state.settings.reviewScale = 175;
	state.decks = 'não é uma lista';

	const result = validateStateV1(state);
	assert.equal(result.valid, false);
	assert.ok(result.errors.some((issue) => issue.path === 'settings.reviewScale'));
	assert.ok(result.errors.some((issue) => issue.path === 'decks'));
});

test('validador v1 preserva sessões de reforço usadas pela aplicação', async () => {
	const state = await loadJsonFixture('states/state-v0.1-normal.json');
	state.sessions[0].mode = 'retry';

	const result = validateStateV1(state);

	assert.equal(result.valid, true);
});
