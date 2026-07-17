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

<div class="landscape" aria-hidden="true">
	<div class="sky"></div>
	<GroveSun {paused} />
	<svg class="terrain" viewBox="0 0 320 130" preserveAspectRatio="none">
		<path class="distant-ground" d="M0 110 Q58 95 112 108 T220 104 T320 109 V130 H0 Z"></path>
		<path class="near-ground" d="M0 116 Q72 108 139 116 T267 111 T320 115 V130 H0 Z"></path>
	</svg>
	<svg class="grove" viewBox="0 0 320 125" preserveAspectRatio="xMidYMax meet">
		<g class="background-grove">
			<GroveBackgroundTrees visibleCount={matureTreeCount} />
		</g>
		<g class="foreground-tree">
			<GroveTree {animateGrowth} {leafCount} />

			{#if maturing}
				<g class="light-motes">
					<circle cx="205" cy="29" r="1.7"></circle>
					<circle cx="278" cy="42" r="1.3"></circle>
					<circle cx="219" cy="78" r="1.4"></circle>
					<circle cx="291" cy="72" r="1.8"></circle>
				</g>
			{/if}
		</g>
	</svg>
</div>

<style>
	.landscape {
		position: absolute;
		inset: 0;
		overflow: hidden;
		border-radius: inherit;
	}

	.sky {
		position: absolute;
		inset: 0;
		background: linear-gradient(155deg, color-mix(in srgb, var(--color-sun) 42%, var(--color-surface)), color-mix(in srgb, var(--color-sprout) 48%, var(--color-surface)));
		opacity: var(--light-opacity);
		transition: opacity 1s ease;
	}

	.terrain, .grove { position: absolute; inset: 0; width: 100%; height: 100%; }
	.terrain { z-index: 1; }
	.grove { z-index: 2; overflow: visible; }
	.distant-ground { fill: color-mix(in srgb, var(--color-moss) 22%, var(--color-sprout)); }
	.near-ground { fill: color-mix(in srgb, var(--color-moss) 38%, var(--color-sprout)); opacity: 0.72; }
	.light-motes circle { fill: var(--color-sun); animation: mote-rise 1.1s ease-out both; }

	@media (min-width: 640px) {
		.foreground-tree { transform: translateX(20px); }
		.background-grove { transform: translateX(-16px); }
	}

	@keyframes mote-rise {
		0% { opacity: 0; transform: translateY(0.6rem) scale(0.5); }
		45% { opacity: 0.95; }
		100% { opacity: 0; transform: translateY(-1rem) scale(1.25); }
	}

	@media (prefers-reduced-motion: reduce) {
		.light-motes { display: none; }
	}
</style>
