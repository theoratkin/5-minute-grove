<script lang="ts">
	import { onMount } from 'svelte';
	import favicon from '$lib/assets/favicon.svg';
	import GlobalHeader from '$lib/app/GlobalHeader.svelte';
	import { applyTheme, loadTheme, type ThemeId } from '$lib/app/theme';
	import '$lib/styles/tokens.css';
	import '@phosphor-icons/web/bold';
	import '@phosphor-icons/web/fill';

	let { children } = $props();
	let theme = $state<ThemeId>('soft-daylight');

	onMount(() => {
		theme = loadTheme();
		applyTheme(theme);
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

<GlobalHeader {theme} onThemeChange={changeTheme} />
{@render children()}
