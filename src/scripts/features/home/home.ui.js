import {getState} from '../../core/state.js';
import {escapeHTML} from '../../shared/helpers.js';
import {pluralize} from '../../shared/formatters.js';
import {getDeckStats} from '../decks/decks.model.js';

function metricCard(label, value, note, icon) {
	return `
		<article class="metric-card">
			<div class="metric-card__top"><span>${escapeHTML(label)}</span><span aria-hidden="true">${icon}</span></div>
			<strong>${value}</strong>
			<small>${escapeHTML(note)}</small>
		</article>
	`;
}

export function renderHome() {
	const state = getState();
	const dueCards = state.cards.filter((card) => card.nextReviewAt <= Date.now());
	const totalReviews = state.cards.reduce((sum, card) => sum + card.reviewCount, 0);
	const recentDecks = [...state.decks]
		.sort((a, b) => (b.lastOpenedAt || b.updatedAt) - (a.lastOpenedAt || a.updatedAt))
		.slice(0, 3);

	if (state.decks.length === 0) {
		return `
			<div class="page-stack">
				<section class="hero-card">
					<div class="hero-card__copy">
						<span class="eyebrow">Bem-vindo ao FlashCore</span>
						<h2>Seu espaço central para revisar o que realmente importa.</h2>
						<p>Crie seu primeiro baralho, adicione flashcards e comece uma rotina de revisão ativa organizada.</p>
					</div>
					<div class="button-row">
						<button class="button button--primary" type="button" data-action="create-deck">Criar primeiro baralho</button>
						<button class="button button--secondary" type="button" data-action="create-example">Carregar exemplo</button>
					</div>
				</section>
				<section class="panel empty-state">
					<div class="empty-state__content">
						<span class="empty-state__icon" aria-hidden="true">📚</span>
						<h2>Comece pela organização</h2>
						<p>Um baralho reúne flashcards de uma matéria, tema ou objetivo. Você pode reorganizá-los livremente depois.</p>
					</div>
				</section>
			</div>
		`;
	}

	const recentDecksHTML = recentDecks.map((deck) => {
		const stats = getDeckStats(deck.id);
		return `
			<article class="mini-deck">
				<div class="mini-deck__top">
					<span class="deck-icon" style="--deck-color:${deck.color}" aria-hidden="true">${deck.icon}</span>
					<div><h3>${escapeHTML(deck.name)}</h3><p>${pluralize(stats.total, 'card')}</p></div>
				</div>
				<p>${stats.due > 0 ? `${pluralize(stats.due, 'card')} para revisar agora.` : 'Nenhuma revisão pendente.'}</p>
				<div class="button-row">
					<a class="button button--ghost button--small" href="#deck/${encodeURIComponent(deck.id)}">Abrir</a>
					<button class="button button--secondary button--small" type="button" data-action="start-free-review" data-deck-id="${deck.id}" ${stats.total === 0 ? 'disabled' : ''}>Estudar</button>
				</div>
			</article>
		`;
	}).join('');

	return `
		<div class="hub-layout">
			<div class="hub-main">
				<section class="hero-card">
					<div class="hero-card__copy">
						<span class="eyebrow">Revisões de hoje</span>
						<h2><span class="hero-card__count">${dueCards.length}</span> ${dueCards.length === 1 ? 'card espera' : 'cards esperam'} por você.</h2>
						<p>${dueCards.length > 0 ? 'Uma sessão curta agora ajuda a manter os conteúdos vivos na memória.' : 'Tudo em dia. Você ainda pode fazer um Estudo livre em qualquer baralho.'}</p>
					</div>
					<div class="button-row">
						<button class="button button--primary" type="button" data-action="start-scheduled-review" ${dueCards.length === 0 ? 'disabled' : ''}>▶ Iniciar revisão</button>
						<a class="button button--secondary" href="#decks">Escolher um baralho</a>
					</div>
				</section>

				<section class="metrics-grid" aria-label="Resumo do FlashCore">
					${metricCard('Baralhos', state.decks.length, 'Coleções organizadas', '▦')}
					${metricCard('Flashcards', state.cards.length, 'Conteúdos cadastrados', '◫')}
					${metricCard('Para revisar', dueCards.length, 'Disponíveis agora', '◈')}
					${metricCard('Revisões', totalReviews, 'Respostas registradas', '✓')}
				</section>

				<section>
					<div class="section-heading">
						<div class="section-heading__copy"><span class="eyebrow">Acesso rápido</span><h2>Baralhos recentes</h2></div>
						<a class="button button--ghost button--small" href="#decks">Ver todos</a>
					</div>
					<div class="recent-decks">${recentDecksHTML}</div>
				</section>
			</div>

			<aside class="hub-side">
				<section class="panel">
					<header class="panel-header"><div class="panel-header__copy"><span class="eyebrow">Atalhos</span><h2>Ações rápidas</h2></div></header>
					<div class="panel-body quick-actions">
						<button class="quick-action" type="button" data-action="quick-add-card"><span><strong>Novo flashcard</strong><small>Registre um conteúdo</small></span><span>＋</span></button>
						<a class="quick-action" href="#import"><span><strong>Importar cards</strong><small>Adicione vários de uma vez</small></span><span>⇩</span></a>
						<button class="quick-action" type="button" data-action="create-deck"><span><strong>Novo baralho</strong><small>Organize uma nova área</small></span><span>▦</span></button>
					</div>
				</section>

				<section class="panel panel--accent">
					<header class="panel-header"><div class="panel-header__copy"><span class="eyebrow">Princípio</span><h2>Recuperar é melhor que reler</h2></div></header>
					<div class="panel-body"><p class="text-muted">Tente responder mentalmente antes de revelar o verso. A dificuldade faz parte do aprendizado ativo.</p></div>
				</section>
			</aside>
		</div>
	`;
}
