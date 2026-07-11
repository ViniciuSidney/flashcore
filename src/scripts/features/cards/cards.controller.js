import {DIFFICULTIES} from '../../core/constants.js';
import {getState} from '../../core/state.js';
import {escapeHTML} from '../../shared/helpers.js';
import {openConfirm, openForm} from '../../shared/modal.js';
import {showToast} from '../../shared/toast.js';
import {validateCard} from '../../shared/validators.js';
import {createCard, deleteCard, getCardById, moveCard, updateCard} from './cards.model.js';

function cardFormHTML(card = {}, defaultDeckId = '') {
	const state = getState();
	const deckOptions = state.decks.map((deck) => `<option value="${deck.id}" ${(card.deckId || defaultDeckId) === deck.id ? 'selected' : ''}>${escapeHTML(deck.name)}</option>`).join('');
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
			<label class="field">
				<span>Baralho</span>
				<select class="select" name="deckId" required>${deckOptions}</select>
			</label>
			<label class="field">
				<span>Dificuldade inicial</span>
				<select class="select" name="difficulty">
					<option value="${DIFFICULTIES.NEW}" ${card.difficulty === 'new' ? 'selected' : ''}>Novo</option>
					<option value="${DIFFICULTIES.EASY}" ${card.difficulty === 'easy' ? 'selected' : ''}>Fácil</option>
					<option value="${DIFFICULTIES.MEDIUM}" ${card.difficulty === 'medium' ? 'selected' : ''}>Médio</option>
					<option value="${DIFFICULTIES.HARD}" ${card.difficulty === 'hard' ? 'selected' : ''}>Difícil</option>
				</select>
			</label>
			<label class="field field--full">
				<span>Tags</span>
				<input class="input" name="tags" value="${escapeHTML((card.tags ?? []).join(', '))}" placeholder="matemática, probabilidade, prova" />
				<small>Separe as tags por vírgulas.</small>
			</label>
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
