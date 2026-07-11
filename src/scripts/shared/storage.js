export function getStorageItem(key, fallback = null) {
	try {
		const raw = localStorage.getItem(key);
		return raw === null ? fallback : JSON.parse(raw);
	} catch (error) {
		console.error(`Não foi possível ler ${key}:`, error);
		return fallback;
	}
}

export function setStorageItem(key, value) {
	try {
		localStorage.setItem(key, JSON.stringify(value));
		return true;
	} catch (error) {
		console.error(`Não foi possível salvar ${key}:`, error);
		return false;
	}
}

export function removeStorageItem(key) {
	try {
		localStorage.removeItem(key);
		return true;
	} catch (error) {
		console.error(`Não foi possível remover ${key}:`, error);
		return false;
	}
}
