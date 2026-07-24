import {initApp} from './app.js?v=0.1.5';

let appInitialized = false;

function bootstrapFlashCore() {
	if (appInitialized) return;
	appInitialized = true;
	initApp();
}

if (document.readyState === 'loading') {
	document.addEventListener('DOMContentLoaded', bootstrapFlashCore, {once: true});
} else {
	bootstrapFlashCore();
}
