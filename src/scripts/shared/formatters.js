const shortDateFormatter = new Intl.DateTimeFormat('pt-BR', {day: '2-digit', month: 'short'});
const fullDateFormatter = new Intl.DateTimeFormat('pt-BR', {day: '2-digit', month: '2-digit', year: 'numeric'});

export function formatShortDate(timestamp) {
	if (!timestamp) return 'Sem data';
	return shortDateFormatter.format(new Date(timestamp)).replace('.', '');
}

export function formatFullDate(timestamp) {
	if (!timestamp) return 'Sem data';
	return fullDateFormatter.format(new Date(timestamp));
}

export function formatDuration(milliseconds = 0) {
	const totalSeconds = Math.max(0, Math.round(milliseconds / 1000));
	const minutes = Math.floor(totalSeconds / 60);
	const seconds = totalSeconds % 60;
	return minutes > 0 ? `${minutes}min ${seconds}s` : `${seconds}s`;
}

export function formatRelativeReview(timestamp) {
	if (!timestamp || timestamp <= Date.now()) return 'Agora';
	const difference = timestamp - Date.now();
	const minutes = Math.ceil(difference / 60000);
	if (minutes < 60) return `em ${minutes} min`;
	const hours = Math.ceil(minutes / 60);
	if (hours < 24) return `em ${hours} h`;
	const days = Math.ceil(hours / 24);
	return `em ${days} dia${days === 1 ? '' : 's'}`;
}

export function pluralize(value, singular, plural = `${singular}s`) {
	return `${value} ${value === 1 ? singular : plural}`;
}

export function difficultyLabel(value) {
	return ({new: 'Novo', easy: 'Fácil', medium: 'Médio', hard: 'Difícil'})[value] ?? value;
}

export function gradeLabel(value) {
	return ({again: 'Errei', hard: 'Difícil', good: 'Bom', easy: 'Fácil'})[value] ?? value;
}
