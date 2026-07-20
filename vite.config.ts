import { paraglideVitePlugin } from '@inlang/paraglide-js';
import adapter from '@sveltejs/adapter-static';
import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

const localizedPrerenderEntries = [
	'es',
	'pt-BR',
	'fr',
	'de',
	'zh-CN',
	'ja',
	'ko',
	'id',
	'ru'
].flatMap((locale) => [`/${locale}/`, `/${locale}/about/`] as const);

export default defineConfig({
	plugins: [
		paraglideVitePlugin({
			project: './project.inlang',
			outdir: './src/lib/paraglide',
			emitTsDeclarations: true,
			strategy: ['url', 'cookie', 'preferredLanguage', 'baseLocale']
		}),
		tailwindcss(),
			sveltekit({
			compilerOptions: {
				// Force runes mode for the project, except for libraries. Can be removed in svelte 6.
				runes: ({ filename }) =>
					filename.split(/[/\\]/).includes('node_modules') ? undefined : true
			},

			adapter: adapter({
				fallback: '404.html'
			}),
			prerender: {
				entries: ['*', ...localizedPrerenderEntries]
			}
		})
	]
});
