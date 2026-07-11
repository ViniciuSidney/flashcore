let dialog;
let form;
let body;
let actions;
let title;
let eyebrow;
let icon;
let closeButton;
let resolver = null;
let validateCurrent = null;
let lastFocused = null;

export function initModal() {
	dialog = document.querySelector('#appDialog');
	form = document.querySelector('#dialogForm');
	body = document.querySelector('#dialogBody');
	actions = document.querySelector('#dialogActions');
	title = document.querySelector('#dialogTitle');
	eyebrow = document.querySelector('#dialogEyebrow');
	icon = document.querySelector('#dialogIcon');
	closeButton = document.querySelector('#dialogCloseButton');

	closeButton.addEventListener('click', () => closeDialog({confirmed: false, values: null}));
	dialog.addEventListener('cancel', (event) => {
		event.preventDefault();
		closeDialog({confirmed: false, values: null});
	});

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
}

function closeDialog(result) {
	if (!dialog?.open) return;
	dialog.close();
	document.body.classList.remove('no-scroll');
	resolver?.(result);
	resolver = null;
	validateCurrent = null;
	lastFocused?.focus?.();
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
	hideCancel = false
}) {
	lastFocused = document.activeElement;
	title.textContent = titleText;
	eyebrow.textContent = eyebrowText;
	icon.textContent = iconText;
	body.innerHTML = bodyHTML;
	dialog.dataset.variant = variant;
	validateCurrent = validate;

	actions.innerHTML = `
		${hideCancel ? '' : `<button class="button button--secondary" type="button" data-dialog-cancel>${cancelText}</button>`}
		<button class="button ${variant === 'danger' ? 'button--danger' : variant === 'warning' ? 'button--warning' : 'button--primary'}" type="submit">${confirmText}</button>
	`;
	actions.querySelector('[data-dialog-cancel]')?.addEventListener('click', () => closeDialog({confirmed: false, values: null}));

	document.body.classList.add('no-scroll');
	dialog.showModal();
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

export function openForm({title, bodyHTML, eyebrow = 'Editar', icon = '✏️', confirmText = 'Salvar', cancelText = 'Cancelar', variant = 'default', validate = null}) {
	return openDialog({titleText: title, eyebrowText: eyebrow, iconText: icon, bodyHTML, confirmText, cancelText, variant, validate});
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
