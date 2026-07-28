import {APP_CONFIG} from '../../core/config.js';
import {
	DATA_ERROR_CATEGORIES,
	DATA_ERROR_CODES
} from '../../shared/errors/data-error.constants.js';
import {DataError} from '../../shared/errors/data-error.js';
import {
	createFailureResult,
	createSuccessResult
} from '../../shared/result.js';
import {StateRepository} from '../contracts/state-repository.js';

const REQUIRED_STORAGE_METHODS = Object.freeze([
	'getItem',
	'setItem',
	'removeItem'
]);

function resolveDefaultStorage() {
	try {
		return globalThis.localStorage ?? null;
	} catch {
		return null;
	}
}

function requireNonEmptyString(value, fieldName) {
	if (typeof value !== 'string' || value.trim() === '') {
		throw new TypeError(`${fieldName} deve ser uma string não vazia.`);
	}

	return value.trim();
}

function normalizeLegacyKeys(legacyKeys, primaryKey) {
	if (!Array.isArray(legacyKeys)) {
		throw new TypeError('legacyKeys deve ser uma lista.');
	}

	const normalizedKeys = legacyKeys.map((key, index) =>
		requireNonEmptyString(key, `legacyKeys[${index}]`)
	);

	return Object.freeze([
		...new Set(
			normalizedKeys.filter((key) => key !== primaryKey)
		)
	]);
}

function normalizeOptions(options) {
	if (
		options === null ||
		typeof options !== 'object' ||
		Array.isArray(options)
	) {
		throw new TypeError('options deve ser um objeto.');
	}

	return Object.freeze({...options});
}

function hasStorageInterface(storage) {
	return Boolean(
		storage &&
		REQUIRED_STORAGE_METHODS.every(
			(methodName) => typeof storage[methodName] === 'function'
		)
	);
}

function isQuotaExceededError(error) {
	return Boolean(
		error &&
		(
			error.name === 'QuotaExceededError' ||
			error.name === 'NS_ERROR_DOM_QUOTA_REACHED' ||
			error.code === 22 ||
			error.code === 1014
		)
	);
}

function isStorageUnavailableError(error) {
	return Boolean(
		error &&
		(
			error.name === 'SecurityError' ||
			error.name === 'InvalidStateError'
		)
	);
}

function createStorageError({
	code,
	category = DATA_ERROR_CATEGORIES.STORAGE,
	userMessageKey,
	technicalMessage,
	retryable = false,
	cause = null,
	context = {}
}) {
	return new DataError({
		code,
		category,
		userMessageKey,
		technicalMessage,
		retryable,
		cause,
		context
	});
}

function createUnavailableResult(operation, key) {
	return createFailureResult(
		createStorageError({
			code: DATA_ERROR_CODES.STORAGE_UNAVAILABLE,
			userMessageKey: 'errors.storage.unavailable',
			technicalMessage: 'O armazenamento local não está disponível.',
			retryable: false,
			context: {
				operation,
				key,
				stage: 'access'
			}
		}),
		{
			metadata: {
				source: 'localStorage',
				operation,
				key
			}
		}
	);
}

function createReadFailure(error, operation, key, stage = 'read') {
	const unavailable = isStorageUnavailableError(error);

	return createFailureResult(
		createStorageError({
			code: unavailable
				? DATA_ERROR_CODES.STORAGE_UNAVAILABLE
				: DATA_ERROR_CODES.STORAGE_READ_FAILED,
			category: stage === 'parse'
				? DATA_ERROR_CATEGORIES.SERIALIZATION
				: DATA_ERROR_CATEGORIES.STORAGE,
			userMessageKey: unavailable
				? 'errors.storage.unavailable'
				: 'errors.storage.readFailed',
			technicalMessage: stage === 'parse'
				? `O conteúdo armazenado em ${key} não contém JSON válido.`
				: `Não foi possível ler a chave ${key}.`,
			retryable: !unavailable && stage !== 'parse',
			cause: error,
			context: {
				operation,
				key,
				stage
			}
		}),
		{
			metadata: {
				source: 'localStorage',
				operation,
				key,
				stage
			}
		}
	);
}

function createWriteFailure(error, operation, key, stage = 'write') {
	const quotaExceeded = isQuotaExceededError(error);
	const unavailable = isStorageUnavailableError(error);
	const serializationFailure = stage === 'serialize';

	let code = DATA_ERROR_CODES.STORAGE_WRITE_FAILED;
	let userMessageKey = 'errors.storage.writeFailed';

	if (quotaExceeded) {
		code = DATA_ERROR_CODES.STORAGE_QUOTA_EXCEEDED;
		userMessageKey = 'errors.storage.quotaExceeded';
	} else if (unavailable) {
		code = DATA_ERROR_CODES.STORAGE_UNAVAILABLE;
		userMessageKey = 'errors.storage.unavailable';
	}

	return createFailureResult(
		createStorageError({
			code,
			category: serializationFailure
				? DATA_ERROR_CATEGORIES.SERIALIZATION
				: DATA_ERROR_CATEGORIES.STORAGE,
			userMessageKey,
			technicalMessage: serializationFailure
				? 'O estado não pôde ser serializado para armazenamento.'
				: `Não foi possível gravar a chave ${key}.`,
			retryable: !quotaExceeded && !unavailable && !serializationFailure,
			cause: error,
			context: {
				operation,
				key,
				stage
			}
		}),
		{
			metadata: {
				source: 'localStorage',
				operation,
				key,
				stage
			}
		}
	);
}

function createVerificationFailure({
	operation,
	key,
	stage,
	cause = null
}) {
	return createFailureResult(
		createStorageError({
			code: DATA_ERROR_CODES.STORAGE_VERIFICATION_FAILED,
			userMessageKey: 'errors.storage.verificationFailed',
			technicalMessage: `A gravação da chave ${key} não pôde ser confirmada.`,
			retryable: true,
			cause,
			context: {
				operation,
				key,
				stage
			}
		}),
		{
			metadata: {
				source: 'localStorage',
				operation,
				key,
				stage,
				verified: false
			}
		}
	);
}

/**
 * Adaptador inicial de persistência local da v0.2.0.
 *
 * Nesta etapa ele mantém a chave homologada da v0.1.0 e não é conectado
 * ao state.js. A substituição crítica ainda usa uma estratégia transitória
 * de gravação direta verificada; staging e rollback serão adicionados na
 * fase específica de restauração segura.
 */
export class LocalStorageStateRepository extends StateRepository {
	#storage;
	#primaryKey;
	#legacyKeys;
	#probeKey;

	constructor({
		storage = resolveDefaultStorage(),
		primaryKey = APP_CONFIG.storageKey,
		legacyKeys = APP_CONFIG.legacyStorageKeys,
		probeKey
	} = {}) {
		super();

		this.#primaryKey = requireNonEmptyString(
			primaryKey,
			'primaryKey'
		);
		this.#legacyKeys = normalizeLegacyKeys(
			legacyKeys,
			this.#primaryKey
		);
		this.#probeKey = requireNonEmptyString(
			probeKey ?? `${this.#primaryKey}.probe`,
			'probeKey'
		);
		this.#storage = storage;
	}

	readPrimary() {
		const operation = 'readPrimary';

		if (!hasStorageInterface(this.#storage)) {
			return createUnavailableResult(operation, this.#primaryKey);
		}

		let raw;

		try {
			raw = this.#storage.getItem(this.#primaryKey);
		} catch (error) {
			return createReadFailure(
				error,
				operation,
				this.#primaryKey
			);
		}

		if (raw === null) {
			return createSuccessResult(
				{
					state: null,
					key: this.#primaryKey,
					exists: false
				},
				{
					metadata: {
						source: 'localStorage',
						operation,
						exists: false,
						bytes: 0
					}
				}
			);
		}

		let state;

		try {
			state = JSON.parse(raw);
		} catch (error) {
			return createReadFailure(
				error,
				operation,
				this.#primaryKey,
				'parse'
			);
		}

		return createSuccessResult(
			{
				state,
				key: this.#primaryKey,
				exists: true
			},
			{
				metadata: {
					source: 'localStorage',
					operation,
					exists: true,
					bytes: raw.length
				}
			}
		);
	}

	writePrimary(candidate) {
		const operation = 'writePrimary';

		if (!hasStorageInterface(this.#storage)) {
			return createUnavailableResult(operation, this.#primaryKey);
		}

		let serialized;

		try {
			serialized = JSON.stringify(candidate);

			if (serialized === undefined) {
				throw new TypeError(
					'O estado informado não possui representação JSON.'
				);
			}
		} catch (error) {
			return createWriteFailure(
				error,
				operation,
				this.#primaryKey,
				'serialize'
			);
		}

		try {
			this.#storage.setItem(this.#primaryKey, serialized);
		} catch (error) {
			return createWriteFailure(
				error,
				operation,
				this.#primaryKey
			);
		}

		let verifiedRaw;

		try {
			verifiedRaw = this.#storage.getItem(this.#primaryKey);
		} catch (error) {
			return createVerificationFailure({
				operation,
				key: this.#primaryKey,
				stage: 'read-back',
				cause: error
			});
		}

		if (verifiedRaw !== serialized) {
			return createVerificationFailure({
				operation,
				key: this.#primaryKey,
				stage: 'compare'
			});
		}

		let verifiedState;

		try {
			verifiedState = JSON.parse(verifiedRaw);
		} catch (error) {
			return createVerificationFailure({
				operation,
				key: this.#primaryKey,
				stage: 'parse-read-back',
				cause: error
			});
		}

		return createSuccessResult(
			{
				state: verifiedState,
				key: this.#primaryKey,
				verified: true
			},
			{
				metadata: {
					source: 'localStorage',
					operation,
					bytes: serialized.length,
					verified: true
				}
			}
		);
	}

	replaceSafely(candidate, options = {}) {
		const normalizedOptions = normalizeOptions(options);
		const previous = this.readPrimary();

		if (!previous.ok) {
			return previous;
		}

		const written = this.writePrimary(candidate);

		if (!written.ok) {
			return written;
		}

		return createSuccessResult(
			{
				state: written.data.state,
				previousState: previous.data.state,
				verified: true,
				rolledBack: false
			},
			{
				metadata: {
					source: 'localStorage',
					operation: 'replaceSafely',
					strategy: 'verified-direct-v0.1',
					transitional: true,
					options: normalizedOptions
				}
			}
		);
	}

	clearPrimary(options = {}) {
		const operation = 'clearPrimary';
		const normalizedOptions = normalizeOptions(options);

		if (!hasStorageInterface(this.#storage)) {
			return createUnavailableResult(operation, this.#primaryKey);
		}

		let previousRaw;

		try {
			previousRaw = this.#storage.getItem(this.#primaryKey);
		} catch (error) {
			return createReadFailure(
				error,
				operation,
				this.#primaryKey
			);
		}

		let previousState = null;
		let previousStateReadable = true;

		if (previousRaw !== null) {
			try {
				previousState = JSON.parse(previousRaw);
			} catch {
				previousStateReadable = false;
			}
		}

		try {
			this.#storage.removeItem(this.#primaryKey);
		} catch (error) {
			return createWriteFailure(
				error,
				operation,
				this.#primaryKey,
				'remove'
			);
		}

		let verifiedRaw;

		try {
			verifiedRaw = this.#storage.getItem(this.#primaryKey);
		} catch (error) {
			return createVerificationFailure({
				operation,
				key: this.#primaryKey,
				stage: 'read-back',
				cause: error
			});
		}

		if (verifiedRaw !== null) {
			return createVerificationFailure({
				operation,
				key: this.#primaryKey,
				stage: 'compare'
			});
		}

		return createSuccessResult(
			{
				cleared: true,
				key: this.#primaryKey,
				previousState
			},
			{
				metadata: {
					source: 'localStorage',
					operation,
					hadValue: previousRaw !== null,
					previousStateReadable,
					verified: true,
					options: normalizedOptions
				}
			}
		);
	}

	readLegacySources() {
		const operation = 'readLegacySources';

		if (!hasStorageInterface(this.#storage)) {
			return createUnavailableResult(operation, this.#primaryKey);
		}

		const sources = [];

		for (const key of this.#legacyKeys) {
			let raw;

			try {
				raw = this.#storage.getItem(key);
			} catch (error) {
				return createReadFailure(error, operation, key);
			}

			if (raw === null) {
				continue;
			}

			let state;

			try {
				state = JSON.parse(raw);
			} catch (error) {
				return createReadFailure(
					error,
					operation,
					key,
					'parse'
				);
			}

			sources.push({
				key,
				state,
				exists: true
			});
		}

		return createSuccessResult(sources, {
			metadata: {
				source: 'localStorage',
				operation,
				count: sources.length,
				checkedKeys: this.#legacyKeys
			}
		});
	}

	recoverInterruptedOperation() {
		return createSuccessResult(
			{
				recovered: false,
				source: null,
				state: null
			},
			{
				metadata: {
					source: 'localStorage',
					operation: 'recoverInterruptedOperation',
					reason: 'recovery-keys-not-configured',
					transitional: true
				}
			}
		);
	}

	getStorageInfo() {
		const baseInfo = {
			technology: 'localStorage',
			primaryKey: this.#primaryKey,
			legacyKeys: [...this.#legacyKeys],
			available: false,
			readable: false,
			writable: false
		};

		if (!hasStorageInterface(this.#storage)) {
			return createSuccessResult(
				{
					...baseInfo,
					reason: 'storage-interface-unavailable'
				},
				{
					metadata: {
						source: 'localStorage',
						operation: 'getStorageInfo',
						tested: false
					}
				}
			);
		}

		let previousProbeValue;

		try {
			this.#storage.getItem(this.#primaryKey);
			previousProbeValue = this.#storage.getItem(this.#probeKey);
		} catch (error) {
			return createSuccessResult(
				{
					...baseInfo,
					reason: isStorageUnavailableError(error)
						? 'storage-unavailable'
						: 'read-test-failed'
				},
				{
					metadata: {
						source: 'localStorage',
						operation: 'getStorageInfo',
						tested: true
					}
				}
			);
		}

		const probeValue = `flashcore-probe-${Date.now()}`;
		let writable = false;
		let reason = null;

		try {
			this.#storage.setItem(this.#probeKey, probeValue);
			writable = this.#storage.getItem(this.#probeKey) === probeValue;

			if (!writable) {
				reason = 'write-verification-failed';
			}
		} catch (error) {
			reason = isQuotaExceededError(error)
				? 'quota-exceeded'
				: isStorageUnavailableError(error)
					? 'storage-unavailable'
					: 'write-test-failed';
		} finally {
			try {
				if (previousProbeValue === null) {
					this.#storage.removeItem(this.#probeKey);
				} else {
					this.#storage.setItem(
						this.#probeKey,
						previousProbeValue
					);
				}
			} catch {
				writable = false;
				reason = 'probe-cleanup-failed';
			}
		}

		return createSuccessResult(
			{
				...baseInfo,
				available: true,
				readable: true,
				writable,
				...(reason === null ? {} : {reason})
			},
			{
				metadata: {
					source: 'localStorage',
					operation: 'getStorageInfo',
					tested: true
				}
			}
		);
	}
}
