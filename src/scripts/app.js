import {ROUTES} from './core/constants.js';
import {getState, subscribeState} from './core/state.js';
import {navigate, startRouter} from './core/router.js';
import {initModal, openConfirm} from './shared/modal.js';
import {initToast, showToast} from './shared/toast.js';
import {debounce} from './shared/helpers.js';
import {renderHome} from './features/home/home.ui.js';
import {renderDecksGallery} from './features/decks/decks.ui.js';
import {confirmDeleteDeck, promptCreateDeck, promptEditDeck} from './features/decks/decks.controller.js';
import {createExampleData, getDeckById, touchDeck} from './features/decks/decks.model.js';
import {renderDeckDetail} from './features/cards/cards.ui.js';
import {confirmDeleteCard, promptCreateCard, promptEditCard, promptMoveCard} from './features/cards/cards.controller.js';
import {renderReport, renderReview} from './features/review/review.ui.js?v=0.1.2';
import {discardSession, finishSession, getActiveSession, gradeCurrentCard, revealAnswer, startSession} from './features/review/review.service.js';
import {buildImportPreview, finalizeImport, getImportDraft, goToImportStep, loadCSVFile, prepareImport, renderImport, resetImport, setImportValue} from './features/importer/importer.controller.js';
import {applyTheme, changeReviewLimit, changeShowIntervals, changeTheme, confirmDeleteAllData, cycleTheme, renderSettings} from './features/settings/settings.controller.js';

const appView = document.querySelector('#appView');
const pageTitle = document.querySelector('#pageTitle');
const pageEyebrow = document.querySelector('#pageEyebrow');
const sidebarDueCount = document.querySelector('#sidebarDueCount');

let currentRoute = {name: ROUTES.HOME, params: {}};
let previousRouteKey = '';
const ui = {
	deckSearch: '',
	deckOrder: 'recent',
	cardSearch: '',
	cardFilter: 'all',
	selectedCardId: '',
	showCardDetailMobile: false,
	settingsCategory: 'appearance'
};

const routeMeta = {
	[ROUTES.HOME]: ['FlashCore', 'Início'],
	[ROUTES.DECKS]: ['Biblioteca', 'Baralhos'],
	[ROUTES.DECK]: ['Biblioteca', 'Conteúdo do baralho'],
	[ROUTES.REVIEW]: ['Estudo ativo', 'Revisão'],
	[ROUTES.IMPORT]: ['Entrada em massa', 'Importar'],
	[ROUTES.SETTINGS]: ['Preferências', 'Opções'],
	[ROUTES.REPORT]: ['Resultado', 'Resumo da sessão']
};

export function initApp() {
	initModal();
	initToast();
	applyTheme();
	bindGlobalEvents();

	matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
		if (getState().settings.theme === 'system') applyTheme('system');
	});

	subscribeState(() => {
		updateGlobalSummary();
		renderCurrentRoute();
	});

	startRouter((route) => {
		const routeKey = `${route.name}:${route.params.deckId ?? ''}`;
		currentRoute = route;
		if (route.name === ROUTES.DECK && route.params.deckId && routeKey !== previousRouteKey) {
			ui.cardSearch = '';
			ui.cardFilter = 'all';
			ui.selectedCardId = '';
			ui.showCardDetailMobile = false;
			touchDeck(route.params.deckId);
		}
		if (route.name === ROUTES.IMPORT) prepareImport();
		previousRouteKey = routeKey;
		renderCurrentRoute(true);
	});

	updateGlobalSummary();
}

function renderCurrentRoute(focusView = false) {
	const [eyebrow, title] = routeMeta[currentRoute.name] ?? routeMeta[ROUTES.HOME];
	pageEyebrow.textContent = eyebrow;
	pageTitle.textContent = title;

	let html = '';
	switch (currentRoute.name) {
		case ROUTES.DECKS:
			html = renderDecksGallery({search: ui.deckSearch, order: ui.deckOrder});
			break;
		case ROUTES.DECK:
			html = renderDeckDetail({
				deckId: currentRoute.params.deckId,
				selectedCardId: ui.selectedCardId,
				search: ui.cardSearch,
				filter: ui.cardFilter,
				showDetailMobile: ui.showCardDetailMobile
			});
			break;
		case ROUTES.REVIEW:
			html = renderReview();
			break;
		case ROUTES.IMPORT:
			html = renderImport();
			break;
		case ROUTES.SETTINGS:
			html = renderSettings(ui.settingsCategory);
			break;
		case ROUTES.REPORT:
			html = renderReport();
			break;
		default:
			html = renderHome();
	}

	appView.innerHTML = html;
	updateNavigation();
	const activelyReviewing = currentRoute.name === ROUTES.REVIEW && Boolean(getActiveSession());
	document.body.classList.toggle('is-reviewing', activelyReviewing);
	if (focusView) appView.focus({preventScroll: true});
}

function updateNavigation() {
	const activeRoute = currentRoute.name === ROUTES.DECK ? ROUTES.DECKS : currentRoute.name === ROUTES.REPORT ? ROUTES.REVIEW : currentRoute.name;
	document.querySelectorAll('[data-route-link]').forEach((link) => {
		link.classList.toggle('is-active', link.dataset.routeLink === activeRoute);
		if (link.dataset.routeLink === activeRoute) link.setAttribute('aria-current', 'page');
		else link.removeAttribute('aria-current');
	});
}

function updateGlobalSummary() {
	const due = getState().cards.filter((card) => card.nextReviewAt <= Date.now()).length;
	sidebarDueCount.textContent = due;
}

function bindGlobalEvents() {
	document.addEventListener('click', handleClick);
	document.addEventListener('change', handleChange);
	document.addEventListener('input', handleInput);
}

async function handleClick(event) {
	const trigger = event.target.closest('[data-action]');
	if (!trigger) return;
	const {action, deckId, cardId, category, grade, cardIds, preserveSchedule} = trigger.dataset;

	switch (action) {
		case 'create-deck': {
			const deck = await promptCreateDeck();
			if (deck && currentRoute.name === ROUTES.IMPORT) {
				resetImport(deck.id);
				renderCurrentRoute();
			}
			break;
		}
		case 'create-example':
			if (createExampleData()) showToast('Conteúdo de exemplo criado.');
			else showToast('O exemplo só pode ser carregado com a aplicação vazia.', 'warning');
			break;
		case 'edit-deck':
			await promptEditDeck(deckId);
			break;
		case 'delete-deck': {
			const deleted = await confirmDeleteDeck(deckId);
			if (deleted && currentRoute.name === ROUTES.DECK) navigate(ROUTES.DECKS);
			break;
		}
		case 'quick-add-card':
		case 'create-card': {
			let targetDeckId = deckId || (currentRoute.name === ROUTES.DECK ? currentRoute.params.deckId : getState().decks[0]?.id);
			if (!targetDeckId) {
				const deck = await promptCreateDeck();
				targetDeckId = deck?.id;
			}
			if (targetDeckId) {
				const card = await promptCreateCard(targetDeckId);
				if (card && currentRoute.name === ROUTES.DECK) ui.selectedCardId = card.id;
			}
			break;
		}
		case 'edit-card':
			await promptEditCard(cardId);
			break;
		case 'move-card': {
			const moved = await promptMoveCard(cardId);
			if (moved && currentRoute.name === ROUTES.DECK) {
				ui.selectedCardId = '';
				ui.showCardDetailMobile = false;
			}
			break;
		}
		case 'delete-card': {
			const deleted = await confirmDeleteCard(cardId);
			if (deleted) {
				ui.selectedCardId = '';
				ui.showCardDetailMobile = false;
			}
			break;
		}
		case 'select-card':
			ui.selectedCardId = cardId;
			ui.showCardDetailMobile = true;
			renderCurrentRoute();
			break;
		case 'close-card-detail':
			ui.showCardDetailMobile = false;
			renderCurrentRoute();
			break;
		case 'start-scheduled-review':
			launchReview({mode: 'scheduled'});
			break;
		case 'start-scheduled-deck-review':
			launchReview({mode: 'scheduled', deckId});
			break;
		case 'start-free-review':
			launchReview({mode: 'free', deckId});
			break;
		case 'retry-session':
			launchReview({mode: 'retry', cardIds: cardIds ? cardIds.split(',').filter(Boolean) : [], preserveSchedule: preserveSchedule === 'true'});
			break;
		case 'reveal-answer':
			revealAnswer();
			renderCurrentRoute();
			break;
		case 'grade-card': {
			const result = gradeCurrentCard(grade);
			if (result.finished) navigate(ROUTES.REPORT);
			else renderCurrentRoute();
			break;
		}
		case 'exit-review': {
			const confirmation = await openConfirm({
				title: 'Encerrar a sessão agora?',
				eyebrow: getActiveSession()?.preserveSchedule ? 'Estudo livre em andamento' : 'Revisão em andamento',
				icon: '◈',
				message: 'As respostas já registradas serão mantidas e a sessão aparecerá como parcial no relatório.',
				confirmText: 'Encerrar sessão',
				variant: 'warning'
			});
			if (confirmation.confirmed) {
				finishSession(false);
				navigate(ROUTES.REPORT);
			}
			break;
		}
		case 'import-to-deck':
			resetImport(deckId);
			navigate(ROUTES.IMPORT);
			break;
		case 'import-next':
			if (!getImportDraft().deckId) return showToast('Escolha um baralho de destino.', 'warning');
			goToImportStep(2);
			renderCurrentRoute();
			break;
		case 'import-back':
			goToImportStep(getImportDraft().step - 1);
			renderCurrentRoute();
			break;
		case 'import-preview':
			if (!getImportDraft().rawText.trim()) return showToast('Forneça o texto ou selecione um CSV.', 'warning');
			buildImportPreview();
			goToImportStep(3);
			renderCurrentRoute();
			break;
		case 'import-finish':
			finalizeImport();
			renderCurrentRoute();
			break;
		case 'restart-import':
			resetImport(getImportDraft().deckId);
			renderCurrentRoute();
			break;
		case 'select-settings-category':
			ui.settingsCategory = category;
			renderCurrentRoute();
			break;
		case 'delete-all-data': {
			const deleted = await confirmDeleteAllData();
			if (deleted) {
				discardSession();
				resetImport();
				navigate(ROUTES.HOME);
			}
			break;
		}
		case 'toggle-theme':
			cycleTheme();
			break;
	}
}

function launchReview(options) {
	const session = startSession(options);
	if (!session) {
		showToast(options.mode === 'scheduled' ? 'Não há cards disponíveis pela data de revisão.' : 'Este baralho ainda não possui cards.', 'warning');
		if (currentRoute.name !== ROUTES.REVIEW) navigate(ROUTES.REVIEW);
		return;
	}
	navigate(ROUTES.REVIEW);
}

async function handleChange(event) {
	const target = event.target;
	if (target.matches('#deckOrderSelect')) {
		ui.deckOrder = target.value;
		renderCurrentRoute();
	}
	if (target.matches('#cardFilterSelect')) {
		ui.cardFilter = target.value;
		ui.selectedCardId = '';
		renderCurrentRoute();
	}
	if (target.matches('input[name="sourceType"]')) {
		setImportValue('sourceType', target.value);
		setImportValue('rawText', '');
		setImportValue('fileName', '');
		renderCurrentRoute();
	}
	if (target.matches('#importDeckSelect')) setImportValue('deckId', target.value);
	if (target.matches('#importFileInput')) {
		await loadCSVFile(target.files?.[0]);
		renderCurrentRoute();
	}
	if (target.matches('input[name="duplicatePolicy"]')) {
		setImportValue('duplicatePolicy', target.value);
		renderCurrentRoute();
	}
	if (target.matches('input[name="theme"]')) changeTheme(target.value);
	if (target.matches('#reviewLimitSelect')) changeReviewLimit(target.value);
	if (target.matches('#showIntervalsToggle')) changeShowIntervals(target.checked);
}

const updateDeckSearch = debounce((value) => {
	ui.deckSearch = value;
	renderCurrentRoute();
}, 120);

const updateCardSearch = debounce((value) => {
	ui.cardSearch = value;
	ui.selectedCardId = '';
	renderCurrentRoute();
}, 120);

function handleInput(event) {
	const target = event.target;
	if (target.matches('#deckSearchInput')) updateDeckSearch(target.value);
	if (target.matches('#cardSearchInput')) updateCardSearch(target.value);
	if (target.matches('#importTextInput')) setImportValue('rawText', target.value);
}
