import {normalizeText} from './helpers.js';

export function validateRequired(value) {
	return String(value ?? '').trim().length > 0;
}

export function validateDeckName(name, decks, ignoredId = null) {
	const cleanName = String(name ?? '').trim();
	if (!cleanName) return 'Informe um nome para o baralho.';
	if (cleanName.length > 42) return 'O nome deve ter no máximo 42 caracteres.';
	const duplicate = decks.some((deck) => deck.id !== ignoredId && normalizeText(deck.name) === normalizeText(cleanName));
	if (duplicate) return 'Já existe um baralho com esse nome.';
	return '';
}

export function validateCard({front, back, deckId}, decks) {
	if (!String(front ?? '').trim()) return 'Preencha a frente do flashcard.';
	if (!String(back ?? '').trim()) return 'Preencha o verso do flashcard.';
	if (!decks.some((deck) => deck.id === deckId)) return 'Escolha um baralho válido.';
	return '';
}
