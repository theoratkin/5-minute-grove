<script lang="ts">
	import { onDestroy } from 'svelte';
	import {
		deriveGroveProgress,
		LEAVES_PER_TREE
	} from '$lib/features/grove/grove.state';
	import GroveLandscape from './grove-vignette/GroveLandscape.svelte';
	import * as m from '$lib/paraglide/messages.js';

	let {
		progress,
		totalLeaves,
		settledMatureTreeCount,
		growthToken,
		paused = false
	}: {
		progress: number;
		totalLeaves: number;
		settledMatureTreeCount: number;
		growthToken: number;
		paused?: boolean;
	} = $props();

	let observedGrowthToken = $state(0);
	let animateGrowth = $state(false);
	let maturing = $state(false);
	let growthTimeout: ReturnType<typeof setTimeout> | undefined;

	$effect(() => {
		if (growthToken <= 0 || growthToken === observedGrowthToken) return;
		observedGrowthToken = growthToken;
		animateGrowth = true;
		maturing = totalLeaves > 0 && totalLeaves % LEAVES_PER_TREE === 0;
		if (growthTimeout) clearTimeout(growthTimeout);
		growthTimeout = setTimeout(() => {
			animateGrowth = false;
			maturing = false;
		}, 1200);
	});

	onDestroy(() => {
		if (growthTimeout) clearTimeout(growthTimeout);
	});

	let light = $derived(Math.max(0, Math.min(100, progress)));
	let groveProgress = $derived(deriveGroveProgress(totalLeaves, settledMatureTreeCount));
	let displayMatureTrees = $derived(groveProgress.matureTreeCount);
	let displayTreeNumber = $derived(groveProgress.currentTreeNumber);
	let displayLeaves = $derived(groveProgress.currentTreeLeaves);
	let treeSummary = $derived(
		displayMatureTrees === 1
			? m.grove_tree_summary_one({ matureTrees: displayMatureTrees, treeNumber: displayTreeNumber, leaves: displayLeaves, leafLimit: LEAVES_PER_TREE })
			: m.grove_tree_summary_other({ matureTrees: displayMatureTrees, treeNumber: displayTreeNumber, leaves: displayLeaves, leafLimit: LEAVES_PER_TREE })
	);
</script>

<section
	class="vignette"
	style={`--light-opacity: ${0.45 + light * 0.004}`}
	aria-label={treeSummary}
>
	<div class="scene">
		<GroveLandscape
			matureTreeCount={displayMatureTrees}
			leafCount={displayLeaves}
			{animateGrowth}
			{maturing}
			{paused}
		/>
	</div>
	<div class="grove-count" aria-hidden="true">
		<span><i class="ph-fill ph-tree-evergreen"></i>{displayMatureTrees}</span>
		<span><i class="ph-fill ph-leaf"></i>{displayLeaves}/{LEAVES_PER_TREE}</span>
	</div>
</section>

<style>
	.vignette {
		position: relative;
		height: 8.5rem;
		overflow: hidden;
		border: 1px solid color-mix(in srgb, var(--color-moss) 12%, transparent);
		border-radius: 1.3rem 2.4rem 1.15rem 2rem;
		background: color-mix(in srgb, var(--color-sprout) 30%, var(--color-surface));
		box-shadow: inset 0 -1rem 2rem color-mix(in srgb, var(--color-moss) 8%, transparent);
	}

	.scene {
		position: absolute;
		inset: 0;
	}

	.grove-count {
		position: absolute;
		top: 1.15rem;
		left: 1.45rem;
		z-index: 6;
		display: flex;
		align-items: center;
		gap: 0.65rem;
		border: 1px solid color-mix(in srgb, var(--color-moss) 14%, transparent);
		border-radius: 0.8rem 1rem 0.85rem 1.1rem;
		padding: 0.4rem 0.6rem;
		color: var(--color-moss-dark);
		background: color-mix(in srgb, var(--color-paper) 82%, transparent);
		box-shadow: 0 0.25rem 0.7rem color-mix(in srgb, var(--color-ink) 7%, transparent);
		backdrop-filter: blur(5px);
	}

	.grove-count > span { display: flex; align-items: center; gap: 0.2rem; font-size: 0.68rem; font-weight: 800; }
	.grove-count i { font-size: 0.78rem; color: var(--color-moss); }

</style>
