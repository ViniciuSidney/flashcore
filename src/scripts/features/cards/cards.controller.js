import {getState} from '../../core/state.js';
import {escapeHTML} from '../../shared/helpers.js';
import {openConfirm, openForm} from '../../shared/modal.js?v=0.1.1';
import {showToast} from '../../shared/toast.js';
import {validateCard} from '../../shared/validators.js';
import {createCard, deleteCard, getCardById, moveCard, updateCard} from './cards.model.js?v=0.1.1';

function cardFormHTML(card = {}, defaultDeckId = '') {
	const state = getState();
	const selectedDeckId = card.deckId || defaultDeckId;
	const deckOptions = state.decks.map((deck) => `<option value="${deck.id}" ${selectedDeckId === deck.id ? 'selected' : ''}>${escapeHTML(deck.name)}</option>`).join('');
	const isNewCard = !card.id;
	return `
		<div class="form-grid">
			<label class="field field--full">
				<span>Frente do card</span>
				<textarea class="textarea" name="front" required placeholder="Pergunta, termo ou conceito...">${escapeHTML(card.front ?? '')}</textarea>
			</label>
			<label class="field field--full">
				<span>Verso do card</span>
				<textarea class="textarea" name="back" required placeholder="Resposta ou explicação...">${escapeHTML(card.back ?? '')}</textarea>
			</label>
			<label class="field field--full">
				<span>Baralho</span>
				<select class="select" name="deckId" required>${deckOptions}</select>
			</label>
			<label class="field field--full">
				<span>Tags</span>
				<input class="input" name="tags" value="${escapeHTML((card.tags ?? []).join(', '))}" placeholder="matemática, probabilidade, prova" />
				<small>Separe as tags por vírgulas.</small>
			</label>
			${isNewCard ? `
				<div class="form-status-note field--full" role="note">
					<span class="form-status-note__icon" aria-hidden="true">✦</span>
					<div><strong>Situação inicial: Novo</strong><small>A dificuldade será definida pelo seu desempenho nas revisões programadas.</small></div>
				</div>
			` : ''}
		</div>
	`;
}
export async function promptCreateCard(defaultDeckId = '') {
	if (getState().decks.length === 0) {
		showToast('Crie um baralho antes de adicionar flashcards.', 'warning');
		return null;
	}
	const result = await openForm({
		title: 'Criar flashcard',
		eyebrow: 'Novo conteúdo',
		icon: '＋',
		bodyHTML: cardFormHTML({}, defaultDeckId || getState().decks[0].id),
		confirmText: 'Salvar flashcard',
		protectUnsaved: true,
		validate: (values) => validateCard(values, getState().decks)
	});
	if (!result.confirmed) return null;
	const card = createCard(result.values);
	showToast('Flashcard criado.');
	return card;
}

export async function promptEditCard(cardId) {
	const card = getCardById(cardId);
	if (!card) return false;
	const result = await openForm({
		title: 'Editar flashcard',
		eyebrow: 'Conteúdo',
		icon: '✏️',
		bodyHTML: cardFormHTML(card),
		confirmText: 'Salvar alterações',
		protectUnsaved: true,
		validate: (values) => validateCard(values, getState().decks)
	});
	if (!result.confirmed) return false;
	updateCard(cardId, result.values);
	showToast('Flashcard atualizado.');
	return true;
}

export async function promptMoveCard(cardId) {
	const card = getCardById(cardId);
	if (!card) return false;
	const options = getState().decks.map((deck) => `<option value="${deck.id}" ${card.deckId === deck.id ? 'selected' : ''}>${escapeHTML(deck.name)}</option>`).join('');
	const result = await openForm({
		title: 'Mover flashcard',
		eyebrow: 'Organização',
		icon: '📦',
		bodyHTML: `<label class="field"><span>Baralho de destino</span><select class="select" name="deckId">${options}</select></label>`,
		confirmText: 'Mover card'
	});
	if (!result.confirmed || result.values.deckId === card.deckId) return false;
	moveCard(cardId, result.values.deckId);
	showToast('Flashcard movido.');
	return true;
}

export async function confirmDeleteCard(cardId) {
	const card = getCardById(cardId);
	if (!card) return false;
	const result = await openConfirm({
		title: 'Excluir este flashcard?',
		eyebrow: 'Ação destrutiva',
		icon: '🗑️',
		message: `O card <strong>${escapeHTML(card.front)}</strong> será removido permanentemente.`,
		confirmText: 'Excluir flashcard',
		variant: 'danger'
	});
	if (!result.confirmed) return false;
	deleteCard(cardId);
	showToast('Flashcard excluído.', 'warning');
	return true;
}
