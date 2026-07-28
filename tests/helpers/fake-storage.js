function normalizeEntries(entries) {
	if (
		entries === null ||
		typeof entries !== 'object' ||
		Array.isArray(entries)
	) {
		throw new TypeError('entries deve ser um objeto.');
	}

	return Object.entries(entries).map(([key, value]) => [
		String(key),
		String(value)
	]);
}

function normalizeFailures(failures) {
	if (
		failures === null ||
		typeof failures !== 'object' ||
		Array.isArray(failures)
	) {
		throw new TypeError('failures deve ser um objeto.');
	}

	return {...failures};
}

function throwConfiguredFailure(failure, context) {
	if (!failure) {
		return;
	}

	if (typeof failure === 'function') {
		const result = failure(context);

		if (result instanceof Error) {
			throw result;
		}

		return;
	}

	throw failure;
}

export class FakeStorage {
	#items;
	#failures;
	#setTransform;
	#getTransform;

	constructor({
		entries = {},
		failures = {},
		setTransform = null,
		getTransform = null
	} = {}) {
		if (setTransform !== null && typeof setTransform !== 'function') {
			throw new TypeError('setTransform deve ser uma função ou null.');
		}

		if (getTransform !== null && typeof getTransform !== 'function') {
			throw new TypeError('getTransform deve ser uma função ou null.');
		}

		this.#items = new Map(normalizeEntries(entries));
		this.#failures = normalizeFailures(failures);
		this.#setTransform = setTransform;
		this.#getTransform = getTransform;
	}

	get length() {
		return this.#items.size;
	}

	key(index) {
		return [...this.#items.keys()][index] ?? null;
	}

	getItem(key) {
		const normalizedKey = String(key);
		throwConfiguredFailure(this.#failures.getItem, {
			key: normalizedKey
		});

		const value = this.#items.get(normalizedKey) ?? null;

		return this.#getTransform
			? this.#getTransform({
				key: normalizedKey,
				value
			})
			: value;
	}

	setItem(key, value) {
		const normalizedKey = String(key);
		const normalizedValue = String(value);

		throwConfiguredFailure(this.#failures.setItem, {
			key: normalizedKey,
			value: normalizedValue
		});

		const storedValue = this.#setTransform
			? this.#setTransform({
				key: normalizedKey,
				value: normalizedValue
			})
			: normalizedValue;

		this.#items.set(normalizedKey, String(storedValue));
	}

	removeItem(key) {
		const normalizedKey = String(key);
		throwConfiguredFailure(this.#failures.removeItem, {
			key: normalizedKey
		});
		this.#items.delete(normalizedKey);
	}

	clear() {
		this.#items.clear();
	}

	getSnapshot() {
		return Object.fromEntries(this.#items.entries());
	}
}
