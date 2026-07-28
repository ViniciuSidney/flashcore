import {APP_CONFIG} from './config.js';
import {DECK_COLORS, DECK_ICONS, THEMES} from './constants.js';
import {LocalStorageStateRepository} from '../data/local/local-storage-state-repository.js';
import {createId, parseTags} from '../shared/helpers.js';

const listeners = new Set();
const stateRepository = new LocalStorageStateRepository();

function reportRepositoryFailure(result, action) {
	if (result?.ok !== false) return;
	console.error(`Não foi possível ${action}:`, result.error);
}

function createInitialState() {
	return {
		schemaVersion: APP_CONFIG.schemaVersion,
		createdAt: Date.now(),
		updatedAt: Date.now(),
		settings: {
			theme: THEMES.SYSTEM,
			reviewLimit: APP_CONFIG.defaultReviewLimit,
			showIntervals: true,
			reviewScale: 100
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

function persistState(candidate, action) {
	const result = stateRepository.writePrimary(candidate);
	reportRepositoryFailure(result, action);
	return result;
}

function migrateLegacyState() {
	const result = stateRepository.readLegacySources();

	if (!result.ok) {
		reportRepositoryFailure(result, 'ler os dados legados');
		return null;
	}

	for (const source of result.data) {
		const legacy = source.state;
		if (!legacy || !Array.isArray(legacy.decks) || !Array.isArray(legacy.cards)) continue;

		const migrated = normalizeState({
			settings: legacy.settings,
			decks: legacy.decks,
			cards: legacy.cards,
			sessions: []
		});
		persistState(migrated, 'salvar os dados migrados');
		return migrated;
	}

	return null;
}

function loadInitialState() {
	const result = stateRepository.readPrimary();

	if (!result.ok) {
		reportRepositoryFailure(result, 'ler os dados locais');
		return normalizeState(migrateLegacyState());
	}

	return normalizeState(result.data.state ?? migrateLegacyState());
}

let state = loadInitialState();

export function getState() {
	return state;
}

export function mutateState(mutator, reason = 'update') {
	const draft = structuredClone(state);
	mutator(draft);
	draft.updatedAt = Date.now();
	state = normalizeState(draft);
	persistState(state, 'salvar os dados locais');
	listeners.forEach((listener) => listener(state, reason));
	return state;
}

export function replaceState(nextState, reason = 'replace') {
	state = normalizeState(nextState);
	state.updatedAt = Date.now();
	persistState(state, 'substituir os dados locais');
	listeners.forEach((listener) => listener(state, reason));
	return state;
}

export function resetState() {
	const clearResult = stateRepository.clearPrimary({reason: 'reset'});
	reportRepositoryFailure(clearResult, 'remover os dados locais');
	state = createInitialState();
	persistState(state, 'reinicializar os dados locais');
	listeners.forEach((listener) => listener(state, 'reset'));
	return state;
}

export function subscribeState(listener) {
	listeners.add(listener);
	return () => listeners.delete(listener);
}
