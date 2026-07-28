import {
	StateRepository
} from '../../src/scripts/data/contracts/state-repository.js';
import {
	createSuccessResult
} from '../../src/scripts/shared/result.js';

const DEFAULT_PRIMARY_KEY = 'memory.flashcore.primary';

function cloneValue(value) {
	if (value === undefined) {
		return undefined;
	}

	return structuredClone(value);
}

function normalizeLegacySources(legacySources) {
	if (!Array.isArray(legacySources)) {
		throw new TypeError('legacySources deve ser uma lista.');
	}

	return legacySources.map((source) => cloneValue(source));
}

export class InMemoryStateRepository extends StateRepository {
	#primary;
	#legacySources;
	#storageInfo;
	#primaryKey;

	constructor({
		primary = null,
		legacySources = [],
		primaryKey = DEFAULT_PRIMARY_KEY,
		storageInfo = {}
	} = {}) {
		super();

		this.#primary = cloneValue(primary);
		this.#legacySources = normalizeLegacySources(legacySources);
		this.#primaryKey = primaryKey;
		this.#storageInfo = {
			technology: 'memory',
			primaryKey,
			available: true,
			writable: true,
			...cloneValue(storageInfo)
		};
	}

	readPrimary() {
		const exists = this.#primary !== null;

		return createSuccessResult({
			state: cloneValue(this.#primary),
			key: this.#primaryKey,
			exists
		}, {
			metadata: {
				source: 'memory',
				exists
			}
		});
	}

	writePrimary(candidate) {
		this.#primary = cloneValue(candidate);

		return createSuccessResult({
			state: cloneValue(this.#primary),
			key: this.#primaryKey,
			verified: true
		}, {
			metadata: {
				source: 'memory',
				operation: 'write-primary'
			}
		});
	}

	replaceSafely(candidate, options = {}) {
		const previousState = cloneValue(this.#primary);
		this.#primary = cloneValue(candidate);

		return createSuccessResult({
			state: cloneValue(this.#primary),
			previousState,
			verified: true,
			rolledBack: false
		}, {
			metadata: {
				source: 'memory',
				operation: 'replace-safely',
				options: cloneValue(options)
			}
		});
	}

	clearPrimary(options = {}) {
		const previousState = cloneValue(this.#primary);
		this.#primary = null;

		return createSuccessResult({
			cleared: true,
			previousState
		}, {
			metadata: {
				source: 'memory',
				operation: 'clear-primary',
				options: cloneValue(options)
			}
		});
	}

	readLegacySources() {
		return createSuccessResult(
			cloneValue(this.#legacySources),
			{
				metadata: {
					source: 'memory',
					count: this.#legacySources.length
				}
			}
		);
	}

	recoverInterruptedOperation() {
		return createSuccessResult({
			recovered: false,
			source: null,
			state: null
		}, {
			metadata: {
				source: 'memory',
				reason: 'no-interrupted-operation'
			}
		});
	}

	getStorageInfo() {
		return createSuccessResult(
			cloneValue(this.#storageInfo),
			{
				metadata: {
					source: 'memory'
				}
			}
		);
	}

	getPrimarySnapshot() {
		return cloneValue(this.#primary);
	}
}
