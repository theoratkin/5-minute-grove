import { browser } from '$app/environment';
import { storageKey } from './storage';

export const themes = [
	{ id: 'soft-daylight', label: 'Soft daylight', swatches: ['#fbfaf5', '#315e4c', '#f4c96b'] },
	{ id: 'cozy-light', label: 'Warm linen', swatches: ['#f5f0e4', '#75552d', '#d99c43'] },
	{ id: 'cozy-dark', label: 'Cocoa night', swatches: ['#24201f', '#d6ae68', '#dc9589'] },
	{ id: 'quiet-night', label: 'Quiet night', swatches: ['#202725', '#739b86', '#d1ad72'] },
	{ id: 'gruvbox-dark', label: 'Gruvbox Dark', swatches: ['#282828', '#b8bb26', '#fabd2f'] }
] as const;

export type ThemeId = (typeof themes)[number]['id'];

const THEME_KEY = storageKey('theme');
const defaultTheme: ThemeId = 'soft-daylight';

function isThemeId(value: string | null): value is ThemeId {
	return themes.some((theme) => theme.id === value);
}

export function loadTheme(): ThemeId {
	if (!browser) return defaultTheme;

	const savedTheme = localStorage.getItem(THEME_KEY);
	return isThemeId(savedTheme) ? savedTheme : defaultTheme;
}

export function applyTheme(theme: ThemeId): void {
	if (!browser) return;

	document.documentElement.dataset.theme = theme;
	localStorage.setItem(THEME_KEY, theme);
}
