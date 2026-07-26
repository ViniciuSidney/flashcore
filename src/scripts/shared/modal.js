let dialog;
let form;
let body;
let actions;
let title;
let eyebrow;
let icon;
let closeButton;
let discardGuard;
let discardContinueButton;
let discardConfirmButton;
let resolver = null;
let validateCurrent = null;
let lastFocused = null;
let protectUnsaved = false;
let initialFormSnapshot = '';
let openedHash = '';
let pendingDiscardAction = null;

export function initModal() {
	dialog = document.querySelector('#appDialog');
	form = document.querySelector('#dialogForm');
	body = document.querySelector('#dialogBody');
	actions = document.querySelector('#dialogActions');
	title = document.querySelector('#dialogTitle');
	eyebrow = document.querySelector('#dialogEyebrow');
	icon = document.querySelector('#dialogIcon');
	closeButton = document.querySelector('#dialogCloseButton');

	createDiscardGuard();

	closeButton.addEventListener('click', () => requestDialogClose({confirmed: false, values: null}));
	dialog.addEventListener('cancel', (event) => {
		event.preventDefault();
		if (!discardGuard.hidden) {
			hideDiscardGuard();
			return;
		}
		requestDialogClose({confirmed: false, values: null});
	});

	form.addEventListener('input', updateDirtyState);
	form.addEventListener('change', updateDirtyState);
	form.addEventListener('submit', (event) => {
		event.preventDefault();
		const values = Object.fromEntries(new FormData(form).entries());
		const error = validateCurrent?.(values) ?? '';
		const existingError = body.querySelector('[data-dialog-error]');
		if (existingError) existingError.remove();
		if (error) {
			const alert = document.createElement('div');
			alert.className = 'inline-notice inline-notice--danger';
			alert.dataset.dialogError = 'true';
			alert.textContent = error;
			body.prepend(alert);
			return;
		}
		closeDialog({confirmed: true, values});
	});

	window.addEventListener('hashchange', handleRouteAttempt, true);
	window.addEventListener('beforeunload', (event) => {
		if (!hasUnsavedChanges()) return;
		event.preventDefault();
		event.returnValue = '';
	});
}

function createDiscardGuard() {
	discardGuard = document.createElement('section');
	discardGuard.className = 'dialog-discard-guard';
	discardGuard.hidden = true;
	discardGuard.setAttribute('role', 'alertdialog');
	discardGuard.setAttribute('aria-modal', 'true');
	discardGuard.setAttribute('aria-labelledby', 'discardGuardTitle');
	discardGuard.setAttribute('aria-describedby', 'discardGuardDescription');
	discardGuard.innerHTML = `
		<div class="dialog-discard-guard__panel">
			<span class="dialog-discard-guard__icon" aria-hidden="true">⚠️</span>
			<div class="dialog-discard-guard__copy">
				<span class="eyebrow">Alterações não salvas</span>
				<h3 id="discardGuardTitle">Descartar alterações?</h3>
				<p id="discardGuardDescription">O conteúdo alterado será perdido e não poderá ser recuperado.</p>
			</div>
			<div class="dialog-discard-guard__actions">
				<button class="button button--secondary" type="button" data-discard-continue>Continuar editando</button>
				<button class="button button--danger" type="button" data-discard-confirm>Descartar alterações</button>
			</div>
		</div>
	`;
	form.append(discardGuard);
	discardContinueButton = discardGuard.querySelector('[data-discard-continue]');
	discardConfirmButton = discardGuard.querySelector('[data-discard-confirm]');

	discardContinueButton.addEventListener('click', () => hideDiscardGuard());
	discardConfirmButton.addEventListener('click', () => {
		const action = pendingDiscardAction;
		hideDiscardGuard({restoreFocus: false});
		action?.();
	});
}

function serializeForm() {
	if (!form) return '';
	const controls = [...form.elements]
		.filter((control) => control.name && !control.disabled && !control.closest('.dialog-discard-guard'))
		.map((control) => ({
			name: control.name,
			type: control.type,
			value: control.type === 'file' ? [...(control.files ?? [])].map((file) => `${file.name}:${file.size}:${file.lastModified}`).join('|') : control.value,
			checked: 'checked' in control ? Boolean(control.checked) : null
		}));
	return JSON.stringify(controls);
}

function hasUnsavedChanges() {
	return Boolean(dialog?.open && protectUnsaved && serializeForm() !== initialFormSnapshot);
}

function updateDirtyState() {
	if (!dialog?.open || !protectUnsaved) return;
	dialog.dataset.dirty = String(hasUnsavedChanges());
}

function setDialogContentInert(isInert) {
	[...form.children].forEach((element) => {
		if (element === discardGuard) return;
		element.inert = isInert;
		if (isInert) element.setAttribute('aria-hidden', 'true');
		else element.removeAttribute('aria-hidden');
	});
}

function showDiscardGuard(onDiscard) {
	pendingDiscardAction = onDiscard;
	discardGuard.hidden = false;
	form.classList.add('is-confirming-discard');
	setDialogContentInert(true);
	setTimeout(() => discardContinueButton.focus(), 0);
}

function hideDiscardGuard({restoreFocus = true} = {}) {
	if (!discardGuard || discardGuard.hidden) return;
	discardGuard.hidden = true;
	form.classList.remove('is-confirming-discard');
	setDialogContentInert(false);
	pendingDiscardAction = null;
	if (restoreFocus) setTimeout(() => body.querySelector('input, textarea, select, button')?.focus() ?? closeButton.focus(), 0);
}

function requestDialogClose(result) {
	if (!dialog?.open) return;
	if (result.confirmed || !hasUnsavedChanges()) {
		closeDialog(result);
		return;
	}
	showDiscardGuard(() => closeDialog(result));
}

function handleRouteAttempt(event) {
	if (!dialog?.open) return;
	const requestedHash = window.location.hash || '#home';

	if (!hasUnsavedChanges()) {
		closeDialog({confirmed: false, values: null}, {restoreFocus: false});
		return;
	}

	event.stopImmediatePropagation();
	history.replaceState(null, '', openedHash || '#home');
	showDiscardGuard(() => {
		closeDialog({confirmed: false, values: null}, {restoreFocus: false});
		if (window.location.hash === requestedHash) window.dispatchEvent(new HashChangeEvent('hashchange'));
		else window.location.hash = requestedHash;
	});
}

function closeDialog(result, {restoreFocus = true} = {}) {
	if (!dialog?.open) return;
	if (!discardGuard.hidden) hideDiscardGuard({restoreFocus: false});
	dialog.close();
	document.body.classList.remove('no-scroll');
	resolver?.(result);
	resolver = null;
	validateCurrent = null;
	protectUnsaved = false;
	initialFormSnapshot = '';
	openedHash = '';
	dialog.dataset.dirty = 'false';
	dialog.dataset.dialogType = 'default';
	if (restoreFocus) lastFocused?.focus?.();
	lastFocused = null;
}

function openDialog({
	titleText,
	eyebrowText = 'FlashCore',
	iconText = '⚡',
	bodyHTML = '',
	confirmText = 'Confirmar',
	cancelText = 'Cancelar',
	variant = 'default',
	validate = null,
	hideCancel = false,
	dialogType = 'default',
	protectChanges = false
}) {
	lastFocused = document.activeElement;
	title.textContent = titleText;
	eyebrow.textContent = eyebrowText;
	icon.textContent = iconText;
	body.innerHTML = bodyHTML;
	dialog.dataset.variant = variant;
	dialog.dataset.dialogType = dialogType;
	dialog.dataset.dirty = 'false';
	validateCurrent = validate;
	protectUnsaved = protectChanges;
	openedHash = window.location.hash || '#home';

	actions.innerHTML = `
		${hideCancel ? '' : `<button class="button button--secondary" type="button" data-dialog-cancel>${cancelText}</button>`}
		<button class="button ${variant === 'danger' ? 'button--danger' : variant === 'warning' ? 'button--warning' : 'button--primary'}" type="submit">${confirmText}</button>
	`;
	actions.querySelector('[data-dialog-cancel]')?.addEventListener('click', () => requestDialogClose({confirmed: false, values: null}));

	document.body.classList.add('no-scroll');
	dialog.showModal();
	initialFormSnapshot = serializeForm();
	setTimeout(() => body.querySelector('input, textarea, select, button')?.focus() ?? actions.querySelector('button')?.focus(), 0);

	return new Promise((resolve) => {
		resolver = resolve;
	});
}

export function openConfirm({title, message, eyebrow = 'Confirmação', icon = '⚠️', confirmText = 'Confirmar', cancelText = 'Cancelar', variant = 'default'}) {
	return openDialog({
		titleText: title,
		eyebrowText: eyebrow,
		iconText: icon,
		bodyHTML: `<p class="dialog-message">${message}</p>`,
		confirmText,
		cancelText,
		variant
	});
}

export function openForm({title, bodyHTML, eyebrow = 'Editar', icon = '✏️', confirmText = 'Salvar', cancelText = 'Cancelar', variant = 'default', validate = null, protectUnsaved = false}) {
	return openDialog({
		titleText: title,
		eyebrowText: eyebrow,
		iconText: icon,
		bodyHTML,
		confirmText,
		cancelText,
		variant,
		validate,
		dialogType: 'form',
		protectChanges: protectUnsaved
	});
}

export function openAlert({title, message, eyebrow = 'Aviso', icon = 'ℹ️', confirmText = 'Entendi', variant = 'default'}) {
	return openDialog({
		titleText: title,
		eyebrowText: eyebrow,
		iconText: icon,
		bodyHTML: `<p class="dialog-message">${message}</p>`,
		confirmText,
		variant,
		hideCancel: true
	});
}
