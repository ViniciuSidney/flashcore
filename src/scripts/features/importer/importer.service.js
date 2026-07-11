import {normalizeText, parseTags} from '../../shared/helpers.js';
import {isDuplicateCard} from '../cards/cards.model.js';

export function parseStructuredText(text) {
	return String(text)
		.split(/\r?\n/)
		.map((line, index) => ({line, lineNumber: index + 1}))
		.filter(({line}) => line.trim())
		.map(({line, lineNumber}) => {
			const parts = line.split('|').map((part) => part.trim());
			return {front: parts[0] ?? '', back: parts[1] ?? '', tags: parseTags(parts.slice(2).join(',')), lineNumber};
		});
}

export function parseCSV(text) {
	const source = String(text);
	const delimiter = detectDelimiter(source);
	const rows = parseCSVRows(source, delimiter);
	if (rows.length === 0) return [];
	const normalizedHeader = rows[0].map(normalizeText);
	const frontIndex = normalizedHeader.findIndex((cell) => ['front', 'frente', 'pergunta', 'question'].includes(cell));
	const backIndex = normalizedHeader.findIndex((cell) => ['back', 'verso', 'resposta', 'answer'].includes(cell));
	const tagsIndex = normalizedHeader.findIndex((cell) => ['tags', 'tag', 'etiquetas'].includes(cell));
	const hasHeader = frontIndex >= 0 && backIndex >= 0;
	const start = hasHeader ? 1 : 0;

	return rows.slice(start).map((row, index) => ({
		front: row[hasHeader ? frontIndex : 0] ?? '',
		back: row[hasHeader ? backIndex : 1] ?? '',
		tags: parseTags(row[hasHeader ? tagsIndex : 2] ?? ''),
		lineNumber: index + start + 1
	}));
}

function detectDelimiter(text) {
	const firstLine = text.split(/\r?\n/, 1)[0] ?? '';
	let commas = 0;
	let semicolons = 0;
	let quoted = false;
	for (const char of firstLine) {
		if (char === '"') quoted = !quoted;
		else if (!quoted && char === ',') commas++;
		else if (!quoted && char === ';') semicolons++;
	}
	return semicolons > commas ? ';' : ',';
}

function parseCSVRows(text, delimiter = ',') {
	const rows = [];
	let row = [];
	let cell = '';
	let quoted = false;

	for (let index = 0; index < text.length; index++) {
		const char = text[index];
		const next = text[index + 1];
		if (char === '"' && quoted && next === '"') {
			cell += '"';
			index++;
		} else if (char === '"') {
			quoted = !quoted;
		} else if (char === delimiter && !quoted) {
			row.push(cell.trim());
			cell = '';
		} else if ((char === '\n' || char === '\r') && !quoted) {
			if (char === '\r' && next === '\n') index++;
			row.push(cell.trim());
			if (row.some((value) => value !== '')) rows.push(row);
			row = [];
			cell = '';
		} else {
			cell += char;
		}
	}
	row.push(cell.trim());
	if (row.some((value) => value !== '')) rows.push(row);
	return rows;
}

export function analyzeRecords(deckId, records) {
	const accepted = [];
	return records.map((record) => {
		const front = String(record.front ?? '').trim();
		const back = String(record.back ?? '').trim();
		if (!front || !back) return {...record, front, back, status: 'invalid', message: 'Frente ou verso ausente'};
		const duplicate = isDuplicateCard(deckId, {front, back}, accepted);
		const analyzed = {...record, front, back, tags: parseTags(record.tags), status: duplicate ? 'duplicate' : 'valid', message: duplicate ? 'Possível duplicata' : 'Pronto para importar'};
		if (!duplicate) accepted.push(analyzed);
		return analyzed;
	});
}
