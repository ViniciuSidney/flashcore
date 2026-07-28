import test from 'node:test';
import assert from 'node:assert/strict';

import {loadJsonFixture} from '../helpers/load-json-fixture.js';
import {
	DATA_ERROR_CODES
} from '../../src/scripts/shared/errors/data-error.constants.js';
import {
	StateSchemaService
} from '../../src/scripts/data/validation/state-schema.service.js';

test('StateSchemaService informa as versões suportadas', () => {
	const service = new StateSchemaService();

	assert.deepEqual(service.getSupportedVersions(), [1]);
	assert.equal(Object.isFrozen(service.getSupportedVersions()), true);
});

test('readVersion identifica a versão sem modificar o estado', async () => {
	const service = new StateSchemaService();
	const state = await loadJsonFixture('states/state-v0.1-empty.json');
	const before = structuredClone(state);

	const result = service.readVersion(state);

	assert.equal(result.ok, true);
	assert.equal(result.data.schemaVersion, 1);
	assert.deepEqual(state, before);
});

test('validate devolve uma cópia independente do estado válido', async () => {
	const service = new StateSchemaService();
	const state = await loadJsonFixture('states/state-v0.1-normal.json');

	const result = service.validate(state);

	assert.equal(result.ok, true);
	assert.equal(result.data.schemaVersion, 1);
	assert.deepEqual(result.data.summary, {
		decks: 2,
		cards: 3,
		sessions: 1
	});
	assert.notEqual(result.data.state, state);

	result.data.state.decks[0].name = 'Alterado na cópia';
	assert.equal(state.decks[0].name, 'Matemática');
});

test('validate converte inconsistências em STATE_INVALID', async () => {
	const service = new StateSchemaService();
	const state = await loadJsonFixture('states/state-v0.1-duplicate-ids.json');

	const result = service.validate(state);

	assert.equal(result.ok, false);
	assert.equal(result.error.code, DATA_ERROR_CODES.STATE_INVALID);
	assert.equal(result.error.context.schemaVersion, 1);
	assert.ok(result.error.context.errors.length >= 2);
});

test('validate diferencia versão ausente de versão não suportada', async () => {
	const service = new StateSchemaService();
	const state = await loadJsonFixture('states/state-v0.1-empty.json');

	const missingVersion = structuredClone(state);
	delete missingVersion.schemaVersion;

	const missingResult = service.validate(missingVersion);
	assert.equal(missingResult.ok, false);
	assert.equal(missingResult.error.code, DATA_ERROR_CODES.STATE_INVALID);

	const unsupported = structuredClone(state);
	unsupported.schemaVersion = 999;

	const unsupportedResult = service.validate(unsupported);
	assert.equal(unsupportedResult.ok, false);
	assert.equal(
		unsupportedResult.error.code,
		DATA_ERROR_CODES.STATE_VERSION_UNSUPPORTED
	);
});

test('validate preserva avisos de referências históricas', async () => {
	const service = new StateSchemaService();
	const state = await loadJsonFixture('states/state-v0.1-normal.json');
	state.cards = [];

	const result = service.validate(state);

	assert.equal(result.ok, true);
	assert.ok(result.warnings.length > 0);
	assert.equal(result.metadata.valid, true);
});

test('StateSchemaService aceita validadores injetados e rejeita configuração inválida', () => {
	const customService = new StateSchemaService({
		validators: new Map([
			[2, () => ({
				valid: true,
				errors: [],
				warnings: [],
				summary: {decks: 0, cards: 0, sessions: 0}
			})]
		])
	});

	const result = customService.validate({schemaVersion: 2});
	assert.equal(result.ok, true);

	assert.throws(
		() => new StateSchemaService({validators: {}}),
		/validators deve ser um Map/
	);

	assert.throws(
		() => new StateSchemaService({
			validators: new Map([[1, null]])
		}),
		/deve ser uma função/
	);
});
