import {APP_CONFIG} from '../../core/config.js';
import {THEMES} from '../../core/constants.js';
import {getState, mutateState, resetState} from '../../core/state.js';
import {escapeHTML} from '../../shared/helpers.js';
import {openConfirm, openForm} from '../../shared/modal.js';
import {showToast} from '../../shared/toast.js';

export function applyTheme(theme = getState().settings.theme) {
	const safeTheme = Object.values(THEMES).includes(theme) ? theme : THEMES.SYSTEM;
	document.documentElement.dataset.theme = safeTheme;
	const metaTheme = document.querySelector('meta[name="theme-color"]');
	if (metaTheme) {
		const isDark = safeTheme === THEMES.DARK || (safeTheme === THEMES.SYSTEM && matchMedia('(prefers-color-scheme: dark)').matches);
		metaTheme.content = isDark ? '#08111f' : '#edf3fb';
	}
	const icon = document.querySelector('#themeToggleIcon');
	if (icon) icon.textContent = safeTheme === THEMES.LIGHT ? '☀' : safeTheme === THEMES.DARK ? '☾' : '◐';
}

export function changeTheme(theme) {
	mutateState((state) => { state.settings.theme = theme; }, 'settings:theme');
	applyTheme(theme);
	showToast(`Tema ${theme === 'light' ? 'claro' : theme === 'dark' ? 'escuro' : 'do sistema'} ativado.`);
}

export function cycleTheme() {
	const order = [THEMES.SYSTEM, THEMES.LIGHT, THEMES.DARK];
	const current = getState().settings.theme;
	changeTheme(order[(order.indexOf(current) + 1) % order.length]);
}

export function changeReviewLimit(value) {
	mutateState((state) => { state.settings.reviewLimit = Number(value) || APP_CONFIG.defaultReviewLimit; }, 'settings:review-limit');
	showToast('Limite de revisão atualizado.');
}

export function changeShowIntervals(enabled) {
	mutateState((state) => { state.settings.showIntervals = Boolean(enabled); }, 'settings:intervals');
	showToast('Preferência de intervalos atualizada.');
}

export async function confirmDeleteAllData() {
	const state = getState();
	const first = await openConfirm({
		title: 'Excluir todos os dados?',
		eyebrow: 'Ação crítica',
		icon: '🗑️',
		message: `Isso apagará <strong>${state.decks.length} baralho(s)</strong>, <strong>${state.cards.length} flashcard(s)</strong>, sessões e preferências locais.`,
		confirmText: 'Continuar',
		variant: 'danger'
	});
	if (!first.confirmed) return false;

	const second = await openForm({
		title: 'Confirmação final',
		eyebrow: 'Proteção contra acidentes',
		icon: '⚠️',
		bodyHTML: `<p class="dialog-message">Digite <strong>EXCLUIR</strong> para remover tudo definitivamente.</p><label class="field"><span>Palavra de confirmação</span><input class="input" name="confirmation" autocomplete="off" placeholder="EXCLUIR" /></label>`,
		confirmText: 'Excluir definitivamente',
		variant: 'danger',
		validate: (values) => values.confirmation?.trim() === 'EXCLUIR' ? '' : 'Digite EXCLUIR exatamente como indicado.'
	});
	if (!second.confirmed) return false;
	resetState();
	applyTheme();
	showToast('Todos os dados foram excluídos.', 'warning');
	return true;
}

function storageSize() {
	try {
		const bytes = new Blob([JSON.stringify(getState())]).size;
		return bytes < 1024 ? `${bytes} B` : `${(bytes / 1024).toFixed(1)} KB`;
	} catch {
		return 'Indisponível';
	}
}

export function renderSettings(category = 'appearance') {
	const state = getState();
	const categories = [
		['appearance', '◐', 'Aparência'],
		['review', '◈', 'Revisão'],
		['data', '▣', 'Dados'],
		['about', 'i', 'Sobre']
	];
	const categoriesHTML = categories.map(([id, icon, label]) => `<button class="settings-category ${category === id ? 'is-active' : ''}" type="button" data-action="select-settings-category" data-category="${id}"><span>${icon}</span><span>${label}</span></button>`).join('');
	const content = category === 'review' ? renderReviewSettings(state) : category === 'data' ? renderDataSettings(state) : category === 'about' ? renderAbout() : renderAppearance(state);

	return `
		<div class="page-stack">
			<header class="page-intro"><div class="page-intro__copy"><span class="eyebrow">Preferências</span><h2>Opções do FlashCore</h2><p>Personalize a experiência e gerencie os dados salvos neste navegador.</p></div></header>
			<div class="settings-layout">
				<nav class="panel settings-categories" aria-label="Categorias de opções">${categoriesHTML}</nav>
				<section class="panel settings-content">${content}</section>
			</div>
		</div>
	`;
}

function renderAppearance(state) {
	const option = (value, title, description, icon) => `<label class="choice-card"><input type="radio" name="theme" value="${value}" ${state.settings.theme === value ? 'checked' : ''} /><span><strong>${icon} ${title}</strong><small>${description}</small></span></label>`;
	return `<header class="panel-header"><div class="panel-header__copy"><span class="eyebrow">Aparência</span><h2>Tema da interface</h2><p>Escolha o modo mais confortável para estudar.</p></div></header><div class="panel-body settings-section"><div class="choice-grid">${option('system', 'Sistema', 'Segue a preferência do dispositivo', '◐')}${option('light', 'Claro', 'Interface clara em tons azulados', '☀')}${option('dark', 'Escuro', 'Menos brilho para ambientes escuros', '☾')}</div></div>`;
}

function renderReviewSettings(state) {
	return `
		<header class="panel-header"><div class="panel-header__copy"><span class="eyebrow">Revisão</span><h2>Comportamento das sessões</h2><p>Ajustes simples para manter o estudo confortável.</p></div></header>
		<div class="panel-body settings-section">
			<div class="settings-item"><div class="settings-item__copy"><h3>Máximo por sessão</h3><p>Limita a quantidade de cards carregados de uma vez.</p></div><select class="select" id="reviewLimitSelect" style="width:auto"><option value="10" ${state.settings.reviewLimit === 10 ? 'selected' : ''}>10 cards</option><option value="20" ${state.settings.reviewLimit === 20 ? 'selected' : ''}>20 cards</option><option value="30" ${state.settings.reviewLimit === 30 ? 'selected' : ''}>30 cards</option><option value="50" ${state.settings.reviewLimit === 50 ? 'selected' : ''}>50 cards</option><option value="99999" ${state.settings.reviewLimit >= 99999 ? 'selected' : ''}>Sem limite</option></select></div>
			<div class="settings-item switch-row"><div class="settings-item__copy"><h3>Mostrar intervalos</h3><p>Exibe “10 min”, “1 dia” e outros efeitos nos botões de dificuldade.</p></div><label class="switch"><input type="checkbox" id="showIntervalsToggle" ${state.settings.showIntervals ? 'checked' : ''} /><span></span></label></div>
		</div>
	`;
}

function renderDataSettings(state) {
	return `
		<header class="panel-header"><div class="panel-header__copy"><span class="eyebrow">Dados locais</span><h2>Armazenamento</h2><p>Na v0.1, tudo fica somente neste navegador.</p></div></header>
		<div class="panel-body settings-section">
			<div class="settings-item"><div class="settings-item__copy"><h3>Resumo atual</h3><p>${state.decks.length} baralho(s), ${state.cards.length} card(s) e ${state.sessions.length} sessão(ões).</p></div><span class="badge">${storageSize()}</span></div>
			<div class="settings-item settings-danger"><div class="settings-item__copy"><h3>Excluir todos os dados</h3><p>Remove baralhos, cards, sessões e preferências. A ação exige confirmação dupla.</p></div><button class="button button--danger" type="button" data-action="delete-all-data">Excluir tudo</button></div>
		</div>
	`;
}

function renderAbout() {
	return `
		<header class="panel-header"><div class="panel-header__copy"><span class="eyebrow">Sobre</span><h2>FlashCore</h2><p>O núcleo da sua revisão ativa.</p></div></header>
		<div class="panel-body settings-section">
			<div class="settings-item"><div class="settings-item__copy"><h3>Versão</h3><p>Fundação Essencial baseada no Modelo de Projeto.</p></div><span class="badge">v${APP_CONFIG.version}</span></div>
			<div class="settings-item"><div class="settings-item__copy"><h3>Tecnologias</h3><p>HTML, CSS, JavaScript modular e localStorage.</p></div><span class="badge">Local-first</span></div>
			<div class="inline-notice"><span>ℹ️</span><p>Esta primeira estrutura visual é provisória e foi preparada para evoluir durante o desenvolvimento sem perder a organização interna.</p></div>
		</div>
	`;
}
