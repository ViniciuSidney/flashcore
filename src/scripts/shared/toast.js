let toastRegion;

export function initToast() {
	toastRegion = document.querySelector('#toastRegion');
}

export function showToast(message, type = 'success', duration = 3000) {
	if (!toastRegion) return;
	const toast = document.createElement('div');
	toast.className = `toast toast--${type}`;
	toast.setAttribute('role', 'status');
	const icon = {success: '✓', warning: '!', danger: '×', info: 'i'}[type] ?? 'i';
	toast.innerHTML = `<span class="toast__icon" aria-hidden="true">${icon}</span><p></p>`;
	toast.querySelector('p').textContent = message;
	toastRegion.append(toast);
	setTimeout(() => toast.remove(), duration);
}
