import {getState} from '../../core/state.js';
import {escapeHTML} from '../../shared/helpers.js';
import {pluralize} from '../../shared/formatters.js';
import {showToast} from '../../shared/toast.js';
import {addImportedCards} from '../cards/cards.model.js';
import {getDeckById} from '../decks/decks.model.js';
import {analyzeRecords, parseCSV, parseStructuredText} from './importer.service.js';

const initialDraft = () => ({
	step: 1,
	deckId: '',
	sourceType: 'text',
	rawText: '',
	fileName: '',
	records: [],
	duplicatePolicy: 'skip',
	result: null
});

let draft = initialDraft();

export function getImportDraft() {
	return draft;
}

export function prepareImport(deckId = '') {
	if (deckId) draft.deckId = deckId;
	if (!draft.deckId && getState().decks[0]) draft.deckId = getState().decks[0].id;
}

export function resetImport(deckId = '') {
	draft = initialDraft();
	prepareImport(deckId);
}

export function setImportValue(key, value) {
	draft[key] = value;
}

export async function loadCSVFile(file) {
	if (!file) return;
	draft.rawText = await file.text();
	draft.fileName = file.name;
	draft.sourceType = 'csv';
}

export function goToImportStep(step) {
	draft.step = Math.min(4, Math.max(1, step));
}

export function buildImportPreview() {
	const rawRecords = draft.sourceType === 'csv' ? parseCSV(draft.rawText) : parseStructuredText(draft.rawText);
	draft.records = analyzeRecords(draft.deckId, rawRecords);
	return draft.records;
}

export function finalizeImport() {
	const importable = draft.records.filter((record) => record.status === 'valid' || (record.status === 'duplicate' && draft.duplicatePolicy === 'keep'));
	const imported = addImportedCards(draft.deckId, importable);
	const invalid = draft.records.filter((record) => record.status === 'invalid').length;
	const duplicateCount = draft.records.filter((record) => record.status === 'duplicate').length;
	const skipped = draft.duplicatePolicy === 'skip' ? duplicateCount : 0;
	draft.result = {imported: imported.length, invalid, skipped};
	draft.step = 4;
	showToast(`${pluralize(imported.length, 'flashcard')} importado(s).`);
	return draft.result;
}

function stepClass(step) {
	return step < draft.step ? 'is-complete' : step === draft.step ? 'is-active' : '';
}

function wizardHeader() {
	return `
		<div class="wizard-steps" aria-label="Etapas da importação">
			<div class="wizard-step ${stepClass(1)}">1 <span>Destino</span></div>
			<div class="wizard-step ${stepClass(2)}">2 <span>Conteúdo</span></div>
			<div class="wizard-step ${stepClass(3)}">3 <span>Revisão</span></div>
			<div class="wizard-step ${stepClass(4)}">4 <span>Resultado</span></div>
		</div>
	`;
}

function renderStepOne() {
	const decks = getState().decks;
	const options = decks.map((deck) => `<option value="${deck.id}" ${draft.deckId === deck.id ? 'selected' : ''}>${escapeHTML(deck.name)}</option>`).join('');
	return `
		<div class="wizard-content">
			<div><span class="eyebrow">Etapa 1</span><h2>Escolha o destino e a origem</h2><p class="text-muted">Todos os registros válidos serão adicionados ao baralho selecionado.</p></div>
			<label class="field"><span>Baralho de destino</span><select class="select" id="importDeckSelect">${options}</select></label>
			<div class="field"><span>Formato de origem</span><div class="choice-grid">
				<label class="choice-card"><input type="radio" name="sourceType" value="text" ${draft.sourceType === 'text' ? 'checked' : ''} /><span><strong>Texto estruturado</strong><small>Uma linha por card, separada por |</small></span></label>
				<label class="choice-card"><input type="radio" name="sourceType" value="csv" ${draft.sourceType === 'csv' ? 'checked' : ''} /><span><strong>Arquivo CSV</strong><small>Colunas frente, verso e tags</small></span></label>
			</div></div>
		</div>
		<div class="wizard-actions"><a class="button button--ghost" href="#decks">Cancelar</a><button class="button button--primary" type="button" data-action="import-next">Continuar</button></div>
	`;
}

function renderStepTwo() {
	const content = draft.sourceType === 'text'
		? `<label class="field"><span>Cole os flashcards</span><textarea class="textarea" id="importTextInput" rows="13" placeholder="Frente | Verso | tag 1, tag 2">${escapeHTML(draft.rawText)}</textarea><small>Use uma linha para cada card. As tags são opcionais.</small></label>`
		: `<label class="field"><span>Arquivo CSV</span><input class="input" id="importFileInput" type="file" accept=".csv,text/csv" /><small>${draft.fileName ? `Arquivo carregado: ${escapeHTML(draft.fileName)}` : 'O arquivo deve ter as colunas frente, verso e tags. Também aceitamos front, back e tags.'}</small></label>${draft.rawText ? '<div class="inline-notice inline-notice--success">✓ Arquivo lido e pronto para validação.</div>' : ''}`;
	return `
		<div class="wizard-content">
			<div><span class="eyebrow">Etapa 2</span><h2>Forneça o conteúdo</h2><p class="text-muted">Nada será salvo antes da prévia e da confirmação final.</p></div>
			${content}
		</div>
		<div class="wizard-actions"><button class="button button--ghost" type="button" data-action="import-back">Voltar</button><button class="button button--primary" type="button" data-action="import-preview">Validar e visualizar</button></div>
	`;
}

function statusBadge(record) {
	if (record.status === 'valid') return '<span class="status-pill status-pill--easy">Válido</span>';
	if (record.status === 'duplicate') return '<span class="status-pill status-pill--due">Duplicata</span>';
	return '<span class="status-pill status-pill--hard">Inválido</span>';
}

function renderStepThree() {
	const rows = draft.records.slice(0, 100).map((record) => `<tr><td>${record.lineNumber}</td><td>${escapeHTML(record.front || '—')}</td><td>${escapeHTML(record.back || '—')}</td><td>${statusBadge(record)}</td></tr>`).join('');
	const valid = draft.records.filter((record) => record.status === 'valid').length;
	const duplicates = draft.records.filter((record) => record.status === 'duplicate').length;
	const invalid = draft.records.filter((record) => record.status === 'invalid').length;
	return `
		<div class="wizard-content">
			<div><span class="eyebrow">Etapa 3</span><h2>Confira antes de importar</h2><p class="text-muted">Revise a prévia e decida o que fazer com possíveis duplicatas.</p></div>
			<div class="preview-table-wrap"><table class="preview-table"><thead><tr><th>Linha</th><th>Frente</th><th>Verso</th><th>Status</th></tr></thead><tbody>${rows}</tbody></table></div>
			${draft.records.length > 100 ? '<div class="inline-notice">A prévia mostra os primeiros 100 registros.</div>' : ''}
			<div class="field"><span>Possíveis duplicatas</span><div class="choice-grid">
				<label class="choice-card"><input type="radio" name="duplicatePolicy" value="skip" ${draft.duplicatePolicy === 'skip' ? 'checked' : ''} /><span><strong>Ignorar duplicatas</strong><small>Opção mais segura</small></span></label>
				<label class="choice-card"><input type="radio" name="duplicatePolicy" value="keep" ${draft.duplicatePolicy === 'keep' ? 'checked' : ''} /><span><strong>Manter duplicatas</strong><small>Importar mesmo assim</small></span></label>
			</div></div>
		</div>
		<div class="wizard-actions"><button class="button button--ghost" type="button" data-action="import-back">Voltar</button><button class="button button--primary" type="button" data-action="import-finish" ${valid + (draft.duplicatePolicy === 'keep' ? duplicates : 0) === 0 ? 'disabled' : ''}>Importar flashcards</button></div>
	`;
}

function renderStepFour() {
	const result = draft.result ?? {imported: 0, invalid: 0, skipped: 0};
	const deck = getDeckById(draft.deckId);
	return `
		<div class="wizard-content empty-state">
			<div class="empty-state__content">
				<span class="empty-state__icon">✓</span>
				<span class="eyebrow">Importação concluída</span>
				<h2>${pluralize(result.imported, 'flashcard')} adicionado(s)</h2>
				<p>Os cards válidos foram enviados para <strong>${escapeHTML(deck?.name ?? 'o baralho escolhido')}</strong>.</p>
				<div class="metrics-grid" style="width:100%">
					<article class="metric-card"><div class="metric-card__top"><span>Importados</span><span>✓</span></div><strong class="text-success">${result.imported}</strong><small>salvos no baralho</small></article>
					<article class="metric-card"><div class="metric-card__top"><span>Ignorados</span><span>!</span></div><strong class="text-warning">${result.skipped}</strong><small>duplicatas não salvas</small></article>
					<article class="metric-card"><div class="metric-card__top"><span>Inválidos</span><span>×</span></div><strong class="text-danger">${result.invalid}</strong><small>linhas incompletas</small></article>
				</div>
				<div class="button-row"><a class="button button--primary" href="#deck/${encodeURIComponent(draft.deckId)}">Abrir baralho</a><button class="button button--secondary" type="button" data-action="restart-import">Nova importação</button></div>
			</div>
		</div>
	`;
}

export function renderImport() {
	const decks = getState().decks;
	if (decks.length === 0) {
		return `<section class="panel empty-state"><div class="empty-state__content"><span class="empty-state__icon">⇩</span><h2>Crie um baralho primeiro</h2><p>A importação precisa de um baralho de destino.</p><button class="button button--primary" type="button" data-action="create-deck">Criar baralho</button></div></section>`;
	}
	prepareImport();
	const valid = draft.records.filter((record) => record.status === 'valid').length;
	const duplicates = draft.records.filter((record) => record.status === 'duplicate').length;
	const invalid = draft.records.filter((record) => record.status === 'invalid').length;
	const stepContent = draft.step === 1 ? renderStepOne() : draft.step === 2 ? renderStepTwo() : draft.step === 3 ? renderStepThree() : renderStepFour();
	return `
		<div class="page-stack">
			<header class="page-intro"><div class="page-intro__copy"><span class="eyebrow">Entrada em massa</span><h2>Importar flashcards</h2><p>Adicione vários cards com prévia, validação e controle de duplicatas.</p></div></header>
			<div class="wizard-layout">
				<section class="panel wizard-main">${wizardHeader()}${stepContent}</section>
				<aside class="wizard-side">
					<section class="panel"><header class="panel-header"><div class="panel-header__copy"><span class="eyebrow">Formato</span><h2>Texto estruturado</h2></div></header><div class="panel-body"><pre class="code-example">O que é HTTP? | Protocolo de comunicação da Web. | redes, web\nO que é CSS? | Linguagem de estilos. | frontend</pre></div></section>
					<section class="panel"><header class="panel-header"><div class="panel-header__copy"><span class="eyebrow">Validação</span><h2>Resumo atual</h2></div></header><div class="panel-body import-summary"><div class="import-summary__row"><span>Válidos</span><strong class="text-success">${valid}</strong></div><div class="import-summary__row"><span>Duplicatas</span><strong class="text-warning">${duplicates}</strong></div><div class="import-summary__row"><span>Inválidos</span><strong class="text-danger">${invalid}</strong></div></div></section>
				</aside>
			</div>
		</div>
	`;
}
