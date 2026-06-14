const STORAGE_KEY = 'flashcore.v1.1';

const initialState = {
	selectedDeckId: 'all',
	editingCardId: null,
	reviewQueue: [],
	currentReviewCardId: null,
	settings: {
		theme: 'light'
	},
	decks: [
		{id: crypto.randomUUID(), name: 'Matemática', createdAt: Date.now()},
		{id: crypto.randomUUID(), name: 'Informática', createdAt: Date.now()}
	],
	cards: []
};

let state = loadState();

const elements = {
	deckForm: document.querySelector('#deckForm'),
	deckNameInput: document.querySelector('#deckNameInput'),
	deckList: document.querySelector('#deckList'),
	deckSelect: document.querySelector('#deckSelect'),
	cardForm: document.querySelector('#cardForm'),
	cardFormTitle: document.querySelector('#cardFormTitle'),
	frontInput: document.querySelector('#frontInput'),
	backInput: document.querySelector('#backInput'),
	difficultyInput: document.querySelector('#difficultyInput'),
	tagsInput: document.querySelector('#tagsInput'),
	cancelEditBtn: document.querySelector('#cancelEditBtn'),
	cardsList: document.querySelector('#cardsList'),
	currentDeckLabel: document.querySelector('#currentDeckLabel'),
	searchInput: document.querySelector('#searchInput'),
	statusFilter: document.querySelector('#statusFilter'),
	totalCardsStat: document.querySelector('#totalCardsStat'),
	dueCardsStat: document.querySelector('#dueCardsStat'),
	deckCardsStat: document.querySelector('#deckCardsStat'),
	tabs: document.querySelectorAll('.tab'),
	views: document.querySelectorAll('.view'),
	startReviewBtn: document.querySelector('#startReviewBtn'),
	seedBtn: document.querySelector('#seedBtn'),
	reviewEmpty: document.querySelector('#reviewEmpty'),
	reviewCard: document.querySelector('#reviewCard'),
	reviewSubtitle: document.querySelector('#reviewSubtitle'),
	reviewDeckBadge: document.querySelector('#reviewDeckBadge'),
	reviewFront: document.querySelector('#reviewFront'),
	reviewBack: document.querySelector('#reviewBack'),
	reviewAnswer: document.querySelector('#reviewAnswer'),
	revealAnswerBtn: document.querySelector('#revealAnswerBtn'),
	gradeActions: document.querySelector('#gradeActions'),
	deckManager: document.querySelector('#deckManager'),
	themeSelect: document.querySelector('#themeSelect'),
	clearAllDataBtn: document.querySelector('#clearAllDataBtn'),
	dataSummary: document.querySelector('#dataSummary'),
	appModal: document.querySelector('#appModal'),
	modalIcon: document.querySelector('#modalIcon'),
	modalEyebrow: document.querySelector('#modalEyebrow'),
	modalTitle: document.querySelector('#modalTitle'),
	modalMessage: document.querySelector('#modalMessage'),
	modalInputGroup: document.querySelector('#modalInputGroup'),
	modalInputLabel: document.querySelector('#modalInputLabel'),
	modalInput: document.querySelector('#modalInput'),
	modalCancelBtn: document.querySelector('#modalCancelBtn'),
	modalConfirmBtn: document.querySelector('#modalConfirmBtn'),
	toast: document.querySelector('#toast')
};

applyTheme(state.settings.theme);

function loadState() {
	const saved = localStorage.getItem(STORAGE_KEY);
	if (!saved) return structuredClone(initialState);

	try {
		const parsed = JSON.parse(saved);
		return {
			...structuredClone(initialState),
			...parsed,
			settings: {
				...structuredClone(initialState).settings,
				...(parsed.settings ?? {})
			},
			editingCardId: null,
			reviewQueue: [],
			currentReviewCardId: null
		};
	} catch {
		return structuredClone(initialState);
	}
}

function saveState() {
	localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function render() {
	renderDecks();
	renderDeckSelect();
	renderCards();
	renderStats();
	renderDeckManager();
	renderOptions();
	saveState();
}

function getSelectedDeck() {
	if (state.selectedDeckId === 'all') return null;
	return state.decks.find((deck) => deck.id === state.selectedDeckId) ?? null;
}

function getDeckName(deckId) {
	return state.decks.find((deck) => deck.id === deckId)?.name ?? 'Sem baralho';
}

function getFilteredCards() {
	const search = elements.searchInput.value.trim().toLowerCase();
	const status = elements.statusFilter.value;
	const now = Date.now();

	return state.cards
		.filter((card) => {
			const isInDeck = state.selectedDeckId === 'all' || card.deckId === state.selectedDeckId;
			const matchesSearch = !search || [card.front, card.back, card.tags.join(' '), getDeckName(card.deckId)].join(' ').toLowerCase().includes(search);

			const matchesStatus = status === 'all' || (status === 'due' && card.nextReviewAt <= now) || (status === 'new' && card.reviewCount === 0) || (status === 'hard' && card.difficulty === 'hard');

			return isInDeck && matchesSearch && matchesStatus;
		})
		.sort((a, b) => a.nextReviewAt - b.nextReviewAt);
}

function renderDecks() {
	const allCount = state.cards.length;
	const deckButtons = [
		`<button class="${state.selectedDeckId === 'all' ? 'active' : ''}" data-deck-id="all">
      <span>Todos os cards</span>
      <span class="deck-count">${allCount}</span>
    </button>`
	];

	state.decks.forEach((deck) => {
		const count = state.cards.filter((card) => card.deckId === deck.id).length;
		deckButtons.push(`
      <button class="${state.selectedDeckId === deck.id ? 'active' : ''}" data-deck-id="${deck.id}">
        <span>${escapeHTML(deck.name)}</span>
        <span class="deck-count">${count}</span>
      </button>
    `);
	});

	elements.deckList.innerHTML = deckButtons.join('');

	elements.deckList.querySelectorAll('button').forEach((button) => {
		button.addEventListener('click', () => {
			state.selectedDeckId = button.dataset.deckId;
			render();
		});
	});
}

function renderDeckSelect() {
	elements.deckSelect.innerHTML = state.decks.map((deck) => `<option value="${deck.id}">${escapeHTML(deck.name)}</option>`).join('');

	const selectedDeck = getSelectedDeck();
	if (selectedDeck) {
		elements.deckSelect.value = selectedDeck.id;
	}
}

function renderCards() {
	const cards = getFilteredCards();
	const selectedDeck = getSelectedDeck();

	elements.currentDeckLabel.textContent = selectedDeck ? `Cards do baralho: ${selectedDeck.name}` : 'Todos os cards';

	if (cards.length === 0) {
		elements.cardsList.innerHTML = `
      <div class="empty-state">
        <strong>Nenhum flashcard encontrado.</strong>
        <span>Crie um novo card ou ajuste os filtros.</span>
      </div>
    `;
		return;
	}

	elements.cardsList.innerHTML = cards
		.map((card) => {
			const dueLabel = card.nextReviewAt <= Date.now() ? 'Para revisar' : formatDate(card.nextReviewAt);
			const tags = card.tags.map((tag) => `<span class="tag">#${escapeHTML(tag)}</span>`).join('');

			return `
      <article class="card-item">
        <div class="card-topline">
          <div>
            <span class="badge">${escapeHTML(getDeckName(card.deckId))}</span>
            <p class="card-front">${escapeHTML(card.front)}</p>
          </div>
          <div class="card-actions">
            <button class="icon-btn" title="Editar" data-action="edit" data-id="${card.id}">✏️</button>
            <button class="icon-btn" title="Mover" data-action="move" data-id="${card.id}">📦</button>
            <button class="icon-btn" title="Excluir" data-action="delete" data-id="${card.id}">🗑️</button>
          </div>
        </div>
        <p class="card-back">${escapeHTML(card.back)}</p>
        <div class="tags">${tags || `<span class="tag">sem tags</span>`}</div>
        <small class="card-meta">
          Revisões: ${card.reviewCount} • Status: ${translateDifficulty(card.difficulty)} • Próxima: ${dueLabel}
        </small>
      </article>
    `;
		})
		.join('');

	elements.cardsList.querySelectorAll('button[data-action]').forEach((button) => {
		button.addEventListener('click', () => handleCardAction(button.dataset.action, button.dataset.id));
	});
}

function renderStats() {
	const now = Date.now();
	const total = state.cards.length;
	const due = state.cards.filter((card) => card.nextReviewAt <= now).length;
	const deckTotal = state.selectedDeckId === 'all' ? total : state.cards.filter((card) => card.deckId === state.selectedDeckId).length;

	elements.totalCardsStat.textContent = total;
	elements.dueCardsStat.textContent = due;
	elements.deckCardsStat.textContent = deckTotal;
}

function renderDeckManager() {
	if (state.decks.length === 0) {
		elements.deckManager.innerHTML = `
      <div class="empty-state">
        <strong>Nenhum baralho criado.</strong>
        <span>Crie um baralho para começar a organizar seus cards.</span>
      </div>
    `;
		return;
	}

	elements.deckManager.innerHTML = state.decks
		.map((deck) => {
			const count = state.cards.filter((card) => card.deckId === deck.id).length;

			return `
      <article class="manager-item">
        <h3>${escapeHTML(deck.name)}</h3>
        <p class="deck-count">${count} card(s)</p>
        <div class="manager-actions">
          <button class="small-btn" data-action="renameDeck" data-id="${deck.id}">Renomear</button>
          <button class="danger-btn" data-action="deleteDeck" data-id="${deck.id}">Excluir</button>
        </div>
      </article>
    `;
		})
		.join('');

	elements.deckManager.querySelectorAll('button[data-action]').forEach((button) => {
		button.addEventListener('click', () => handleDeckAction(button.dataset.action, button.dataset.id));
	});
}

function renderOptions() {
	elements.themeSelect.value = state.settings.theme;
	elements.dataSummary.textContent = `${state.decks.length} baralho(s) • ${state.cards.length} flashcard(s) salvos`;
}

function applyTheme(theme) {
	document.body.dataset.theme = theme;
}

function changeTheme(theme) {
	state.settings.theme = theme;
	applyTheme(theme);
	render();

	const themeLabel = theme === 'dark' ? 'escuro' : 'claro';
	showToast(`Tema ${themeLabel} ativado.`);
}

async function clearAllData() {
	const firstConfirmation = await appConfirm({
		eyebrow: 'Ação crítica',
		title: 'Excluir todos os dados?',
		message: 'Isso apagará baralhos, flashcards, progresso de revisão e preferências salvas no navegador.',
		variant: 'danger',
		icon: '🗑️',
		confirmText: 'Continuar',
		cancelText: 'Cancelar'
	});

	if (!firstConfirmation) return;

	const secondConfirmation = await appPrompt({
		eyebrow: 'Confirmação final',
		title: 'Digite EXCLUIR para confirmar',
		message: 'Essa etapa evita exclusões acidentais. Para apagar tudo definitivamente, digite EXCLUIR em letras maiúsculas.',
		variant: 'danger',
		icon: '⚠️',
		confirmText: 'Excluir definitivamente',
		cancelText: 'Cancelar',
		input: {
			label: 'Palavra de confirmação',
			placeholder: 'EXCLUIR',
			maxLength: 16
		}
	});

	if (secondConfirmation?.trim() !== 'EXCLUIR') {
		showToast('Exclusão cancelada. A palavra de confirmação não foi digitada corretamente.');
		return;
	}

	localStorage.removeItem(STORAGE_KEY);

	state = {
		...structuredClone(initialState),
		selectedDeckId: 'all',
		decks: [],
		cards: [],
		settings: {
			theme: 'light'
		}
	};

	resetCardForm();
	applyTheme(state.settings.theme);
	render();
	showToast('Todos os dados foram excluídos.');
}

function createDeck(name) {
	const cleanName = name.trim();
	if (!cleanName) return showToast('Digite um nome para o baralho.');

	const alreadyExists = state.decks.some((deck) => deck.name.toLowerCase() === cleanName.toLowerCase());
	if (alreadyExists) return showToast('Já existe um baralho com esse nome.');

	const deck = {id: crypto.randomUUID(), name: cleanName, createdAt: Date.now()};
	state.decks.push(deck);
	state.selectedDeckId = deck.id;
	elements.deckNameInput.value = '';
	render();
	showToast('Baralho criado com sucesso.');
}

function saveCard(event) {
	event.preventDefault();

	if (state.decks.length === 0) {
		return showToast('Crie um baralho antes de salvar um card.');
	}

	const front = elements.frontInput.value.trim();
	const back = elements.backInput.value.trim();
	const deckId = elements.deckSelect.value;
	const difficulty = elements.difficultyInput.value;
	const tags = normalizeTags(elements.tagsInput.value);

	if (!front || !back) return showToast('Preencha frente e verso do card.');

	if (state.editingCardId) {
		state.cards = state.cards.map((card) => {
			if (card.id !== state.editingCardId) return card;
			return {...card, front, back, deckId, difficulty, tags, updatedAt: Date.now()};
		});
		showToast('Flashcard atualizado.');
	} else {
		state.cards.push({
			id: crypto.randomUUID(),
			front,
			back,
			deckId,
			difficulty,
			tags,
			createdAt: Date.now(),
			updatedAt: Date.now(),
			reviewCount: 0,
			correctStreak: 0,
			nextReviewAt: Date.now()
		});
		showToast('Flashcard criado.');
	}

	resetCardForm();
	render();
}

async function handleCardAction(action, cardId) {
	const card = state.cards.find((item) => item.id === cardId);
	if (!card) return;

	if (action === 'edit') {
		state.editingCardId = card.id;
		elements.frontInput.value = card.front;
		elements.backInput.value = card.back;
		elements.deckSelect.value = card.deckId;
		elements.difficultyInput.value = card.difficulty;
		elements.tagsInput.value = card.tags.join(', ');
		elements.cardFormTitle.textContent = '✏️ Editar flashcard';
		elements.cancelEditBtn.classList.remove('hidden');
		elements.frontInput.focus();
		return;
	}

	if (action === 'move') {
		const targetName = await appPrompt({
			eyebrow: 'Organização',
			title: 'Mover flashcard',
			message: 'Digite o nome exato do baralho para onde este card deve ser movido.',
			variant: 'default',
			icon: '📦',
			confirmText: 'Mover card',
			cancelText: 'Cancelar',
			input: {
				label: 'Nome do baralho',
				placeholder: 'Ex.: Matemática',
				maxLength: 36
			}
		});

		if (!targetName?.trim()) return;

		const targetDeck = state.decks.find((deck) => deck.name.toLowerCase() === targetName.trim().toLowerCase());
		if (!targetDeck) return showToast('Baralho não encontrado.');

		card.deckId = targetDeck.id;
		card.updatedAt = Date.now();
		render();
		showToast('Card movido.');
		return;
	}

	if (action === 'delete') {
		const confirmed = await appConfirm({
			eyebrow: 'Excluir flashcard',
			title: 'Excluir este flashcard?',
			message: 'Essa ação não pode ser desfeita. O card será removido da sua biblioteca e das revisões.',
			variant: 'danger',
			icon: '🗑️',
			confirmText: 'Excluir',
			cancelText: 'Cancelar'
		});

		if (!confirmed) return;

		state.cards = state.cards.filter((item) => item.id !== cardId);
		render();
		showToast('Flashcard excluído.');
	}
}

async function handleDeckAction(action, deckId) {
	const deck = state.decks.find((item) => item.id === deckId);
	if (!deck) return;

	if (action === 'renameDeck') {
		const newName = await appPrompt({
			eyebrow: 'Editar baralho',
			title: 'Renomear baralho',
			message: 'Escolha um novo nome para este baralho.',
			variant: 'default',
			icon: '✏️',
			confirmText: 'Salvar nome',
			cancelText: 'Cancelar',
			input: {
				label: 'Nome do baralho',
				value: deck.name,
				placeholder: 'Ex.: Matemática',
				maxLength: 36
			}
		});

		if (!newName?.trim()) return;

		const alreadyExists = state.decks.some((item) => item.id !== deckId && item.name.toLowerCase() === newName.trim().toLowerCase());

		if (alreadyExists) {
			showToast('Já existe um baralho com esse nome.');
			return;
		}

		deck.name = newName.trim();
		render();
		showToast('Baralho renomeado.');
		return;
	}

	if (action === 'deleteDeck') {
		const cardsInside = state.cards.filter((card) => card.deckId === deckId).length;
		const message = cardsInside > 0 ? `Esse baralho possui ${cardsInside} card(s). Ao excluir o baralho, esses cards também serão removidos.` : 'Este baralho será removido da sua organização.';

		const confirmed = await appConfirm({
			eyebrow: 'Excluir baralho',
			title: `Excluir "${deck.name}"?`,
			message,
			variant: 'danger',
			icon: '🗑️',
			confirmText: 'Excluir baralho',
			cancelText: 'Cancelar'
		});

		if (!confirmed) return;

		state.decks = state.decks.filter((item) => item.id !== deckId);
		state.cards = state.cards.filter((card) => card.deckId !== deckId);
		if (state.selectedDeckId === deckId) state.selectedDeckId = 'all';
		render();
		showToast('Baralho excluído.');
	}
}

function resetCardForm() {
	state.editingCardId = null;
	elements.cardForm.reset();
	elements.cardFormTitle.textContent = '➕ Novo flashcard';
	elements.cancelEditBtn.classList.add('hidden');
	renderDeckSelect();
}

function startReview() {
	const now = Date.now();
	state.reviewQueue = state.cards
		.filter((card) => {
			const isInDeck = state.selectedDeckId === 'all' || card.deckId === state.selectedDeckId;
			return isInDeck && card.nextReviewAt <= now;
		})
		.sort((a, b) => a.nextReviewAt - b.nextReviewAt)
		.map((card) => card.id);

	showView('reviewView');
	nextReviewCard();
}

function nextReviewCard() {
	state.currentReviewCardId = state.reviewQueue.shift() ?? null;
	const card = state.cards.find((item) => item.id === state.currentReviewCardId);

	elements.reviewAnswer.classList.add('hidden');
	elements.gradeActions.classList.add('hidden');
	elements.revealAnswerBtn.classList.remove('hidden');

	if (!card) {
		elements.reviewCard.classList.add('hidden');
		elements.reviewEmpty.classList.remove('hidden');
		elements.reviewSubtitle.textContent = 'Revisão finalizada ou sem cards vencidos no momento.';
		renderStats();
		saveState();
		return;
	}

	elements.reviewEmpty.classList.add('hidden');
	elements.reviewCard.classList.remove('hidden');
	elements.reviewDeckBadge.textContent = getDeckName(card.deckId);
	elements.reviewFront.textContent = card.front;
	elements.reviewBack.textContent = card.back;
	elements.reviewSubtitle.textContent = `${state.reviewQueue.length + 1} card(s) nesta sessão.`;
}

function revealAnswer() {
	elements.reviewAnswer.classList.remove('hidden');
	elements.gradeActions.classList.remove('hidden');
	elements.revealAnswerBtn.classList.add('hidden');
}

function gradeCurrentCard(grade) {
	const card = state.cards.find((item) => item.id === state.currentReviewCardId);
	if (!card) return;

	const now = Date.now();
	const minutes = 60 * 1000;
	const days = 24 * 60 * minutes;

	const intervals = {
		again: 10 * minutes,
		hard: 1 * days,
		good: Math.max(2, card.correctStreak + 2) * days,
		easy: Math.max(4, card.correctStreak + 4) * days
	};

	card.reviewCount += 1;
	card.correctStreak = grade === 'again' ? 0 : card.correctStreak + 1;
	card.difficulty = grade === 'again' || grade === 'hard' ? 'hard' : grade === 'easy' ? 'easy' : 'medium';
	card.nextReviewAt = now + intervals[grade];
	card.updatedAt = now;

	showToast(`Próxima revisão: ${formatDate(card.nextReviewAt)}.`);
	render();
	nextReviewCard();
}

async function seedExample() {
	if (state.cards.length > 0) {
		const confirmed = await appConfirm({
			eyebrow: 'Criar exemplos',
			title: 'Adicionar cards de exemplo?',
			message: 'Você já possui cards salvos. Os exemplos serão adicionados junto aos cards atuais, sem apagar nada.',
			variant: 'warning',
			icon: '✨',
			confirmText: 'Adicionar exemplos',
			cancelText: 'Cancelar'
		});

		if (!confirmed) return;
	}

	const mathDeck = state.decks.find((deck) => deck.name === 'Matemática') ?? state.decks[0];
	const techDeck = state.decks.find((deck) => deck.name === 'Informática') ?? state.decks[0];

	const examples = [
		{
			front: 'O que é um evento complementar em Probabilidade?',
			back: 'É o evento formado por todos os resultados que não pertencem ao evento original. Sua probabilidade é 1 - P(A).',
			deckId: mathDeck.id,
			difficulty: 'medium',
			tags: ['probabilidade', 'enem']
		},
		{
			front: 'Qual é a função do localStorage em uma aplicação web?',
			back: 'Salvar dados simples no navegador do usuário, mesmo após fechar ou recarregar a página.',
			deckId: techDeck.id,
			difficulty: 'new',
			tags: ['javascript', 'web']
		},
		{
			front: 'Qual é a diferença entre revisar e reler?',
			back: 'Revisar exige recuperar ativamente a informação. Reler é mais passivo e costuma dar falsa sensação de domínio.',
			deckId: mathDeck.id,
			difficulty: 'easy',
			tags: ['estudos', 'anki']
		}
	];

	examples.forEach((example) => {
		state.cards.push({
			id: crypto.randomUUID(),
			...example,
			createdAt: Date.now(),
			updatedAt: Date.now(),
			reviewCount: 0,
			correctStreak: 0,
			nextReviewAt: Date.now()
		});
	});

	render();
	showToast('Cards de exemplo adicionados.');
}

function showView(viewId) {
	elements.views.forEach((view) => view.classList.toggle('active-view', view.id === viewId));
	elements.tabs.forEach((tab) => tab.classList.toggle('active', tab.dataset.view === viewId));
}

function showToast(message) {
	elements.toast.textContent = message;
	elements.toast.classList.remove('hidden');
	clearTimeout(showToast.timeout);
	showToast.timeout = setTimeout(() => elements.toast.classList.add('hidden'), 2600);
}

let modalResolver = null;

function openAppModal({eyebrow = 'Confirmação', title = 'Confirmar ação', message = '', variant = 'default', icon = '⚡', confirmText = 'Confirmar', cancelText = 'Cancelar', input = null}) {
	return new Promise((resolve) => {
		modalResolver = resolve;

		elements.appModal.dataset.variant = variant;
		elements.appModal.dataset.mode = input ? 'prompt' : 'confirm';

		elements.modalIcon.textContent = icon;
		elements.modalEyebrow.textContent = eyebrow;
		elements.modalTitle.textContent = title;
		elements.modalMessage.textContent = message;
		elements.modalConfirmBtn.textContent = confirmText;
		elements.modalCancelBtn.textContent = cancelText;

		elements.modalConfirmBtn.className = variant === 'danger' ? 'danger-btn' : variant === 'warning' ? 'warning-btn' : 'primary-btn';

		if (input) {
			elements.modalInputGroup.classList.remove('hidden');
			elements.modalInputLabel.textContent = input.label ?? 'Digite uma resposta';
			elements.modalInput.value = input.value ?? '';
			elements.modalInput.placeholder = input.placeholder ?? '';
			elements.modalInput.maxLength = input.maxLength ?? 80;
		} else {
			elements.modalInputGroup.classList.add('hidden');
			elements.modalInput.value = '';
			elements.modalInput.placeholder = '';
		}

		elements.appModal.classList.remove('hidden');
		document.body.classList.add('modal-open');

		setTimeout(() => {
			if (input) {
				elements.modalInput.focus();
				elements.modalInput.select();
			} else {
				elements.modalConfirmBtn.focus();
			}
		}, 0);
	});
}

function closeAppModal(result) {
	elements.appModal.classList.add('hidden');
	document.body.classList.remove('modal-open');

	if (modalResolver) {
		modalResolver(result);
		modalResolver = null;
	}
}

function confirmAppModal() {
	const mode = elements.appModal.dataset.mode;

	if (mode === 'prompt') {
		closeAppModal(elements.modalInput.value);
		return;
	}

	closeAppModal(true);
}

function cancelAppModal() {
	const mode = elements.appModal.dataset.mode;
	closeAppModal(mode === 'prompt' ? null : false);
}

function appConfirm(options) {
	return openAppModal(options);
}

function appPrompt(options) {
	return openAppModal({
		...options,
		input: options.input ?? {}
	});
}

function normalizeTags(value) {
	return value
		.split(',')
		.map((tag) => tag.trim().toLowerCase())
		.filter(Boolean)
		.filter((tag, index, array) => array.indexOf(tag) === index);
}

function formatDate(timestamp) {
	const date = new Date(timestamp);
	return date.toLocaleDateString('pt-BR', {day: '2-digit', month: '2-digit'});
}

function translateDifficulty(difficulty) {
	const dictionary = {
		new: 'Novo',
		easy: 'Fácil',
		medium: 'Médio',
		hard: 'Difícil'
	};

	return dictionary[difficulty] ?? difficulty;
}

function escapeHTML(value) {
	return String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#039;');
}

elements.deckForm.addEventListener('submit', (event) => {
	event.preventDefault();
	createDeck(elements.deckNameInput.value);
});

elements.cardForm.addEventListener('submit', saveCard);
elements.cancelEditBtn.addEventListener('click', resetCardForm);
elements.searchInput.addEventListener('input', renderCards);
elements.statusFilter.addEventListener('change', renderCards);
elements.startReviewBtn.addEventListener('click', startReview);
elements.seedBtn.addEventListener('click', seedExample);
elements.revealAnswerBtn.addEventListener('click', revealAnswer);
elements.themeSelect.addEventListener('change', () => {
	changeTheme(elements.themeSelect.value);
});

elements.clearAllDataBtn.addEventListener('click', clearAllData);
elements.modalConfirmBtn.addEventListener('click', confirmAppModal);
elements.modalCancelBtn.addEventListener('click', cancelAppModal);

elements.appModal.addEventListener('click', (event) => {
	if (event.target === elements.appModal) {
		cancelAppModal();
	}
});

document.addEventListener('keydown', (event) => {
	if (elements.appModal.classList.contains('hidden')) return;

	if (event.key === 'Escape') {
		cancelAppModal();
	}

	if (event.key === 'Enter') {
		event.preventDefault();
		confirmAppModal();
	}
});

elements.gradeActions.querySelectorAll('button').forEach((button) => {
	button.addEventListener('click', () => gradeCurrentCard(button.dataset.grade));
});

elements.tabs.forEach((tab) => {
	tab.addEventListener('click', () => showView(tab.dataset.view));
});

render();
