import {
	DATA_ERROR_CATEGORIES
} from './data-error.constants.js';

function requireNonEmptyString(value, fieldName) {
	if (typeof value !== 'string' || value.trim() === '') {
		throw new TypeError(`${fieldName} deve ser uma string não vazia.`);
	}

	return value.trim();
}

function normalizeContext(context) {
	if (
		context === null ||
		typeof context !== 'object' ||
		Array.isArray(context)
	) {
		throw new TypeError('context deve ser um objeto.');
	}

	return Object.freeze({...context});
}

export class DataError extends Error {
	constructor({
		code,
		category = DATA_ERROR_CATEGORIES.UNKNOWN,
		userMessageKey = 'errors.unknown',
		technicalMessage,
		retryable = false,
		cause = null,
		context = {}
	} = {}) {
		const normalizedCode = requireNonEmptyString(code, 'code');
		const normalizedTechnicalMessage = requireNonEmptyString(
			technicalMessage ?? normalizedCode,
			'technicalMessage'
		);

		if (!Object.values(DATA_ERROR_CATEGORIES).includes(category)) {
			throw new TypeError(`Categoria de erro inválida: ${category}`);
		}

		super(normalizedTechnicalMessage, cause === null ? undefined : {cause});

		this.name = 'DataError';
		this.code = normalizedCode;
		this.category = category;
		this.userMessageKey = requireNonEmptyString(
			userMessageKey,
			'userMessageKey'
		);
		this.technicalMessage = normalizedTechnicalMessage;
		this.retryable = Boolean(retryable);
		this.cause = cause;
		this.context = normalizeContext(context);
	}
}

export function isDataError(value) {
	return value instanceof DataError;
}
