import {ROUTES} from './constants.js';

function parseHash() {
	const hash = location.hash.replace(/^#\/?/, '').trim();
	if (!hash) return {name: ROUTES.HOME, params: {}};

	const [route, id] = hash.split('/');
	if (route === ROUTES.DECK && id) return {name: ROUTES.DECK, params: {deckId: decodeURIComponent(id)}};
	if (Object.values(ROUTES).includes(route)) return {name: route, params: {}};
	return {name: ROUTES.HOME, params: {}};
}

export function startRouter(onChange) {
	const handleRoute = () => onChange(parseHash());
	window.addEventListener('hashchange', handleRoute);
	handleRoute();
	return () => window.removeEventListener('hashchange', handleRoute);
}

export function navigate(route, params = {}) {
	const nextHash = route === ROUTES.DECK && params.deckId ? `#deck/${encodeURIComponent(params.deckId)}` : `#${route}`;
	if (location.hash === nextHash) {
		window.dispatchEvent(new HashChangeEvent('hashchange'));
	} else {
		location.hash = nextHash;
	}
}
