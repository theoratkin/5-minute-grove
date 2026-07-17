<script lang="ts">
	import GroveBackgroundTrees from './GroveBackgroundTrees.svelte';
	import GroveSun from './GroveSun.svelte';
	import GroveTree from './GroveTree.svelte';

	let {
		matureTreeCount,
		leafCount,
		animateGrowth = false,
		maturing = false,
		paused = false
	}: {
		matureTreeCount: number;
		leafCount: number;
		animateGrowth?: boolean;
		maturing?: boolean;
		paused?: boolean;
	} = $props();

</script>

<div class="window" aria-hidden="true">
	<div class="sky"></div>
	<GroveSun {paused} />
	<svg class="grove" viewBox="0 15 320 105" preserveAspectRatio="xMidYMid meet">
		<path class="distant-ground" d="M0 110 Q58 95 112 108 T220 104 T320 109 V130 H0 Z"></path>
		<GroveBackgroundTrees visibleCount={matureTreeCount} />
		<GroveTree {animateGrowth} {leafCount} />

		{#if maturing}
			<g class="light-motes">
				<circle cx="205" cy="29" r="1.7"></circle>
				<circle cx="278" cy="42" r="1.3"></circle>
				<circle cx="219" cy="78" r="1.4"></circle>
				<circle cx="291" cy="72" r="1.8"></circle>
			</g>
		{/if}
	</svg>
	<div class="window-cross window-cross-horizontal"></div>
	<div class="window-cross window-cross-vertical"></div>
</div>

<style>
	.window {
		position: absolute;
		top: 0.65rem;
		right: 1rem;
		bottom: 1.25rem;
		left: 1rem;
		overflow: hidden;
		border: 0.32rem solid color-mix(in srgb, var(--color-paper) 85%, var(--color-moss));
		border-radius: 2.8rem 2.8rem 0.65rem 0.65rem;
		box-shadow: 0 0.35rem 0.8rem color-mix(in srgb, var(--color-ink) 9%, transparent);
	}

	.sky {
		position: absolute;
		inset: 0;
		background: linear-gradient(155deg, color-mix(in srgb, var(--color-sun) 42%, var(--color-surface)), color-mix(in srgb, var(--color-sprout) 48%, var(--color-surface)));
		opacity: var(--light-opacity);
		transition: opacity 1s ease;
	}

	.grove { position: absolute; z-index: 2; inset: 0; width: 100%; height: 100%; overflow: visible; }
	.distant-ground { fill: color-mix(in srgb, var(--color-moss) 22%, var(--color-sprout)); }
	.light-motes circle { fill: var(--color-sun); animation: mote-rise 1.1s ease-out both; }
	.window-cross { position: absolute; z-index: 4; background: color-mix(in srgb, var(--color-paper) 85%, var(--color-moss)); }
	.window-cross-horizontal { top: 50%; right: 0; left: 0; height: 0.22rem; }
	.window-cross-vertical { top: 0; bottom: 0; left: 50%; width: 0.22rem; }

	@keyframes mote-rise {
		0% { opacity: 0; transform: translateY(0.6rem) scale(0.5); }
		45% { opacity: 0.95; }
		100% { opacity: 0; transform: translateY(-1rem) scale(1.25); }
	}

	@media (prefers-reduced-motion: reduce) {
		.light-motes { display: none; }
	}
</style>
