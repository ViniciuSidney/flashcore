import {
	DATA_ERROR_CATEGORIES,
	DATA_ERROR_CODES
} from '../../shared/errors/data-error.constants.js';
import {DataError} from '../../shared/errors/data-error.js';
import {
	createFailureResult,
	createSuccessResult
} from '../../shared/result.js';
import {
	STATE_SCHEMA_VERSION_V1,
	validateStateV1
} from './state-validator-v1.js';

function isPlainObject(value) {
	if (value === null || typeof value !== 'object') return false;
	const prototype = Object.getPrototypeOf(value);
	return prototype === Object.prototype || prototype === null;
}

function cloneJsonValue(value) {
	if (typeof structuredClone === 'function') {
		return structuredClone(value);
	}

	return JSON.parse(JSON.stringify(value));
}

function normalizeValidators(validators) {
	if (!(validators instanceof Map)) {
		throw new TypeError('validators deve ser um Map.');
	}

	const normalized = new Map();

	for (const [version, validator] of validators.entries()) {
		if (!Number.isInteger(version) || version < 1) {
			throw new TypeError('Cada versão registrada deve ser um inteiro positivo.');
		}

		if (typeof validator !== 'function') {
			throw new TypeError(`O validador da versão ${version} deve ser uma função.`);
		}

		normalized.set(version, validator);
	}

	return normalized;
}

function createValidationError({
	code,
	technicalMessage,
	context
}) {
	return new DataError({
		code,
		category: DATA_ERROR_CATEGORIES.VALIDATION,
		userMessageKey: code === DATA_ERROR_CODES.STATE_VERSION_UNSUPPORTED
			? 'errors.state.versionUnsupported'
			: 'errors.state.invalid',
		technicalMessage,
		retryable: false,
		context
	});
}

export class StateSchemaService {
	#validators;

	constructor({
		validators = new Map([
			[STATE_SCHEMA_VERSION_V1, validateStateV1]
		])
	} = {}) {
		this.#validators = normalizeValidators(validators);
	}

	getSupportedVersions() {
		return Object.freeze([...this.#validators.keys()].sort((a, b) => a - b));
	}

	readVersion(input) {
		if (!isPlainObject(input)) {
			return createFailureResult(
				createValidationError({
					code: DATA_ERROR_CODES.STATE_INVALID,
					technicalMessage: 'Não foi possível identificar a versão de um estado que não é objeto.',
					context: {
						stage: 'read-version',
						received: input === null ? 'null' : typeof input
					}
				})
			);
		}

		if (!Number.isInteger(input.schemaVersion) || input.schemaVersion < 1) {
			return createFailureResult(
				createValidationError({
					code: DATA_ERROR_CODES.STATE_INVALID,
					technicalMessage: 'O estado não possui um schemaVersion válido.',
					context: {
						stage: 'read-version',
						schemaVersion: input.schemaVersion ?? null
					}
				})
			);
		}

		return createSuccessResult(
			{schemaVersion: input.schemaVersion},
			{
				metadata: {
					stage: 'read-version'
				}
			}
		);
	}

	validate(input) {
		const versionResult = this.readVersion(input);
		if (!versionResult.ok) return versionResult;

		const {schemaVersion} = versionResult.data;
		const validator = this.#validators.get(schemaVersion);

		if (!validator) {
			return createFailureResult(
				createValidationError({
					code: DATA_ERROR_CODES.STATE_VERSION_UNSUPPORTED,
					technicalMessage: `A versão ${schemaVersion} do estado não é suportada.`,
					context: {
						stage: 'select-validator',
						schemaVersion,
						supportedVersions: this.getSupportedVersions()
					}
				})
			);
		}

		let validation;

		try {
			validation = validator(input);
		} catch (cause) {
			return createFailureResult(
				createValidationError({
					code: DATA_ERROR_CODES.STATE_INVALID,
					technicalMessage: 'O validador do estado falhou de forma inesperada.',
					context: {
						stage: 'validate',
						schemaVersion,
						causeName: cause?.name ?? 'UnknownError'
					}
				})
			);
		}

		if (!validation?.valid) {
			return createFailureResult(
				createValidationError({
					code: DATA_ERROR_CODES.STATE_INVALID,
					technicalMessage: 'O estado não atende ao schema esperado.',
					context: {
						stage: 'validate',
						schemaVersion,
						errors: validation?.errors ?? []
					}
				}),
				{
					warnings: validation?.warnings ?? [],
					metadata: {
						stage: 'validate',
						schemaVersion,
						summary: validation?.summary ?? null
					}
				}
			);
		}

		let state;

		try {
			state = cloneJsonValue(input);
		} catch (cause) {
			return createFailureResult(
				createValidationError({
					code: DATA_ERROR_CODES.STATE_INVALID,
					technicalMessage: 'O estado validado não pôde ser copiado com segurança.',
					context: {
						stage: 'clone',
						schemaVersion,
						causeName: cause?.name ?? 'UnknownError'
					}
				})
			);
		}

		return createSuccessResult(
			{
				state,
				schemaVersion,
				summary: validation.summary
			},
			{
				warnings: validation.warnings,
				metadata: {
					stage: 'validate',
					schemaVersion,
					valid: true
				}
			}
		);
	}
}
