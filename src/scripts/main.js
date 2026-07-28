import {initApp} from './app.js?v=0.2.0-c3.1';

let appInitialized = false;

async function bootstrapFlashCore() {
	if (appInitialized) return;
	appInitialized = true;

	try {
		await initApp();
	} catch (error) {
		console.error('O FlashCore falhou durante a inicialização:', error);
	}
}

if (document.readyState === 'loading') {
	document.addEventListener('DOMContentLoaded', bootstrapFlashCore, {once: true});
} else {
	void bootstrapFlashCore();
}
