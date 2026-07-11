import {APP_CONFIG} from './config.js';
import {DECK_COLORS, DECK_ICONS, THEMES} from './constants.js';
import {getStorageItem, removeStorageItem, setStorageItem} from '../shared/storage.js';
import {createId, parseTags} from '../shared/helpers.js';

const listeners = new Set();

function createInitialState() {
	return {
		schemaVersion: APP_CONFIG.schemaVersion,
		createdAt: Date.now(),
		updatedAt: Date.now(),
		settings: {
			theme: THEMES.SYSTEM,
			reviewLimit: APP_CONFIG.defaultReviewLimit,
			showIntervals: true
		},
		decks: [],
		cards: [],
		sessions: []
	};
}

function normalizeState(input) {
	const base = createInitialState();
	if (!input || typeof input !== 'object') return base;

	return {
		...base,
		...input,
		schemaVersion: APP_CONFIG.schemaVersion,
		settings: {...base.settings, ...(input.settings ?? {})},
		decks: Array.isArray(input.decks) ? input.decks.map(normalizeDeck) : [],
		cards: Array.isArray(input.cards) ? input.cards.map(normalizeCard) : [],
		sessions: Array.isArray(input.sessions) ? input.sessions.slice(-APP_CONFIG.maxSessionsStored) : []
	};
}

function normalizeDeck(deck, index = 0) {
	return {
		id: deck.id || createId(),
		name: String(deck.name || 'Baralho sem nome').trim(),
		description: String(deck.description || '').trim(),
		color: deck.color || DECK_COLORS[index % DECK_COLORS.length],
		icon: deck.icon || DECK_ICONS[index % DECK_ICONS.length],
		createdAt: Number(deck.createdAt) || Date.now(),
		updatedAt: Number(deck.updatedAt) || Number(deck.createdAt) || Date.now(),
		lastOpenedAt: Number(deck.lastOpenedAt) || 0
	};
}

function normalizeCard(card) {
	return {
		id: card.id || createId(),
		deckId: card.deckId || '',
		front: String(card.front || '').trim(),
		back: String(card.back || '').trim(),
		tags: parseTags(card.tags || []),
		difficulty: card.difficulty || 'new',
		createdAt: Number(card.createdAt) || Date.now(),
		updatedAt: Number(card.updatedAt) || Number(card.createdAt) || Date.now(),
		reviewCount: Number(card.reviewCount) || 0,
		correctStreak: Number(card.correctStreak) || 0,
		lastReviewedAt: Number(card.lastReviewedAt) || 0,
		nextReviewAt: Number(card.nextReviewAt) || Date.now()
	};
}

function migrateLegacyState() {
	for (const key of APP_CONFIG.legacyStorageKeys) {
		const legacy = getStorageItem(key, null);
		if (!legacy || !Array.isArray(legacy.decks) || !Array.isArray(legacy.cards)) continue;

		const migrated = normalizeState({
			settings: legacy.settings,
			decks: legacy.decks,
			cards: legacy.cards,
			sessions: []
		});
		setStorageItem(APP_CONFIG.storageKey, migrated);
		return migrated;
	}
	return null;
}

let state = normalizeState(getStorageItem(APP_CONFIG.storageKey, null) ?? migrateLegacyState());

export function getState() {
	return state;
}

export function mutateState(mutator, reason = 'update') {
	const draft = structuredClone(state);
	mutator(draft);
	draft.updatedAt = Date.now();
	state = normalizeState(draft);
	setStorageItem(APP_CONFIG.storageKey, state);
	listeners.forEach((listener) => listener(state, reason));
	return state;
}

export function replaceState(nextState, reason = 'replace') {
	state = normalizeState(nextState);
	state.updatedAt = Date.now();
	setStorageItem(APP_CONFIG.storageKey, state);
	listeners.forEach((listener) => listener(state, reason));
	return state;
}

export function resetState() {
	removeStorageItem(APP_CONFIG.storageKey);
	state = createInitialState();
	setStorageItem(APP_CONFIG.storageKey, state);
	listeners.forEach((listener) => listener(state, 'reset'));
	return state;
}

export function subscribeState(listener) {
	listeners.add(listener);
	return () => listeners.delete(listener);
}
