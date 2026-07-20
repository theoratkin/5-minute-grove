import { browser } from '$app/environment';
import { storageKey } from './storage';
import * as m from '$lib/paraglide/messages.js';

export const themes = [
	{ id: 'soft-daylight', label: m.theme_soft_daylight, swatches: ['#fbfaf5', '#315e4c', '#f4c96b'] },
	{ id: 'quiet-night', label: m.theme_quiet_night, swatches: ['#202725', '#739b86', '#d1ad72'] },
	{ id: 'cozy-light', label: m.theme_cozy_light, swatches: ['#f5f0e4', '#75552d', '#d99c43'] },
	{ id: 'cozy-dark', label: m.theme_cozy_dark, swatches: ['#24201f', '#d6ae68', '#dc9589'] },
	{ id: 'catppuccin-latte', label: m.theme_catppuccin_latte, swatches: ['#eff1f5', '#347823', '#fe640b'] },
	{ id: 'catppuccin-mocha', label: m.theme_catppuccin_mocha, swatches: ['#1e1e2e', '#a6e3a1', '#fab387'] },
	{ id: 'gruvbox-dark', label: m.theme_gruvbox_dark, swatches: ['#282828', '#b8bb26', '#fabd2f'] },
	{ id: 'gruvbox-light', label: m.theme_gruvbox_light, swatches: ['#fbf1c7', '#75700e', '#d79921'] },
	{ id: 'monokai', label: m.theme_monokai, swatches: ['#272822', '#a6e22e', '#f92672'] },
	{ id: 'rose-pine', label: m.theme_rose_pine, swatches: ['#191724', '#9ccfd8', '#eb6f92'] },
	{ id: 'tokyo-night', label: m.theme_tokyo_night, swatches: ['#1a1b26', '#9ece6a', '#7dcfff'] }
] as const;

export type ThemeId = (typeof themes)[number]['id'];
export type ThemePreference = ThemeId | 'auto';

const THEME_KEY = storageKey('theme');
const defaultTheme: ThemePreference = 'auto';
const defaultLightTheme: ThemeId = 'soft-daylight';
const defaultDarkTheme: ThemeId = 'quiet-night';

function isThemeId(value: string | null): value is ThemeId {
	return themes.some((theme) => theme.id === value);
}

export function loadTheme(): ThemePreference {
	if (!browser) return defaultTheme;

	const savedTheme = localStorage.getItem(THEME_KEY);
	return savedTheme === 'auto' || isThemeId(savedTheme) ? savedTheme : defaultTheme;
}

export function applyTheme(theme: ThemePreference): void {
	if (!browser) return;

	const resolvedTheme =
		theme === 'auto'
			? window.matchMedia('(prefers-color-scheme: dark)').matches
				? defaultDarkTheme
				: defaultLightTheme
			: theme;

	document.documentElement.dataset.theme = resolvedTheme;
	localStorage.setItem(THEME_KEY, theme);
}

export function watchPreferredColorScheme(onchange: () => void): () => void {
	if (!browser) return () => {};

	const preference = window.matchMedia('(prefers-color-scheme: dark)');
	preference.addEventListener('change', onchange);
	return () => preference.removeEventListener('change', onchange);
}
