<script lang="ts">
	import favicon from '$lib/assets/favicon.svg';
	import '$lib/styles/tokens.css';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<div id="button-splash-background" class="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden="true"></div>

{@render children()}
