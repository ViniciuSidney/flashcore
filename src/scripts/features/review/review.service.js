import {APP_CONFIG} from '../../core/config.js';
import {GRADES} from '../../core/constants.js';
import {getState, mutateState} from '../../core/state.js';
import {createId} from '../../shared/helpers.js';

let activeSession = null;
let answerRevealed = false;

export function getActiveSession() {
	return activeSession;
}

export function isAnswerRevealed() {
	return answerRevealed;
}

export function revealAnswer() {
	answerRevealed = true;
}

export function sessionPreservesSchedule(session = activeSession) {
	return Boolean(session?.preserveSchedule || session?.mode === 'free');
}

export function getGradeIntervals(card) {
	const day = 24 * 60 * 60 * 1000;
	return {
		[GRADES.AGAIN]: {milliseconds: 10 * 60 * 1000, label: '10 min'},
		[GRADES.HARD]: {milliseconds: day, label: '1 dia'},
		[GRADES.GOOD]: {milliseconds: Math.max(2, card.correctStreak + 2) * day, label: `${Math.max(2, card.correctStreak + 2)} dias`},
		[GRADES.EASY]: {milliseconds: Math.max(4, card.correctStreak + 4) * day, label: `${Math.max(4, card.correctStreak + 4)} dias`}
	};
}

export function startSession({mode = 'scheduled', deckId = null, cardIds = null, preserveSchedule = mode === 'free'} = {}) {
	const state = getState();
	const limit = Number(state.settings.reviewLimit) || APP_CONFIG.defaultReviewLimit;
	let cards = state.cards.filter((card) => !deckId || card.deckId === deckId);

	if (Array.isArray(cardIds)) {
		const allowed = new Set(cardIds);
		cards = cards.filter((card) => allowed.has(card.id));
	} else if (mode === 'scheduled') {
		cards = cards.filter((card) => card.nextReviewAt <= Date.now());
	}

	cards = cards.sort((a, b) => a.nextReviewAt - b.nextReviewAt).slice(0, limit);
	if (cards.length === 0) return null;

	activeSession = {
		id: createId(),
		mode,
		preserveSchedule: Boolean(preserveSchedule),
		deckId,
		cardIds: cards.map((card) => card.id),
		currentIndex: 0,
		results: [],
		startedAt: Date.now()
	};
	answerRevealed = false;
	return activeSession;
}

export function getCurrentCard() {
	if (!activeSession) return null;
	const cardId = activeSession.cardIds[activeSession.currentIndex];
	return getState().cards.find((card) => card.id === cardId) ?? null;
}

function buildCompletedSession(session, completed, endedAt = Date.now()) {
	return {
		...session,
		endedAt,
		durationMs: endedAt - session.startedAt,
		completed,
		total: session.cardIds.length,
		answered: session.results.length
	};
}

function applyCardGrade(state, cardId, grade, now, nextReviewAt) {
	const storedCard = state.cards.find((item) => item.id === cardId);
	if (!storedCard) return;
	storedCard.reviewCount += 1;
	storedCard.correctStreak = grade === GRADES.AGAIN ? 0 : storedCard.correctStreak + 1;
	storedCard.difficulty = grade === GRADES.AGAIN || grade === GRADES.HARD
		? 'hard'
		: grade === GRADES.EASY
			? 'easy'
			: 'medium';
	storedCard.lastReviewedAt = now;
	storedCard.nextReviewAt = nextReviewAt;
	storedCard.updatedAt = now;
}

export async function gradeCurrentCard(grade) {
	const card = getCurrentCard();
	if (!activeSession || !card || !Object.values(GRADES).includes(grade)) {
		return {finished: false, persisted: false};
	}

	const interval = getGradeIntervals(card)[grade];
	const now = Date.now();
	const preserveSchedule = sessionPreservesSchedule(activeSession);
	const nextReviewAt = preserveSchedule ? card.nextReviewAt : now + interval.milliseconds;
	const nextSession = structuredClone(activeSession);

	nextSession.results.push({
		cardId: card.id,
		grade,
		answeredAt: now,
		nextReviewAt,
		schedulePreserved: preserveSchedule
	});
	nextSession.currentIndex += 1;

	const finished = nextSession.currentIndex >= nextSession.cardIds.length;
	const completedSession = finished
		? buildCompletedSession(nextSession, true, now)
		: null;

	if (!preserveSchedule || completedSession) {
		const mutationResult = await mutateState((state) => {
			if (!preserveSchedule) {
				applyCardGrade(state, card.id, grade, now, nextReviewAt);
			}

			if (completedSession) {
				state.sessions.push(completedSession);
				state.sessions = state.sessions.slice(-APP_CONFIG.maxSessionsStored);
			}
		}, finished ? 'review:grade-and-finish' : 'review:grade');

		if (!mutationResult.ok) {
			return {
				finished: false,
				persisted: false,
				error: mutationResult.error
			};
		}
	}

	answerRevealed = false;

	if (completedSession) {
		activeSession = null;
		return {
			finished: true,
			persisted: true,
			session: completedSession
		};
	}

	activeSession = nextSession;
	return {
		finished: false,
		persisted: true,
		session: activeSession
	};
}

export async function finishSession(completed = true) {
	if (!activeSession) return null;
	const session = buildCompletedSession(activeSession, completed);
	const result = await mutateState((state) => {
		state.sessions.push(session);
		state.sessions = state.sessions.slice(-APP_CONFIG.maxSessionsStored);
	}, 'review:finish');

	if (!result.ok) return null;

	activeSession = null;
	answerRevealed = false;
	return session;
}

export function discardSession() {
	activeSession = null;
	answerRevealed = false;
}

export function getLatestSession() {
	return getState().sessions.at(-1) ?? null;
}
