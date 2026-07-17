<script lang="ts">
	import { onDestroy } from 'svelte';
	import {
		deriveGroveProgress,
		LEAVES_PER_TREE
	} from '$lib/features/grove/grove.state';

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

	type Point = { x: number; y: number };
	type Branch = readonly [Point, Point, Point, Point];

	const branches: readonly Branch[] = [
		[{ x: 243, y: 69 }, { x: 229, y: 61 }, { x: 216, y: 52 }, { x: 205, y: 41 }],
		[{ x: 247, y: 58 }, { x: 258, y: 49 }, { x: 269, y: 43 }, { x: 278, y: 36 }],
		[{ x: 241, y: 84 }, { x: 228, y: 78 }, { x: 215, y: 72 }, { x: 203, y: 63 }],
		[{ x: 250, y: 82 }, { x: 262, y: 75 }, { x: 273, y: 67 }, { x: 282, y: 58 }],
		[{ x: 243, y: 49 }, { x: 234, y: 42 }, { x: 226, y: 35 }, { x: 219, y: 27 }]
	] as const;

	function pointOnBranch(branch: Branch, t: number): Point {
		const [start, controlOne, controlTwo, end] = branch;
		const inverse = 1 - t;
		return {
			x:
				inverse ** 3 * start.x +
				3 * inverse ** 2 * t * controlOne.x +
				3 * inverse * t ** 2 * controlTwo.x +
				t ** 3 * end.x,
			y:
				inverse ** 3 * start.y +
				3 * inverse ** 2 * t * controlOne.y +
				3 * inverse * t ** 2 * controlTwo.y +
				t ** 3 * end.y
		};
	}

	function branchDirection(branch: Branch, t: number): Point {
		const [start, controlOne, controlTwo, end] = branch;
		const inverse = 1 - t;
		return {
			x:
				3 * inverse ** 2 * (controlOne.x - start.x) +
				6 * inverse * t * (controlTwo.x - controlOne.x) +
				3 * t ** 2 * (end.x - controlTwo.x),
			y:
				3 * inverse ** 2 * (controlOne.y - start.y) +
				6 * inverse * t * (controlTwo.y - controlOne.y) +
				3 * t ** 2 * (end.y - controlTwo.y)
		};
	}

	// Each completed minute advances one of the five branches. After every
	// five leaves, the next ring starts slightly farther from the trunk.
	const leaves = Array.from({ length: 12 }, (_, ring) =>
		branches.map((branch, branchIndex) => {
			const t = 0.13 + ring * 0.0785;
			const anchor = pointOnBranch(branch, t);
			const direction = branchDirection(branch, t);
			const directionLength = Math.hypot(direction.x, direction.y);
			const side = (ring + branchIndex) % 2 === 0 ? 1 : -1;
			const normal = {
				x: (-direction.y / directionLength) * side,
				y: (direction.x / directionLength) * side
			};
			const distanceFromBranch = 3.8 + ((ring + branchIndex) % 3) * 0.45;
			const scale = 0.78 + ((ring * 2 + branchIndex) % 4) * 0.045;

			return {
				anchor,
				x: anchor.x + normal.x * distanceFromBranch,
				y: anchor.y + normal.y * distanceFromBranch,
				rotation: (Math.atan2(normal.y, normal.x) * 180) / Math.PI,
				scale,
				tone: (ring + branchIndex * 2) % 3
			};
		})
	).flat();

	const backgroundTreePositions = [
		{ x: 92, scale: 0.7 },
		{ x: 145, scale: 0.58 },
		{ x: 48, scale: 0.5 },
		{ x: 18, scale: 0.4 },
		{ x: 184, scale: 0.42 },
		{ x: 120, scale: 0.34 }
	] as const;
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
	let visibleBackgroundTrees = $derived(
		Math.min(backgroundTreePositions.length, displayMatureTrees)
	);
	let treeSummary = $derived(
		`${displayMatureTrees} mature ${displayMatureTrees === 1 ? 'tree' : 'trees'}. Tree ${displayTreeNumber} has ${displayLeaves} of ${LEAVES_PER_TREE} leaves.`
	);
</script>

<section
	class:paused
	class="vignette"
	style={`--light-opacity: ${0.45 + light * 0.004}`}
	aria-label={treeSummary}
>
	<div class="scene">
		<div class="window" aria-hidden="true">
		<div class="sky"></div>
		<div class="sun"></div>
		<svg class="grove" viewBox="0 15 320 105" preserveAspectRatio="xMidYMid meet">
			<path class="distant-ground" d="M0 110 Q58 95 112 108 T220 104 T320 109 V130 H0 Z"></path>
			{#each backgroundTreePositions.slice(0, visibleBackgroundTrees) as tree, index}
				<g class="background-tree" transform={`translate(${tree.x} ${112 - tree.scale * 112}) scale(${tree.scale})`}>
					<path class="background-trunk" d="M0 118 C-2 96 2 80 0 58 C8 77 10 87 9 99 C16 84 21 76 29 70 C21 86 16 101 17 118 Z"></path>
					<path class="background-crown" d="M-34 65 C-42 44 -25 31 -10 34 C-7 16 14 11 25 25 C43 21 55 39 46 54 C55 68 42 82 27 79 C17 92 -2 88 -8 78 C-24 85 -40 77 -34 65 Z"></path>
				</g>
			{/each}

			<g class="current-tree">
				<path class="trunk" d="M236 119 C235 99 239 84 240 66 C241 43 240 31 244 20 C247 34 246 47 248 69 C250 89 251 102 253 119 Z"></path>
				<path class="branch" d="M243 69 C229 61 216 52 205 41 M247 58 C258 49 269 43 278 36 M241 84 C228 78 215 72 203 63 M250 82 C262 75 273 67 282 58 M243 49 C234 42 226 35 219 27"></path>

				{#each leaves as leaf, growthIndex}
					{#if growthIndex < displayLeaves}
						<g
							class:new-leaf={animateGrowth && growthIndex === displayLeaves - 1}
							class="leaf-growth"
							style={`transform-origin: ${leaf.anchor.x}px ${leaf.anchor.y}px`}
						>
							<ellipse
								class={`leaf leaf-tone-${leaf.tone}`}
								cx={leaf.x}
								cy={leaf.y}
								rx={8.2 * leaf.scale}
								ry={5 * leaf.scale}
								transform={`rotate(${leaf.rotation} ${leaf.x} ${leaf.y})`}
							></ellipse>
						</g>
					{/if}
				{/each}

				{#if displayLeaves >= 10}
					<g class="ground-sprout">
						<path d="M285 119 Q281 110 276 106 M285 119 Q289 109 295 105"></path>
						<ellipse cx="276" cy="106" rx="5" ry="2.5" transform="rotate(28 276 106)"></ellipse>
						<ellipse cx="295" cy="105" rx="5" ry="2.5" transform="rotate(-30 295 105)"></ellipse>
					</g>
				{/if}

				{#if displayLeaves >= 25}
					<g class="blossoms">
						<circle cx="218" cy="50" r="2.4"></circle>
						<circle cx="264" cy="47" r="2.1"></circle>
						<circle cx="235" cy="31" r="2.3"></circle>
					</g>
				{/if}

				{#if displayLeaves >= 40}
					<g class="bird" transform="translate(275 65)">
						<path d="M0 1 Q7 -5 13 1 Q8 0 6 6 Q4 2 0 1 Z"></path>
						<circle cx="9" cy="0" r="0.8"></circle>
					</g>
				{/if}
			</g>

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

		<div class="mug" aria-hidden="true">
			<span class="steam steam-one"></span>
			<span class="steam steam-two"></span>
			<span class="handle"></span>
		</div>
		<div class="sill" aria-hidden="true"></div>
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
		background: linear-gradient(165deg, color-mix(in srgb, var(--color-sprout) 20%, var(--color-surface)), var(--color-surface));
		box-shadow: inset 0 -1rem 2rem color-mix(in srgb, var(--color-moss) 5%, transparent);
	}

	.scene {
		position: absolute;
		inset: 0;
		width: min(100%, 22rem);
		margin-inline: auto;
	}

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

	.sun {
		position: absolute;
		top: 0.65rem;
		right: 1.2rem;
		z-index: 1;
		width: 1.15rem;
		height: 1.15rem;
		border-radius: 9999px;
		background: var(--color-sun);
		box-shadow: 0 0 1rem color-mix(in srgb, var(--color-sun) 70%, transparent);
		animation: glow 5s ease-in-out infinite;
	}

	.grove { position: absolute; z-index: 2; inset: 0; width: 100%; height: 100%; overflow: visible; }
	.distant-ground { fill: color-mix(in srgb, var(--color-moss) 22%, var(--color-sprout)); }
	.background-trunk { fill: color-mix(in srgb, var(--color-clay) 58%, var(--color-moss-dark)); }
	.background-crown { fill: color-mix(in srgb, var(--color-moss) 72%, var(--color-sprout)); }
	.trunk { fill: color-mix(in srgb, var(--color-clay) 62%, var(--color-moss-dark)); }
	.branch { fill: none; stroke: color-mix(in srgb, var(--color-clay) 62%, var(--color-moss-dark)); stroke-width: 3.2; stroke-linecap: round; }
	.leaf-growth { transform-box: view-box; }
	.leaf-tone-0 { fill: var(--color-moss); }
	.leaf-tone-1 { fill: var(--color-moss-dark); }
	.leaf-tone-2 { fill: var(--color-moss); opacity: 0.68; }
	.new-leaf { animation: leaf-bloom 900ms cubic-bezier(0.18, 0.9, 0.28, 1.25) both; }
	.ground-sprout path { fill: none; stroke: var(--color-moss); stroke-width: 2; stroke-linecap: round; }
	.ground-sprout ellipse { fill: var(--color-moss); }
	.blossoms circle { fill: color-mix(in srgb, var(--color-clay) 64%, var(--color-sun)); filter: drop-shadow(0 0 2px color-mix(in srgb, var(--color-sun) 65%, transparent)); }
	.bird path { fill: var(--color-clay); }
	.bird circle { fill: var(--color-ink); }
	.light-motes circle { fill: var(--color-sun); animation: mote-rise 1.1s ease-out both; }

	.window-cross { position: absolute; z-index: 4; background: color-mix(in srgb, var(--color-paper) 85%, var(--color-moss)); }
	.window-cross-horizontal { top: 50%; right: 0; left: 0; height: 0.22rem; }
	.window-cross-vertical { top: 0; bottom: 0; left: 50%; width: 0.22rem; }

	.sill {
		position: absolute;
		right: 0.8rem;
		bottom: 0.45rem;
		left: 0.8rem;
		height: 0.65rem;
		border-radius: 9999px 9999px 0.4rem 0.4rem;
		background: color-mix(in srgb, var(--color-moss) 32%, var(--color-paper));
		box-shadow: 0 0.35rem 0.5rem color-mix(in srgb, var(--color-ink) 10%, transparent);
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

	.mug { position: absolute; right: 1.35rem; bottom: 1.05rem; z-index: 7; width: 2.25rem; height: 1.75rem; border-radius: 0.35rem 0.35rem 0.8rem 0.8rem; background: color-mix(in srgb, var(--color-sun) 68%, var(--color-paper)); }
	.handle { position: absolute; top: 0.3rem; right: -0.65rem; width: 0.9rem; height: 0.95rem; border: 0.25rem solid color-mix(in srgb, var(--color-sun) 68%, var(--color-paper)); border-left: 0; border-radius: 0 0.65rem 0.65rem 0; }
	.steam { position: absolute; bottom: 1.8rem; width: 0.45rem; height: 1.35rem; border-left: 0.12rem solid color-mix(in srgb, var(--color-ink-muted) 42%, transparent); border-radius: 50%; animation: steam 4.2s ease-in-out infinite; }
	.steam-one { left: 0.65rem; }
	.steam-two { left: 1.3rem; animation-delay: -2.1s; }
	.paused .steam, .paused .sun { animation-play-state: paused; }

	@keyframes leaf-bloom {
		0% { opacity: 0; scale: 0.05; }
		55% { opacity: 1; scale: 1.28; filter: drop-shadow(0 0 5px var(--color-sun)); }
		100% { scale: 1; filter: none; }
	}

	@keyframes mote-rise {
		0% { opacity: 0; transform: translateY(0.6rem) scale(0.5); }
		45% { opacity: 0.95; }
		100% { opacity: 0; transform: translateY(-1rem) scale(1.25); }
	}

	@keyframes steam {
		0%, 100% { transform: translate3d(0, 0.2rem, 0) rotate(-5deg); opacity: 0; }
		35% { opacity: 0.55; }
		75% { opacity: 0.18; }
		100% { transform: translate3d(0.22rem, -0.5rem, 0) rotate(8deg); }
	}

	@keyframes glow { 50% { transform: scale(1.08); box-shadow: 0 0 1.4rem color-mix(in srgb, var(--color-sun) 78%, transparent); } }

	@media (prefers-reduced-motion: reduce) {
		.sun, .steam, .new-leaf, .light-motes circle { animation: none; }
		.steam { opacity: 0.25; }
		.new-leaf { opacity: 1; scale: 1; }
		.light-motes { display: none; }
	}
</style>
