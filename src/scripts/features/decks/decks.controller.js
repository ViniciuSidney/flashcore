import {DECK_COLORS, DECK_ICONS} from '../../core/constants.js';
import {getState} from '../../core/state.js';
import {escapeHTML} from '../../shared/helpers.js';
import {openConfirm, openForm} from '../../shared/modal.js';
import {showToast} from '../../shared/toast.js';
import {validateDeckName} from '../../shared/validators.js';
import {createDeck, deleteDeck, getDeckById, getDeckStats, updateDeck} from './decks.model.js';

function deckFormHTML(deck = {}) {
	const colors = DECK_COLORS.map((color) => `<option value="${color}" ${deck.color === color ? 'selected' : ''}>${color}</option>`).join('');
	const icons = DECK_ICONS.map((item) => `<option value="${item}" ${deck.icon === item ? 'selected' : ''}>${item}</option>`).join('');
	return `
		<div class="form-grid">
			<label class="field field--full">
				<span>Nome do baralho</span>
				<input class="input" name="name" maxlength="42" required value="${escapeHTML(deck.name ?? '')}" placeholder="Ex.: Matemática" />
			</label>
			<label class="field field--full">
				<span>Descrição</span>
				<textarea class="textarea" name="description" maxlength="180" placeholder="Descreva o conteúdo deste baralho.">${escapeHTML(deck.description ?? '')}</textarea>
			</label>
			<label class="field">
				<span>Ícone</span>
				<select class="select" name="icon">${icons}</select>
			</label>
			<label class="field">
				<span>Cor</span>
				<select class="select" name="color">${colors}</select>
			</label>
		</div>
	`;
}

export async function promptCreateDeck() {
	const result = await openForm({
		title: 'Criar novo baralho',
		eyebrow: 'Organização',
		icon: '📚',
		bodyHTML: deckFormHTML({color: DECK_COLORS[0], icon: DECK_ICONS[0]}),
		confirmText: 'Criar baralho',
		validate: (values) => validateDeckName(values.name, getState().decks)
	});
	if (!result.confirmed) return null;
	const deck = createDeck(result.values);
	showToast('Baralho criado com sucesso.');
	return deck;
}

export async function promptEditDeck(deckId) {
	const deck = getDeckById(deckId);
	if (!deck) return false;
	const result = await openForm({
		title: 'Editar baralho',
		eyebrow: 'Organização',
		icon: deck.icon,
		bodyHTML: deckFormHTML(deck),
		confirmText: 'Salvar alterações',
		validate: (values) => validateDeckName(values.name, getState().decks, deckId)
	});
	if (!result.confirmed) return false;
	updateDeck(deckId, result.values);
	showToast('Baralho atualizado.');
	return true;
}

export async function confirmDeleteDeck(deckId) {
	const deck = getDeckById(deckId);
	if (!deck) return false;
	const stats = getDeckStats(deckId);
	const message = stats.total > 0
		? `O baralho <strong>${escapeHTML(deck.name)}</strong> possui ${stats.total} card(s). O baralho e todos esses cards serão removidos permanentemente.`
		: `O baralho <strong>${escapeHTML(deck.name)}</strong> será removido permanentemente.`;
	const result = await openConfirm({
		title: 'Excluir este baralho?',
		eyebrow: 'Ação destrutiva',
		icon: '🗑️',
		message,
		confirmText: 'Excluir baralho',
		variant: 'danger'
	});
	if (!result.confirmed) return false;
	deleteDeck(deckId);
	showToast('Baralho excluído.', 'warning');
	return true;
}
