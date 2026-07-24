import {escapeHTML} from '../../shared/helpers.js';
import {difficultyLabel, formatFullDate, formatRelativeReview, pluralize} from '../../shared/formatters.js';
import {getFilteredCards} from './cards.model.js';
import {getDeckById, getDeckStats} from '../decks/decks.model.js';

function cardStatus(card) {
	if (card.reviewCount === 0) return '<span class="status-pill status-pill--new">Novo</span>';
	if (card.nextReviewAt <= Date.now()) return '<span class="status-pill status-pill--due">Para revisar</span>';
	if (card.difficulty === 'hard') return '<span class="status-pill status-pill--hard">Difícil</span>';
	if (card.difficulty === 'easy') return '<span class="status-pill status-pill--easy">Fácil</span>';
	return `<span class="status-pill">${difficultyLabel(card.difficulty)}</span>`;
}

function renderCardDetail(card, deck) {
	if (!card) {
		return `<div class="empty-state"><div class="empty-state__content"><span class="empty-state__icon">◫</span><h2>Selecione um flashcard</h2><p>Escolha um item da lista para visualizar frente, verso e ações.</p></div></div>`;
	}
	const tags = card.tags.length ? card.tags.map((tag) => `<span class="tag">#${escapeHTML(tag)}</span>`).join('') : '<span class="tag">sem tags</span>';
	return `
		<div class="panel-body">
			<button class="button button--ghost button--small mobile-detail-back" type="button" data-action="close-card-detail">← Voltar à lista</button>
			<div class="flashcard-detail__meta"><span class="badge">${escapeHTML(deck.name)}</span>${cardStatus(card)}</div>
			<div class="flashcard-detail">
				<section class="flashcard-face"><span>Frente</span><p>${escapeHTML(card.front)}</p></section>
				<section class="flashcard-face"><span>Verso</span><p>${escapeHTML(card.back)}</p></section>
				<div class="tag-list">${tags}</div>
				<div class="data-list">
					<div class="data-list__item"><span>Revisões realizadas</span><strong>${card.reviewCount}</strong></div>
					<div class="data-list__item"><span>Próxima revisão</span><strong>${formatRelativeReview(card.nextReviewAt)}</strong></div>
					<div class="data-list__item"><span>Última alteração</span><strong>${formatFullDate(card.updatedAt)}</strong></div>
				</div>
				<div class="detail-actions">
					<button class="button button--primary" type="button" data-action="edit-card" data-card-id="${card.id}">Editar</button>
					<button class="button button--secondary" type="button" data-action="move-card" data-card-id="${card.id}">Mover</button>
					<button class="button button--danger" type="button" data-action="delete-card" data-card-id="${card.id}">Excluir</button>
				</div>
			</div>
		</div>
	`;
}

export function renderDeckDetail({deckId, selectedCardId = '', search = '', filter = 'all', showDetailMobile = false}) {
	const deck = getDeckById(deckId);
	if (!deck) {
		return `<section class="panel empty-state"><div class="empty-state__content"><span class="empty-state__icon">?</span><h2>Baralho não encontrado</h2><p>Ele pode ter sido excluído ou o endereço está incorreto.</p><a class="button button--primary" href="#decks">Voltar aos baralhos</a></div></section>`;
	}
	const stats = getDeckStats(deckId);
	const cards = getFilteredCards(deckId, {search, filter});
	const selectedCard = cards.find((card) => card.id === selectedCardId) ?? cards[0] ?? null;
	const listHTML = cards.map((card) => `
		<button class="flashcard-row ${selectedCard?.id === card.id ? 'is-selected' : ''}" type="button" data-action="select-card" data-card-id="${card.id}">
			<div class="flashcard-row__top"><h3>${escapeHTML(card.front)}</h3>${cardStatus(card)}</div>
			<p>${escapeHTML(card.back)}</p>
			<div class="tag-list">${card.tags.slice(0, 3).map((tag) => `<span class="tag">#${escapeHTML(tag)}</span>`).join('')}</div>
		</button>
	`).join('');

	const listContent = cards.length
		? listHTML
		: `<div class="empty-state"><div class="empty-state__content"><span class="empty-state__icon">⌕</span><h2>Nenhum card encontrado</h2><p>${stats.total === 0 ? 'Crie ou importe o primeiro flashcard deste baralho.' : 'Ajuste a pesquisa ou os filtros.'}</p>${stats.total === 0 ? '<button class="button button--primary" type="button" data-action="create-card" data-deck-id="'+deck.id+'">Criar flashcard</button>' : ''}</div></div>`;

	return `
		<div class="page-stack">
			<nav class="breadcrumbs"><a href="#decks">Baralhos</a><span>/</span><span>${escapeHTML(deck.name)}</span></nav>
			<header class="deck-page-header">
				<div class="deck-page-header__identity"><span class="deck-icon" style="--deck-color:${deck.color}" aria-hidden="true">${deck.icon}</span><div><h2>${escapeHTML(deck.name)}</h2><p>${escapeHTML(deck.description || `${pluralize(stats.total, 'flashcard')} organizado(s) neste baralho.`)}</p></div></div>
				<div class="button-row deck-page-header__actions">
					<button class="button button--primary" type="button" data-action="create-card" data-deck-id="${deck.id}">＋ Novo flashcard</button>
					<button class="button button--secondary" type="button" data-action="start-free-review" data-deck-id="${deck.id}" ${stats.total === 0 ? 'disabled' : ''}>▶ Estudo livre</button>
					<details class="action-menu">
						<summary class="icon-button" aria-label="Mais ações do baralho" title="Mais ações">⋯</summary>
						<div class="action-menu__panel" role="menu">
							<button class="action-menu__item" type="button" data-action="import-to-deck" data-deck-id="${deck.id}" role="menuitem"><span aria-hidden="true">⇩</span> Importar cards</button>
							<button class="action-menu__item" type="button" data-action="edit-deck" data-deck-id="${deck.id}" role="menuitem"><span aria-hidden="true">✎</span> Editar baralho</button>
							<button class="action-menu__item action-menu__item--danger" type="button" data-action="delete-deck" data-deck-id="${deck.id}" role="menuitem"><span aria-hidden="true">🗑</span> Excluir baralho</button>
						</div>
					</details>
				</div>
			</header>
			<section class="master-detail ${showDetailMobile && selectedCard ? 'is-showing-detail' : ''}" id="masterDetail">
				<section class="panel master-pane">
					<div class="master-toolbar">
						<label class="search-field"><span class="is-visually-hidden">Pesquisar cards</span><input class="input" type="search" id="cardSearchInput" value="${escapeHTML(search)}" placeholder="Pesquisar cards..." /></label>
					<select class="select" id="cardFilterSelect" aria-label="Filtrar cards"><option value="all" ${filter === 'all' ? 'selected' : ''}>Todos</option><option value="due" ${filter === 'due' ? 'selected' : ''}>Para revisar</option><option value="new" ${filter === 'new' ? 'selected' : ''}>Novos</option><option value="hard" ${filter === 'hard' ? 'selected' : ''}>Difíceis</option></select>
					</div>
					<div class="flashcard-list">${listContent}</div>
				</section>
				<section class="panel detail-pane">${renderCardDetail(selectedCard, deck)}</section>
			</section>
		</div>
	`;
}
