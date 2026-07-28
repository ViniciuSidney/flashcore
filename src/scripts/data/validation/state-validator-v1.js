import {
	DIFFICULTIES,
	GRADES,
	THEMES
} from '../../core/constants.js';

export const STATE_SCHEMA_VERSION_V1 = 1;

const REVIEW_SCALES = Object.freeze([100, 125, 150]);
const SESSION_MODES = Object.freeze(['scheduled', 'free', 'retry']);

function isPlainObject(value) {
	if (value === null || typeof value !== 'object') return false;
	const prototype = Object.getPrototypeOf(value);
	return prototype === Object.prototype || prototype === null;
}

function freezeIssue(issue) {
	return Object.freeze({...issue});
}

function createIssue(code, path, message, details = {}) {
	return freezeIssue({
		code,
		path,
		message,
		details: Object.freeze({...details})
	});
}

function pushInvalidField(errors, path, expected, received) {
	errors.push(
		createIssue(
			'STATE_FIELD_INVALID',
			path,
			`O campo ${path} possui um valor inválido.`,
			{expected, received}
		)
	);
}

function validateRequiredString(value, path, errors, {allowEmpty = false} = {}) {
	if (typeof value !== 'string' || (!allowEmpty && value.trim() === '')) {
		pushInvalidField(errors, path, allowEmpty ? 'string' : 'non-empty string', typeof value);
		return false;
	}

	return true;
}

function validateNumber(value, path, errors, {
	integer = false,
	minimum = 0
} = {}) {
	const valid = typeof value === 'number' &&
		Number.isFinite(value) &&
		(!integer || Number.isInteger(value)) &&
		value >= minimum;

	if (!valid) {
		pushInvalidField(
			errors,
			path,
			`${integer ? 'integer' : 'number'} >= ${minimum}`,
			value
		);
	}

	return valid;
}

function validateTimestampOrder(entity, path, errors) {
	if (
		typeof entity.createdAt === 'number' &&
		typeof entity.updatedAt === 'number' &&
		entity.updatedAt < entity.createdAt
	) {
		errors.push(
			createIssue(
				'STATE_TIMESTAMP_ORDER_INVALID',
				`${path}.updatedAt`,
				'O timestamp de atualização não pode ser anterior ao de criação.',
				{
					createdAt: entity.createdAt,
					updatedAt: entity.updatedAt
				}
			)
		);
	}
}

function validateSettings(settings, errors) {
	const path = 'settings';

	if (!isPlainObject(settings)) {
		pushInvalidField(errors, path, 'object', typeof settings);
		return;
	}

	if (!Object.values(THEMES).includes(settings.theme)) {
		pushInvalidField(errors, `${path}.theme`, Object.values(THEMES).join('|'), settings.theme);
	}

	validateNumber(settings.reviewLimit, `${path}.reviewLimit`, errors, {
		integer: true,
		minimum: 1
	});

	if (typeof settings.showIntervals !== 'boolean') {
		pushInvalidField(errors, `${path}.showIntervals`, 'boolean', typeof settings.showIntervals);
	}

	if (!REVIEW_SCALES.includes(settings.reviewScale)) {
		pushInvalidField(errors, `${path}.reviewScale`, REVIEW_SCALES.join('|'), settings.reviewScale);
	}
}

function validateDeck(deck, index, errors) {
	const path = `decks[${index}]`;

	if (!isPlainObject(deck)) {
		pushInvalidField(errors, path, 'object', typeof deck);
		return;
	}

	validateRequiredString(deck.id, `${path}.id`, errors);
	validateRequiredString(deck.name, `${path}.name`, errors);
	validateRequiredString(deck.description, `${path}.description`, errors, {allowEmpty: true});
	validateRequiredString(deck.color, `${path}.color`, errors);
	validateRequiredString(deck.icon, `${path}.icon`, errors);
	validateNumber(deck.createdAt, `${path}.createdAt`, errors);
	validateNumber(deck.updatedAt, `${path}.updatedAt`, errors);
	validateNumber(deck.lastOpenedAt, `${path}.lastOpenedAt`, errors);
	validateTimestampOrder(deck, path, errors);
}

function validateTags(tags, path, errors) {
	if (!Array.isArray(tags)) {
		pushInvalidField(errors, path, 'array', typeof tags);
		return;
	}

	tags.forEach((tag, index) => {
		validateRequiredString(tag, `${path}[${index}]`, errors);
	});
}

function validateCard(card, index, errors) {
	const path = `cards[${index}]`;

	if (!isPlainObject(card)) {
		pushInvalidField(errors, path, 'object', typeof card);
		return;
	}

	validateRequiredString(card.id, `${path}.id`, errors);
	validateRequiredString(card.deckId, `${path}.deckId`, errors);
	validateRequiredString(card.front, `${path}.front`, errors);
	validateRequiredString(card.back, `${path}.back`, errors);
	validateTags(card.tags, `${path}.tags`, errors);

	if (!Object.values(DIFFICULTIES).includes(card.difficulty)) {
		pushInvalidField(
			errors,
			`${path}.difficulty`,
			Object.values(DIFFICULTIES).join('|'),
			card.difficulty
		);
	}

	validateNumber(card.createdAt, `${path}.createdAt`, errors);
	validateNumber(card.updatedAt, `${path}.updatedAt`, errors);
	validateNumber(card.reviewCount, `${path}.reviewCount`, errors, {integer: true});
	validateNumber(card.correctStreak, `${path}.correctStreak`, errors, {integer: true});
	validateNumber(card.lastReviewedAt, `${path}.lastReviewedAt`, errors);
	validateNumber(card.nextReviewAt, `${path}.nextReviewAt`, errors);
	validateTimestampOrder(card, path, errors);
}

function validateSessionResult(result, sessionIndex, resultIndex, session, errors) {
	const path = `sessions[${sessionIndex}].results[${resultIndex}]`;

	if (!isPlainObject(result)) {
		pushInvalidField(errors, path, 'object', typeof result);
		return;
	}

	validateRequiredString(result.cardId, `${path}.cardId`, errors);

	if (!Object.values(GRADES).includes(result.grade)) {
		pushInvalidField(errors, `${path}.grade`, Object.values(GRADES).join('|'), result.grade);
	}

	validateNumber(result.answeredAt, `${path}.answeredAt`, errors);
	validateNumber(result.nextReviewAt, `${path}.nextReviewAt`, errors);

	if (typeof result.schedulePreserved !== 'boolean') {
		pushInvalidField(
			errors,
			`${path}.schedulePreserved`,
			'boolean',
			typeof result.schedulePreserved
		);
	}

	if (
		Array.isArray(session.cardIds) &&
		typeof result.cardId === 'string' &&
		!session.cardIds.includes(result.cardId)
	) {
		errors.push(
			createIssue(
				'STATE_SESSION_RESULT_NOT_IN_SESSION',
				`${path}.cardId`,
				'O resultado referencia um card que não pertence à sessão.',
				{cardId: result.cardId}
			)
		);
	}
}

function validateSession(session, index, errors) {
	const path = `sessions[${index}]`;

	if (!isPlainObject(session)) {
		pushInvalidField(errors, path, 'object', typeof session);
		return;
	}

	validateRequiredString(session.id, `${path}.id`, errors);

	if (!SESSION_MODES.includes(session.mode)) {
		pushInvalidField(errors, `${path}.mode`, SESSION_MODES.join('|'), session.mode);
	}

	if (typeof session.preserveSchedule !== 'boolean') {
		pushInvalidField(errors, `${path}.preserveSchedule`, 'boolean', typeof session.preserveSchedule);
	}

	if (session.deckId !== null) {
		validateRequiredString(session.deckId, `${path}.deckId`, errors);
	}

	if (!Array.isArray(session.cardIds)) {
		pushInvalidField(errors, `${path}.cardIds`, 'array', typeof session.cardIds);
	} else {
		session.cardIds.forEach((cardId, cardIndex) => {
			validateRequiredString(cardId, `${path}.cardIds[${cardIndex}]`, errors);
		});
	}

	validateNumber(session.currentIndex, `${path}.currentIndex`, errors, {integer: true});

	if (!Array.isArray(session.results)) {
		pushInvalidField(errors, `${path}.results`, 'array', typeof session.results);
	} else {
		session.results.forEach((result, resultIndex) => {
			validateSessionResult(result, index, resultIndex, session, errors);
		});
	}

	validateNumber(session.startedAt, `${path}.startedAt`, errors);
	validateNumber(session.endedAt, `${path}.endedAt`, errors);
	validateNumber(session.durationMs, `${path}.durationMs`, errors);

	if (typeof session.completed !== 'boolean') {
		pushInvalidField(errors, `${path}.completed`, 'boolean', typeof session.completed);
	}

	validateNumber(session.total, `${path}.total`, errors, {integer: true});
	validateNumber(session.answered, `${path}.answered`, errors, {integer: true});

	if (Array.isArray(session.cardIds) && session.total !== session.cardIds.length) {
		errors.push(
			createIssue(
				'STATE_SESSION_TOTAL_MISMATCH',
				`${path}.total`,
				'O total da sessão não corresponde à quantidade de cards.',
				{total: session.total, cardCount: session.cardIds.length}
			)
		);
	}

	if (Array.isArray(session.results) && session.answered !== session.results.length) {
		errors.push(
			createIssue(
				'STATE_SESSION_ANSWERED_MISMATCH',
				`${path}.answered`,
				'A quantidade respondida não corresponde aos resultados.',
				{answered: session.answered, resultCount: session.results.length}
			)
		);
	}

	if (
		Number.isInteger(session.currentIndex) &&
		Array.isArray(session.cardIds) &&
		session.currentIndex > session.cardIds.length
	) {
		errors.push(
			createIssue(
				'STATE_SESSION_INDEX_OUT_OF_RANGE',
				`${path}.currentIndex`,
				'O índice atual ultrapassa a quantidade de cards da sessão.',
				{currentIndex: session.currentIndex, cardCount: session.cardIds.length}
			)
		);
	}

	if (
		typeof session.startedAt === 'number' &&
		typeof session.endedAt === 'number' &&
		session.endedAt < session.startedAt
	) {
		errors.push(
			createIssue(
				'STATE_SESSION_TIME_ORDER_INVALID',
				`${path}.endedAt`,
				'O encerramento da sessão não pode ser anterior ao início.',
				{startedAt: session.startedAt, endedAt: session.endedAt}
			)
		);
	}

	if (
		typeof session.startedAt === 'number' &&
		typeof session.endedAt === 'number' &&
		typeof session.durationMs === 'number' &&
		session.endedAt >= session.startedAt &&
		session.durationMs !== session.endedAt - session.startedAt
	) {
		errors.push(
			createIssue(
				'STATE_SESSION_DURATION_MISMATCH',
				`${path}.durationMs`,
				'A duração não corresponde aos timestamps da sessão.',
				{
					durationMs: session.durationMs,
					expected: session.endedAt - session.startedAt
				}
			)
		);
	}
}

function findDuplicateIds(items, collectionName, errors) {
	const seen = new Map();

	items.forEach((item, index) => {
		if (!isPlainObject(item) || typeof item.id !== 'string' || item.id.trim() === '') return;

		if (seen.has(item.id)) {
			errors.push(
				createIssue(
					'STATE_DUPLICATE_ID',
					`${collectionName}[${index}].id`,
					`O identificador ${item.id} está duplicado em ${collectionName}.`,
					{
						id: item.id,
						firstIndex: seen.get(item.id),
						duplicateIndex: index
					}
				)
			);
			return;
		}

		seen.set(item.id, index);
	});
}

function validateRelationships(state, errors, warnings) {
	const deckIds = new Set(
		state.decks
			.filter((deck) => isPlainObject(deck) && typeof deck.id === 'string')
			.map((deck) => deck.id)
	);
	const cardIds = new Set(
		state.cards
			.filter((card) => isPlainObject(card) && typeof card.id === 'string')
			.map((card) => card.id)
	);

	state.cards.forEach((card, index) => {
		if (!isPlainObject(card) || typeof card.deckId !== 'string') return;
		if (deckIds.has(card.deckId)) return;

		errors.push(
			createIssue(
				'STATE_CARD_DECK_NOT_FOUND',
				`cards[${index}].deckId`,
				'O card referencia um baralho inexistente.',
				{cardId: card.id ?? null, deckId: card.deckId}
			)
		);
	});

	state.sessions.forEach((session, sessionIndex) => {
		if (!isPlainObject(session)) return;

		if (
			typeof session.deckId === 'string' &&
			session.deckId.trim() !== '' &&
			!deckIds.has(session.deckId)
		) {
			warnings.push(
				createIssue(
					'STATE_HISTORICAL_DECK_NOT_FOUND',
					`sessions[${sessionIndex}].deckId`,
					'A sessão histórica referencia um baralho que já não existe.',
					{sessionId: session.id ?? null, deckId: session.deckId}
				)
			);
		}

		if (Array.isArray(session.cardIds)) {
			session.cardIds.forEach((cardId, cardIndex) => {
				if (typeof cardId !== 'string' || cardIds.has(cardId)) return;
				warnings.push(
					createIssue(
						'STATE_HISTORICAL_CARD_NOT_FOUND',
						`sessions[${sessionIndex}].cardIds[${cardIndex}]`,
						'A sessão histórica referencia um card que já não existe.',
						{sessionId: session.id ?? null, cardId}
					)
				);
			});
		}
	});
}

export function validateStateV1(input) {
	const errors = [];
	const warnings = [];

	if (!isPlainObject(input)) {
		errors.push(
			createIssue(
				'STATE_ROOT_INVALID',
				'$root',
				'O estado deve ser um objeto JSON.',
				{received: input === null ? 'null' : typeof input}
			)
		);

		return Object.freeze({
			valid: false,
			errors: Object.freeze(errors),
			warnings: Object.freeze(warnings),
			summary: Object.freeze({decks: 0, cards: 0, sessions: 0})
		});
	}

	if (input.schemaVersion !== STATE_SCHEMA_VERSION_V1) {
		pushInvalidField(
			errors,
			'schemaVersion',
			STATE_SCHEMA_VERSION_V1,
			input.schemaVersion
		);
	}

	validateNumber(input.createdAt, 'createdAt', errors);
	validateNumber(input.updatedAt, 'updatedAt', errors);

	if (
		typeof input.createdAt === 'number' &&
		typeof input.updatedAt === 'number' &&
		input.updatedAt < input.createdAt
	) {
		errors.push(
			createIssue(
				'STATE_TIMESTAMP_ORDER_INVALID',
				'updatedAt',
				'O estado não pode ter atualização anterior à criação.',
				{createdAt: input.createdAt, updatedAt: input.updatedAt}
			)
		);
	}

	validateSettings(input.settings, errors);

	for (const collectionName of ['decks', 'cards', 'sessions']) {
		if (!Array.isArray(input[collectionName])) {
			pushInvalidField(errors, collectionName, 'array', typeof input[collectionName]);
		}
	}

	const decks = Array.isArray(input.decks) ? input.decks : [];
	const cards = Array.isArray(input.cards) ? input.cards : [];
	const sessions = Array.isArray(input.sessions) ? input.sessions : [];

	decks.forEach((deck, index) => validateDeck(deck, index, errors));
	cards.forEach((card, index) => validateCard(card, index, errors));
	sessions.forEach((session, index) => validateSession(session, index, errors));

	findDuplicateIds(decks, 'decks', errors);
	findDuplicateIds(cards, 'cards', errors);
	findDuplicateIds(sessions, 'sessions', errors);

	validateRelationships({decks, cards, sessions}, errors, warnings);

	return Object.freeze({
		valid: errors.length === 0,
		errors: Object.freeze(errors),
		warnings: Object.freeze(warnings),
		summary: Object.freeze({
			decks: decks.length,
			cards: cards.length,
			sessions: sessions.length
		})
	});
}
