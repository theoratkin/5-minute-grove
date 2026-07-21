import type { ClientInit } from '@sveltejs/kit';
import {
	baseLocale,
	extractLocaleFromCookie,
	extractLocaleFromNavigator,
	getLocaleForUrl,
	localizeUrl
} from '$lib/paraglide/runtime.js';

export const init: ClientInit = () => {
	if (getLocaleForUrl(window.location.href) !== baseLocale) return;

	const preferredLocale = extractLocaleFromCookie() ?? extractLocaleFromNavigator() ?? baseLocale;
	if (preferredLocale === baseLocale) return;

	window.location.replace(localizeUrl(window.location.href, { locale: preferredLocale }));
};
