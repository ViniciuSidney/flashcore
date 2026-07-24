import {getState} from '../../core/state.js';
import {escapeHTML, normalizeText} from '../../shared/helpers.js';
import {pluralize} from '../../shared/formatters.js';
import {getDeckStats} from './decks.model.js';

export function renderDecksGallery({search = '', order = 'recent'} = {}) {
	const state = getState();
	const query = normalizeText(search);
	let decks = state.decks.filter((deck) => !query || normalizeText(`${deck.name} ${deck.description}`).includes(query));

	decks = [...decks].sort((a, b) => {
		if (order === 'name') return a.name.localeCompare(b.name, 'pt-BR');
		if (order === 'cards') return getDeckStats(b.id).total - getDeckStats(a.id).total;
		return (b.lastOpenedAt || b.updatedAt) - (a.lastOpenedAt || a.updatedAt);
	});

	const emptyHTML = state.decks.length === 0
		? `<section class="panel empty-state"><div class="empty-state__content"><span class="empty-state__icon">📚</span><h2>Nenhum baralho criado</h2><p>Crie um baralho para começar a organizar seus flashcards.</p><button class="button button--primary" type="button" data-action="create-deck">Criar baralho</button></div></section>`
		: `<section class="panel empty-state"><div class="empty-state__content"><span class="empty-state__icon">⌕</span><h2>Nenhum resultado</h2><p>Tente outro termo de busca ou altere a ordenação.</p></div></section>`;

	const cardsHTML = decks.map((deck) => {
		const stats = getDeckStats(deck.id);
		return `
			<article class="deck-card">
				<div class="deck-card__top">
					<div class="deck-card__identity">
						<span class="deck-icon" style="--deck-color:${deck.color}" aria-hidden="true">${deck.icon}</span>
						<div><h3>${escapeHTML(deck.name)}</h3><span class="badge">${stats.due > 0 ? `${stats.due} para revisar` : 'Em dia'}</span></div>
					</div>
					<button class="icon-button icon-button--quiet" type="button" data-action="edit-deck" data-deck-id="${deck.id}" aria-label="Editar ${escapeHTML(deck.name)}" title="Editar baralho">⋯</button>
				</div>
				<p class="deck-card__description">${escapeHTML(deck.description || 'Sem descrição. Você pode editar este baralho quando quiser.')}</p>
				<div class="deck-card__stats">
					<span class="deck-stat"><strong>${stats.total}</strong><small>cards</small></span>
					<span class="deck-stat"><strong>${stats.due}</strong><small>para revisar</small></span>
					<span class="deck-stat"><strong>${stats.newCount}</strong><small>novos</small></span>
				</div>
				<div class="deck-card__actions">
					<a class="button button--primary button--small" href="#deck/${encodeURIComponent(deck.id)}">Abrir</a>
					<button class="button button--secondary button--small" type="button" data-action="start-free-review" data-deck-id="${deck.id}" ${stats.total === 0 ? 'disabled' : ''}>Estudo livre</button>
					<button class="button button--ghost button--small" type="button" data-action="import-to-deck" data-deck-id="${deck.id}">Importar</button>
					<button class="button button--danger button--small" type="button" data-action="delete-deck" data-deck-id="${deck.id}">Excluir</button>
				</div>
			</article>
		`;
	}).join('');

	return `
		<div class="page-stack">
			<header class="page-intro">
				<div class="page-intro__copy"><span class="eyebrow">Organização</span><h2>Seus baralhos</h2><p>Separe seus conteúdos por matéria, tema ou objetivo e revise no momento certo.</p></div>
				<div class="button-row"><button class="button button--primary" type="button" data-action="create-deck">＋ Novo baralho</button></div>
			</header>
			<section class="gallery-toolbar">
				<label class="search-field"><span class="is-visually-hidden">Pesquisar baralhos</span><input class="input" type="search" id="deckSearchInput" value="${escapeHTML(search)}" placeholder="Pesquisar baralhos..." /></label>
				<div class="gallery-toolbar__filters"><select class="select" id="deckOrderSelect" aria-label="Ordenar baralhos"><option value="recent" ${order === 'recent' ? 'selected' : ''}>Mais recentes</option><option value="name" ${order === 'name' ? 'selected' : ''}>Nome</option><option value="cards" ${order === 'cards' ? 'selected' : ''}>Mais cards</option></select></div>
			</section>
			${decks.length > 0 ? `<section class="deck-gallery">${cardsHTML}</section>` : emptyHTML}
		</div>
	`;
}
