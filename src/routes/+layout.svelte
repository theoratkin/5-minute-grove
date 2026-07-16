<script lang="ts">
	import { onMount } from 'svelte';
	import favicon from '$lib/assets/favicon.svg';
	import GlobalHeader from '$lib/app/GlobalHeader.svelte';
	import { applyTheme, loadTheme, type ThemeId } from '$lib/app/theme';
	import { AppPreferences, providePreferences } from '$lib/app/preferences.svelte';
	import '$lib/styles/tokens.css';
	import '@phosphor-icons/web/bold';
	import '@phosphor-icons/web/fill';

	let { children } = $props();
	let theme = $state<ThemeId>('soft-daylight');
	const preferences = new AppPreferences();
	providePreferences(preferences);

	onMount(() => {
		theme = loadTheme();
		applyTheme(theme);
		preferences.load();
	});

	function changeTheme(nextTheme: ThemeId) {
		theme = nextTheme;
		applyTheme(theme);
	}
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<div id="button-splash-background" class="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden="true"></div>

<GlobalHeader {theme} {preferences} onThemeChange={changeTheme} />
{@render children()}

<footer class="relative z-10 mx-auto w-full max-w-6xl px-4 pb-6 text-center text-xs sm:px-6 lg:px-8">
	<p class="inline-block rounded-full border border-surface/90 bg-paper/95 px-4 py-2 text-ink-muted shadow-sm backdrop-blur">
		by Theo Ratkin (<a
			class="font-semibold text-ink transition hover:text-moss focus-visible:text-moss"
			href="https://theoratkin.com"
		>theoratkin.com</a>)
	</p>
</footer>
