import {APP_CONFIG} from './config.js';
import {DECK_COLORS, DECK_ICONS, THEMES} from './constants.js';
import {AppStateStore, APP_STATE_PHASES} from './app-state-store.js';
import {LocalStorageStateRepository} from '../data/local/local-storage-state-repository.js';
import {StateSchemaService} from '../data/validation/state-schema.service.js';
import {createSuccessResult} from '../shared/result.js';
import {createId, parseTags} from '../shared/helpers.js';

const stateRepository = new LocalStorageStateRepository();
const stateSchemaService = new StateSchemaService();
let initializationPromise = null;

function reportStateFailure(result, action) {
	if (result?.ok !== false) return;
	console.error(`Não foi possível ${action}:`, result.error);
}

function createInitialState() {
	const now = Date.now();

	return {
		schemaVersion: APP_CONFIG.schemaVersion,
		createdAt: now,
		updatedAt: now,
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
		sessions: Array.isArray(input.sessions)
			? input.sessions.slice(-APP_CONFIG.maxSessionsStored)
			: []
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

const appStateStore = new AppStateStore({
	repository: stateRepository,
	schemaService: stateSchemaService,
	createInitialState,
	normalizeInternalState: normalizeState
});

async function prepareLegacyMigration() {
	const primaryResult = await stateRepository.readPrimary();
	if (!primaryResult.ok) return primaryResult;

	if (primaryResult.data.exists) {
		return createSuccessResult(
			{migrated: false, source: 'primary'},
			{metadata: {stage: 'legacy-preflight'}}
		);
	}

	const legacyResult = await stateRepository.readLegacySources();
	if (!legacyResult.ok) return legacyResult;

	for (const source of legacyResult.data) {
		const legacy = source.state;
		if (!legacy || !Array.isArray(legacy.decks) || !Array.isArray(legacy.cards)) {
			continue;
		}

		const migrated = normalizeState({
			settings: legacy.settings,
			decks: legacy.decks,
			cards: legacy.cards,
			sessions: []
		});
		const validationResult = stateSchemaService.validate(migrated);
		if (!validationResult.ok) continue;

		const writeResult = await stateRepository.writePrimary(
			validationResult.data.state
		);
		if (!writeResult.ok) return writeResult;

		return createSuccessResult(
			{
				migrated: true,
				source: source.key,
				state: writeResult.data.state
			},
			{
				warnings: validationResult.warnings,
				metadata: {
					stage: 'legacy-preflight',
					preservedLegacySource: true
				}
			}
		);
	}

	return createSuccessResult(
		{migrated: false, source: null},
		{metadata: {stage: 'legacy-preflight'}}
	);
}

async function runInitialization() {
	const migrationResult = await prepareLegacyMigration();
	if (!migrationResult.ok) {
		reportStateFailure(migrationResult, 'preparar os dados locais');
		return migrationResult;
	}

	const result = await appStateStore.initialize();
	reportStateFailure(result, 'inicializar o estado da aplicação');
	return result;
}

export async function initializeState() {
	if (appStateStore.getStatus().phase === APP_STATE_PHASES.READY) {
		return appStateStore.initialize();
	}

	if (initializationPromise) return initializationPromise;

	initializationPromise = runInitialization();

	try {
		return await initializationPromise;
	} finally {
		initializationPromise = null;
	}
}

export function getState() {
	const snapshot = appStateStore.getSnapshot();

	if (snapshot === null) {
		throw new Error(
			'O estado ainda não foi inicializado. Execute initializeState() antes de acessá-lo.'
		);
	}

	return snapshot;
}

export async function mutateState(mutator, reason = 'update') {
	const initializationResult = await initializeState();
	if (!initializationResult.ok) return initializationResult;

	const result = await appStateStore.executeMutation(mutator, {reason});
	reportStateFailure(result, 'salvar os dados locais');
	return result;
}

export async function replaceState(nextState, reason = 'replace') {
	const initializationResult = await initializeState();
	if (!initializationResult.ok) return initializationResult;

	const result = await appStateStore.executeMutation(
		() => nextState,
		{reason}
	);
	reportStateFailure(result, 'substituir os dados locais');
	return result;
}

export async function resetState() {
	const initializationResult = await initializeState();
	if (!initializationResult.ok) return initializationResult;

	const result = await appStateStore.resetToInitialState({reason: 'reset'});
	reportStateFailure(result, 'reinicializar os dados locais');
	return result;
}

export function subscribeState(listener) {
	return appStateStore.subscribe(listener);
}

export function getStateStatus() {
	return appStateStore.getStatus();
}
