import {isDataError} from './errors/data-error.js';

function normalizeWarnings(warnings) {
	if (!Array.isArray(warnings)) {
		throw new TypeError('warnings deve ser uma lista.');
	}

	return Object.freeze([...warnings]);
}

function normalizeMetadata(metadata) {
	if (
		metadata === null ||
		typeof metadata !== 'object' ||
		Array.isArray(metadata)
	) {
		throw new TypeError('metadata deve ser um objeto.');
	}

	return Object.freeze({...metadata});
}

export function createSuccessResult(
	data = null,
	{warnings = [], metadata = {}} = {}
) {
	return Object.freeze({
		ok: true,
		data,
		error: null,
		warnings: normalizeWarnings(warnings),
		metadata: normalizeMetadata(metadata)
	});
}

export function createFailureResult(
	error,
	{warnings = [], metadata = {}} = {}
) {
	if (!isDataError(error)) {
		throw new TypeError(
			'Resultados de falha devem receber uma instância de DataError.'
		);
	}

	return Object.freeze({
		ok: false,
		data: null,
		error,
		warnings: normalizeWarnings(warnings),
		metadata: normalizeMetadata(metadata)
	});
}

export function isResult(value) {
	return Boolean(
		value &&
		typeof value === 'object' &&
		typeof value.ok === 'boolean' &&
		'data' in value &&
		'error' in value &&
		Array.isArray(value.warnings) &&
		value.metadata &&
		typeof value.metadata === 'object' &&
		!Array.isArray(value.metadata) &&
		(value.ok ? value.error === null : isDataError(value.error))
	);
}
