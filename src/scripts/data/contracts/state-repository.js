export const STATE_REPOSITORY_METHODS = Object.freeze([
	'readPrimary',
	'writePrimary',
	'replaceSafely',
	'clearPrimary',
	'readLegacySources',
	'recoverInterruptedOperation',
	'getStorageInfo'
]);

function createNotImplementedError(methodName) {
	return new Error(
		`StateRepository.${methodName} deve ser implementado pelo adaptador concreto.`
	);
}

function isObjectLike(value) {
	return value !== null && (
		typeof value === 'object' ||
		typeof value === 'function'
	);
}

function hasConcreteMethod(repository, methodName) {
	if (typeof repository?.[methodName] !== 'function') {
		return false;
	}

	return repository[methodName] !== StateRepository.prototype[methodName];
}

/**
 * Contrato-base para persistência do estado local do FlashCore.
 *
 * Todos os métodos concretos devem devolver Promise<Result> ou Result.
 * O contrato não conhece localStorage, validação, migração ou interface.
 */
export class StateRepository {
	constructor() {
		if (new.target === StateRepository) {
			throw new TypeError(
				'StateRepository é um contrato abstrato e não pode ser instanciado diretamente.'
			);
		}
	}

	readPrimary() {
		throw createNotImplementedError('readPrimary');
	}

	writePrimary() {
		throw createNotImplementedError('writePrimary');
	}

	replaceSafely() {
		throw createNotImplementedError('replaceSafely');
	}

	clearPrimary() {
		throw createNotImplementedError('clearPrimary');
	}

	readLegacySources() {
		throw createNotImplementedError('readLegacySources');
	}

	recoverInterruptedOperation() {
		throw createNotImplementedError('recoverInterruptedOperation');
	}

	getStorageInfo() {
		throw createNotImplementedError('getStorageInfo');
	}
}

export function getMissingStateRepositoryMethods(repository) {
	if (!isObjectLike(repository)) {
		return Object.freeze([...STATE_REPOSITORY_METHODS]);
	}

	return Object.freeze(
		STATE_REPOSITORY_METHODS.filter(
			(methodName) => !hasConcreteMethod(repository, methodName)
		)
	);
}

export function isStateRepository(repository) {
	return getMissingStateRepositoryMethods(repository).length === 0;
}

export function assertStateRepository(repository) {
	const missingMethods = getMissingStateRepositoryMethods(repository);

	if (missingMethods.length > 0) {
		throw new TypeError(
			`StateRepository inválido. Métodos ausentes ou não implementados: ${missingMethods.join(', ')}.`
		);
	}

	return repository;
}
