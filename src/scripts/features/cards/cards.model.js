import {getState, mutateState} from '../../core/state.js';
import {createId, normalizeText, parseTags} from '../../shared/helpers.js';

export function getCardById(cardId) {
	return getState().cards.find((card) => card.id === cardId) ?? null;
}

export function getCardsByDeck(deckId) {
	return getState().cards.filter((card) => card.deckId === deckId);
}

export function getFilteredCards(deckId, {search = '', filter = 'all'} = {}) {
	const query = normalizeText(search);
	return getCardsByDeck(deckId)
		.filter((card) => {
			const searchable = normalizeText(`${card.front} ${card.back} ${card.tags.join(' ')}`);
			const matchesSearch = !query || searchable.includes(query);
			const matchesFilter =
				filter === 'all' ||
				(filter === 'due' && card.nextReviewAt <= Date.now()) ||
				(filter === 'new' && card.reviewCount === 0) ||
				(filter === 'hard' && card.difficulty === 'hard');
			return matchesSearch && matchesFilter;
		})
		.sort((a, b) => a.nextReviewAt - b.nextReviewAt || b.updatedAt - a.updatedAt);
}

export function createCard(data) {
	const card = {
		id: createId(),
		deckId: data.deckId,
		front: data.front.trim(),
		back: data.back.trim(),
		tags: parseTags(data.tags),
		difficulty: data.difficulty || 'new',
		createdAt: Date.now(),
		updatedAt: Date.now(),
		reviewCount: 0,
		correctStreak: 0,
		lastReviewedAt: 0,
		nextReviewAt: Date.now()
	};
	mutateState((state) => state.cards.push(card), 'card:create');
	return card;
}

export function updateCard(cardId, data) {
	mutateState((state) => {
		const card = state.cards.find((item) => item.id === cardId);
		if (!card) return;
		card.deckId = data.deckId;
		card.front = data.front.trim();
		card.back = data.back.trim();
		card.tags = parseTags(data.tags);
		card.difficulty = data.difficulty || card.difficulty;
		card.updatedAt = Date.now();
	}, 'card:update');
}

export function moveCard(cardId, deckId) {
	mutateState((state) => {
		const card = state.cards.find((item) => item.id === cardId);
		if (!card) return;
		card.deckId = deckId;
		card.updatedAt = Date.now();
	}, 'card:move');
}

export function deleteCard(cardId) {
	mutateState((state) => {
		state.cards = state.cards.filter((card) => card.id !== cardId);
	}, 'card:delete');
}

export function addImportedCards(deckId, records) {
	const now = Date.now();
	const cards = records.map((record) => ({
		id: createId(),
		deckId,
		front: record.front.trim(),
		back: record.back.trim(),
		tags: parseTags(record.tags),
		difficulty: 'new',
		createdAt: now,
		updatedAt: now,
		reviewCount: 0,
		correctStreak: 0,
		lastReviewedAt: 0,
		nextReviewAt: now
	}));
	mutateState((state) => state.cards.push(...cards), 'cards:import');
	return cards;
}

export function isDuplicateCard(deckId, candidate, additionalRecords = []) {
	const key = `${normalizeText(candidate.front)}::${normalizeText(candidate.back)}`;
	const existing = getState().cards.some((card) => card.deckId === deckId && `${normalizeText(card.front)}::${normalizeText(card.back)}` === key);
	if (existing) return true;
	return additionalRecords.some((record) => `${normalizeText(record.front)}::${normalizeText(record.back)}` === key);
}
