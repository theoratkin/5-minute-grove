import { locales, type Locale } from '$lib/paraglide/runtime.js';

const nativeLanguageNames: Record<Locale, string> = {
	en: 'English',
	es: 'Español',
	'pt-BR': 'Português (Brasil)',
	fr: 'Français',
	de: 'Deutsch',
	'zh-CN': '简体中文',
	ja: '日本語',
	ko: '한국어',
	id: 'Bahasa Indonesia',
	ru: 'Русский'
};

export const languageOptions = locales.map((code) => ({
	code,
	label: nativeLanguageNames[code]
}));
