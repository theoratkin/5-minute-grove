import { browser } from '$app/environment';
import { storageKey } from './storage';
import * as m from '$lib/paraglide/messages.js';

export const themes = [
	{ id: 'soft-daylight', label: m.theme_soft_daylight, swatches: ['#fbfaf5', '#315e4c', '#f4c96b'] },
	{ id: 'cozy-light', label: m.theme_cozy_light, swatches: ['#f5f0e4', '#75552d', '#d99c43'] },
	{ id: 'cozy-dark', label: m.theme_cozy_dark, swatches: ['#24201f', '#d6ae68', '#dc9589'] },
	{ id: 'quiet-night', label: m.theme_quiet_night, swatches: ['#202725', '#739b86', '#d1ad72'] },
	{ id: 'gruvbox-dark', label: m.theme_gruvbox_dark, swatches: ['#282828', '#b8bb26', '#fabd2f'] }
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
