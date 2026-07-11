import {GRADES} from '../../core/constants.js';
import {getState} from '../../core/state.js';
import {escapeHTML} from '../../shared/helpers.js';
import {formatDuration, gradeLabel, pluralize} from '../../shared/formatters.js';
import {getDeckById, getDeckStats} from '../decks/decks.model.js';
import {getActiveSession, getCurrentCard, getGradeIntervals, getLatestSession, isAnswerRevealed} from './review.service.js';

export function renderReview() {
	const session = getActiveSession();
	return session ? renderActiveReview(session) : renderReviewLanding();
}

function renderReviewLanding() {
	const state = getState();
	const due = state.cards.filter((card) => card.nextReviewAt <= Date.now());
	const deckRows = state.decks.map((deck) => {
		const stats = getDeckStats(deck.id);
		return `
			<article class="settings-item">
				<div class="deck-page-header__identity">
					<span class="deck-icon" style="--deck-color:${deck.color}" aria-hidden="true">${deck.icon}</span>
					<div><h3>${escapeHTML(deck.name)}</h3><p>${pluralize(stats.due, 'card')} disponível(is) • ${pluralize(stats.total, 'card')} no total</p></div>
				</div>
				<div class="button-row">
					<button class="button button--primary button--small" type="button" data-action="start-scheduled-deck-review" data-deck-id="${deck.id}" ${stats.due === 0 ? 'disabled' : ''}>Revisar pendentes</button>
					<button class="button button--secondary button--small" type="button" data-action="start-free-review" data-deck-id="${deck.id}" ${stats.total === 0 ? 'disabled' : ''}>Revisão livre</button>
				</div>
			</article>
		`;
	}).join('');

	return `
		<div class="page-stack">
			<header class="page-intro">
				<div class="page-intro__copy"><span class="eyebrow">Estudo ativo</span><h2>Escolha como revisar</h2><p>Use a revisão programada para seguir os intervalos ou abra qualquer baralho em modo livre.</p></div>
				<button class="button button--primary" type="button" data-action="start-scheduled-review" ${due.length === 0 ? 'disabled' : ''}>▶ Revisar ${due.length} agora</button>
			</header>
			<section class="panel panel--accent">
				<header class="panel-header"><div class="panel-header__copy"><span class="eyebrow">Fila geral</span><h2>${due.length > 0 ? `${pluralize(due.length, 'card')} aguardando` : 'Tudo em dia'}</h2><p>${due.length > 0 ? 'A fila reúne os cards cuja próxima data de revisão já chegou.' : 'Escolha uma revisão livre para estudar mesmo sem cards vencidos.'}</p></div></header>
				<div class="panel-body"><div class="button-row"><button class="button button--primary" type="button" data-action="start-scheduled-review" ${due.length === 0 ? 'disabled' : ''}>Iniciar fila geral</button><a class="button button--secondary" href="#decks">Ver baralhos</a></div></div>
			</section>
			<section class="panel">
				<header class="panel-header"><div class="panel-header__copy"><span class="eyebrow">Por baralho</span><h2>Sessões direcionadas</h2><p>Escolha entre os cards pendentes ou todos os cards do baralho.</p></div></header>
				<div class="panel-body settings-section">${deckRows || '<div class="empty-state"><div class="empty-state__content"><span class="empty-state__icon">📚</span><h2>Nenhum baralho disponível</h2><p>Crie um baralho antes de iniciar uma sessão.</p><button class="button button--primary" type="button" data-action="create-deck">Criar baralho</button></div></div>'}</div>
			</section>
		</div>
	`;
}

function renderActiveReview(session) {
	const state = getState();
	const card = getCurrentCard();
	if (!card) return '<div class="empty-state"><div class="empty-state__content"><h2>Não foi possível carregar o card atual.</h2></div></div>';
	const deck = getDeckById(card.deckId);
	const revealed = isAnswerRevealed();
	const intervals = getGradeIntervals(card);
	const progress = session.cardIds.length ? (session.currentIndex / session.cardIds.length) * 100 : 0;
	const showIntervals = state.settings.showIntervals;

	const gradeButton = (grade, className) => `
		<button class="grade-button ${className}" type="button" data-action="grade-card" data-grade="${grade}">
			<span>${gradeLabel(grade)}</span>
			${showIntervals ? `<small>${intervals[grade].label}</small>` : ''}
		</button>
	`;

	return `
		<div class="review-layout">
			<div class="review-topbar">
				<div class="review-progress">
					<div class="flashcard-detail__meta"><span class="badge">${escapeHTML(deck?.name ?? 'Sem baralho')}</span><span class="text-muted">Card ${session.currentIndex + 1} de ${session.cardIds.length}</span></div>
					<div class="progress-track" aria-label="Progresso da revisão"><span style="width:${progress}%"></span></div>
				</div>
				<button class="button button--ghost button--small" type="button" data-action="exit-review">Encerrar</button>
			</div>
			<article class="review-card">
				<div class="review-card__content">
					<section class="review-face review-face--front"><span class="review-face__label">Frente</span><p>${escapeHTML(card.front)}</p></section>
					${revealed ? `<section class="review-face review-face--back"><span class="review-face__label">Verso</span><p>${escapeHTML(card.back)}</p></section>` : ''}
				</div>
				<div class="review-card__actions">
					${revealed ? `<div class="grade-grid">${gradeButton(GRADES.AGAIN, 'grade-button--again')}${gradeButton(GRADES.HARD, 'grade-button--hard')}${gradeButton(GRADES.GOOD, 'grade-button--good')}${gradeButton(GRADES.EASY, 'grade-button--easy')}</div>` : '<button class="button button--primary button--block" type="button" data-action="reveal-answer">Mostrar resposta</button>'}
				</div>
			</article>
		</div>
	`;
}

export function renderReport() {
	const session = getLatestSession();
	if (!session) {
		return `<section class="panel empty-state"><div class="empty-state__content"><span class="empty-state__icon">◈</span><h2>Nenhuma sessão concluída</h2><p>Finalize uma revisão para ver o resumo aqui.</p><a class="button button--primary" href="#review">Começar revisão</a></div></section>`;
	}
	const counts = {again: 0, hard: 0, good: 0, easy: 0};
	session.results.forEach((result) => counts[result.grade]++);
	const positive = counts.good + counts.easy;
	const score = session.answered ? Math.round((positive / session.answered) * 100) : 0;
	const retryIds = session.results.filter((result) => result.grade === 'again' || result.grade === 'hard').map((result) => result.cardId);
	const max = Math.max(session.answered, 1);
	const bar = (label, value, color) => `<div class="result-bar"><strong>${label}</strong><div class="result-bar__track"><span style="width:${(value / max) * 100}%;--bar-color:${color}"></span></div><span>${value}</span></div>`;

	return `
		<div class="report-layout">
			<header class="page-intro"><div class="page-intro__copy"><span class="eyebrow">Sessão concluída</span><h2>Bom trabalho: você recuperou o conteúdo ativamente.</h2><p>Use o resultado como orientação, não como julgamento. Os erros mostram o que merece voltar à fila.</p></div></header>
			<section class="report-hero">
				<div class="report-summary"><span class="eyebrow">Desempenho da sessão</span><span class="report-summary__score">${score}%</span><h2>${score >= 75 ? 'Base bem consolidada' : score >= 50 ? 'Bom caminho' : 'Há pontos para reforçar'}</h2><p class="text-muted">${session.completed ? 'Sessão concluída por completo.' : 'Sessão encerrada antes do fim.'}</p></div>
				<div class="report-side">
					<article class="metric-card"><div class="metric-card__top"><span>Cards respondidos</span><span>◫</span></div><strong>${session.answered}</strong><small>de ${session.total} na fila</small></article>
					<article class="metric-card"><div class="metric-card__top"><span>Duração</span><span>◷</span></div><strong>${formatDuration(session.durationMs)}</strong><small>tempo de estudo ativo</small></article>
				</div>
			</section>
			<section class="report-metrics">
				<article class="metric-card"><div class="metric-card__top"><span>Errei</span><span>×</span></div><strong class="text-danger">${counts.again}</strong><small>intervalo curto</small></article>
				<article class="metric-card"><div class="metric-card__top"><span>Difícil</span><span>!</span></div><strong class="text-warning">${counts.hard}</strong><small>reforçar em breve</small></article>
				<article class="metric-card"><div class="metric-card__top"><span>Bom</span><span>✓</span></div><strong class="text-success">${counts.good}</strong><small>recordação adequada</small></article>
				<article class="metric-card"><div class="metric-card__top"><span>Fácil</span><span>⚡</span></div><strong class="text-primary">${counts.easy}</strong><small>conteúdo firme</small></article>
			</section>
			<section class="panel">
				<header class="panel-header"><div class="panel-header__copy"><span class="eyebrow">Distribuição</span><h2>Como os cards foram classificados</h2></div></header>
				<div class="panel-body result-bars">${bar('Errei', counts.again, 'var(--danger)')}${bar('Difícil', counts.hard, 'var(--warning)')}${bar('Bom', counts.good, 'var(--success)')}${bar('Fácil', counts.easy, 'var(--primary)')}</div>
				<footer class="panel-footer"><div class="button-row"><a class="button button--primary" href="#home">Voltar ao início</a><button class="button button--secondary" type="button" data-action="retry-session" data-card-ids="${retryIds.join(',')}" ${retryIds.length === 0 ? 'disabled' : ''}>Revisar erros e difíceis</button><a class="button button--ghost" href="#review">Nova sessão</a></div></footer>
			</section>
		</div>
	`;
}
