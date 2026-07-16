import { browser } from '$app/environment';

export const themes = [
	{ id: 'soft-daylight', label: 'Soft daylight' },
	{ id: 'cozy-light', label: 'Warm linen' },
	{ id: 'cozy-dark', label: 'Cocoa night' },
	{ id: 'quiet-night', label: 'Quiet night' },
	{ id: 'gruvbox-dark', label: 'Gruvbox Dark' }
] as const;

export type ThemeId = (typeof themes)[number]['id'];

const storageKey = 'just-5-more-minutes:theme';
const defaultTheme: ThemeId = 'soft-daylight';

function isThemeId(value: string | null): value is ThemeId {
	return themes.some((theme) => theme.id === value);
}

export function loadTheme(): ThemeId {
	if (!browser) return defaultTheme;

	const savedTheme = localStorage.getItem(storageKey);
	return isThemeId(savedTheme) ? savedTheme : defaultTheme;
}

export function applyTheme(theme: ThemeId): void {
	if (!browser) return;

	document.documentElement.dataset.theme = theme;
	localStorage.setItem(storageKey, theme);
}
