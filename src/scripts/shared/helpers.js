export function createId() {
	if (globalThis.crypto?.randomUUID) return crypto.randomUUID();
	return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export function escapeHTML(value = '') {
	return String(value)
		.replaceAll('&', '&amp;')
		.replaceAll('<', '&lt;')
		.replaceAll('>', '&gt;')
		.replaceAll('"', '&quot;')
		.replaceAll("'", '&#039;');
}

export function normalizeText(value = '') {
	return String(value)
		.normalize('NFD')
		.replace(/[\u0300-\u036f]/g, '')
		.trim()
		.toLocaleLowerCase('pt-BR');
}

export function parseTags(value = '') {
	const source = Array.isArray(value) ? value : String(value).split(',');
	return source
		.map((tag) => tag.trim().replace(/^#/, '').toLocaleLowerCase('pt-BR'))
		.filter(Boolean)
		.filter((tag, index, list) => list.indexOf(tag) === index);
}

export function clamp(value, min, max) {
	return Math.min(Math.max(value, min), max);
}

export function debounce(callback, wait = 180) {
	let timeoutId;
	return (...args) => {
		clearTimeout(timeoutId);
		timeoutId = setTimeout(() => callback(...args), wait);
	};
}

export function downloadTextFile(filename, content, mimeType = 'text/plain;charset=utf-8') {
	const blob = new Blob([content], {type: mimeType});
	const url = URL.createObjectURL(blob);
	const link = document.createElement('a');
	link.href = url;
	link.download = filename;
	link.click();
	URL.revokeObjectURL(url);
}
