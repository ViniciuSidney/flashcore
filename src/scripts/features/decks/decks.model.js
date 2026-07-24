import {DECK_COLORS, DECK_ICONS} from '../../core/constants.js';
import {getState, mutateState} from '../../core/state.js';
import {createId} from '../../shared/helpers.js';

export function getDecks() {
	return getState().decks;
}

export function getDeckById(deckId) {
	return getState().decks.find((deck) => deck.id === deckId) ?? null;
}

export function getPreferredDeckId(preferredDeckId = '') {
	const decks = getState().decks;
	if (preferredDeckId && decks.some((deck) => deck.id === preferredDeckId)) return preferredDeckId;
	return [...decks]
		.sort((a, b) => (b.lastOpenedAt || b.updatedAt || 0) - (a.lastOpenedAt || a.updatedAt || 0))[0]?.id ?? '';
}

export function getDeckStats(deckId) {
	const cards = getState().cards.filter((card) => card.deckId === deckId);
	return {
		total: cards.length,
		due: cards.filter((card) => card.nextReviewAt <= Date.now()).length,
		newCount: cards.filter((card) => card.reviewCount === 0).length
	};
}

export function createDeck(data) {
	const deck = {
		id: createId(),
		name: data.name.trim(),
		description: data.description?.trim() ?? '',
		color: data.color || DECK_COLORS[0],
		icon: data.icon || DECK_ICONS[0],
		createdAt: Date.now(),
		updatedAt: Date.now(),
		lastOpenedAt: 0
	};
	mutateState((state) => state.decks.push(deck), 'deck:create');
	return deck;
}

export function updateDeck(deckId, data) {
	mutateState((state) => {
		const deck = state.decks.find((item) => item.id === deckId);
		if (!deck) return;
		deck.name = data.name.trim();
		deck.description = data.description?.trim() ?? '';
		deck.color = data.color || deck.color;
		deck.icon = data.icon || deck.icon;
		deck.updatedAt = Date.now();
	}, 'deck:update');
}

export function deleteDeck(deckId) {
	mutateState((state) => {
		state.decks = state.decks.filter((deck) => deck.id !== deckId);
		state.cards = state.cards.filter((card) => card.deckId !== deckId);
	}, 'deck:delete');
}

export function touchDeck(deckId) {
	mutateState((state) => {
		const deck = state.decks.find((item) => item.id === deckId);
		if (deck) deck.lastOpenedAt = Date.now();
	}, 'deck:open');
}

export function createExampleData() {
	if (getState().decks.length > 0 || getState().cards.length > 0) return false;
	const now = Date.now();
	const mathId = createId();
	const techId = createId();
	mutateState((state) => {
		state.decks = [
			{id: mathId, name: 'Matemática', description: 'Conceitos, fórmulas e exercícios importantes.', color: '#2563eb', icon: '🧮', createdAt: now, updatedAt: now, lastOpenedAt: now},
			{id: techId, name: 'Informática', description: 'Programação, redes e fundamentos da área técnica.', color: '#0284c7', icon: '💻', createdAt: now, updatedAt: now, lastOpenedAt: now - 1000}
		];
		state.cards = [
			{
				id: createId(), deckId: mathId,
				front: 'O que é um evento complementar em Probabilidade?',
				back: 'É o evento formado pelos resultados que não pertencem ao evento original. P(Aᶜ) = 1 − P(A).',
				tags: ['probabilidade', 'estatística'], difficulty: 'medium', createdAt: now, updatedAt: now,
				reviewCount: 0, correctStreak: 0, lastReviewedAt: 0, nextReviewAt: now
			},
			{
				id: createId(), deckId: mathId,
				front: 'Qual é a diferença entre variância e desvio padrão?',
				back: 'A variância mede a dispersão em unidades ao quadrado; o desvio padrão é sua raiz e fica na mesma unidade dos dados.',
				tags: ['estatística'], difficulty: 'new', createdAt: now, updatedAt: now,
				reviewCount: 0, correctStreak: 0, lastReviewedAt: 0, nextReviewAt: now
			},
			{
				id: createId(), deckId: techId,
				front: 'Qual é a função do localStorage?',
				back: 'Salvar pequenos dados no navegador de forma persistente, mesmo depois de recarregar ou fechar a página.',
				tags: ['javascript', 'web'], difficulty: 'easy', createdAt: now, updatedAt: now,
				reviewCount: 1, correctStreak: 1, lastReviewedAt: now - 86400000, nextReviewAt: now
			}
		];
	}, 'example:create');
	return true;
}
