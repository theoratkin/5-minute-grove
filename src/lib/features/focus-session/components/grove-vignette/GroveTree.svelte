<script lang="ts">
	import GroveLeaves from './GroveLeaves.svelte';
	import {
		branchDirection,
		branchPath,
		pointOnBranch,
		SAPLING_BRANCHES,
		YOUNG_TREE_BRANCHES,
		FULL_TREE_BRANCHES,
		type Branch
	} from './treeGeometry';

	let { leafCount, animateGrowth = false }: { leafCount: number; animateGrowth?: boolean } = $props();

	type Leaf = { x: number; y: number; rotation: number; scale: number; tone: number };

	const sproutLeaves: Leaf[] = [
		{ x: 238, y: 105, rotation: 18, scale: 0.72, tone: 0 },
		{ x: 250, y: 100, rotation: -20, scale: 0.75, tone: 1 },
		{ x: 238, y: 96, rotation: 14, scale: 0.78, tone: 2 },
		{ x: 250, y: 91, rotation: -18, scale: 0.76, tone: 0 },
		{ x: 244, y: 85, rotation: -82, scale: 0.72, tone: 1 }
	];

	function leavesAcross(branches: readonly Branch[], count: number): Leaf[] {
		return Array.from({ length: count }, (_, index) => {
			const branchIndex = index % branches.length;
			const ring = Math.floor(index / branches.length);
			const branch = branches[branchIndex];
			const rings = Math.ceil(count / branches.length);
			const t = 0.28 + (ring / Math.max(1, rings - 1)) * 0.64;
			const anchor = pointOnBranch(branch, t);
			const direction = branchDirection(branch, t);
			const length = Math.hypot(direction.x, direction.y);
			const side = (ring + branchIndex) % 2 === 0 ? 1 : -1;
			const normal = { x: (-direction.y / length) * side, y: (direction.x / length) * side };
			return {
				x: anchor.x + normal.x * 5,
				y: anchor.y + normal.y * 5,
				rotation: (Math.atan2(normal.y, normal.x) * 180) / Math.PI,
				scale: 0.72 + ((ring + branchIndex) % 3) * 0.055,
				tone: (ring + branchIndex * 2) % 3
			};
		});
	}

	const saplingLeaves = leavesAcross(SAPLING_BRANCHES, 15);
	const youngTreeLeaves = leavesAcross(YOUNG_TREE_BRANCHES, 30);

	function fullTreeScale(count: number): number {
		if (count <= 37) return 0.78;
		if (count <= 45) return 0.88;
		return 1;
	}

	let growthScale = $derived(fullTreeScale(leafCount));
</script>

<g class="current-tree">
	{#if leafCount === 0}
		<path class="green-stem" d="M242.7 119 Q242.5 109 244.8 99 L246.3 119 Z"></path>
	{:else if leafCount <= 5}
		<path class="green-stem" d="M242.2 119 Q242.2 100 245 82 L247 119 Z"></path>
		<g class="stage-leaves">
			{#each sproutLeaves.slice(0, leafCount) as leaf, index}
				<g class:new-leaf={animateGrowth && index === leafCount - 1} class="stage-leaf-growth" style={`transform-origin: ${leaf.x}px ${leaf.y}px`}>
					<ellipse class={`leaf-tone-${leaf.tone}`} cx={leaf.x} cy={leaf.y} rx={7.2 * leaf.scale} ry={4.2 * leaf.scale} transform={`rotate(${leaf.rotation} ${leaf.x} ${leaf.y})`}></ellipse>
				</g>
			{/each}
		</g>
	{:else if leafCount <= 15}
		<path class="stage-trunk" d="M241 119 Q241.5 101 242.5 89 L245.5 89 Q247 101 248 119 Z"></path>
		{#each SAPLING_BRANCHES as branch}
			<path class="stage-branch" d={branchPath(branch)}></path>
		{/each}
		<g class="stage-leaves">
			{#each saplingLeaves.slice(0, leafCount) as leaf, index}
				<g class:new-leaf={animateGrowth && index === leafCount - 1} class="stage-leaf-growth" style={`transform-origin: ${leaf.x}px ${leaf.y}px`}>
					<ellipse class={`leaf-tone-${leaf.tone}`} cx={leaf.x} cy={leaf.y} rx={7.6 * leaf.scale} ry={4.5 * leaf.scale} transform={`rotate(${leaf.rotation} ${leaf.x} ${leaf.y})`}></ellipse>
				</g>
			{/each}
		</g>
	{:else if leafCount <= 30}
		<g class="young-tree">
			<path class="stage-trunk" d="M240 119 Q240.5 95 242.5 83 L245.5 83 Q248 95 249 119 Z"></path>
			{#each YOUNG_TREE_BRANCHES as branch, index}
				<path class:secondary-branch={index >= 2} class="stage-branch" d={branchPath(branch)}></path>
			{/each}
			<g class="stage-leaves">
				{#each youngTreeLeaves.slice(0, leafCount) as leaf, index}
					<g class:new-leaf={animateGrowth && index === leafCount - 1} class="stage-leaf-growth" style={`transform-origin: ${leaf.x}px ${leaf.y}px`}>
						<ellipse class={`leaf-tone-${leaf.tone}`} cx={leaf.x} cy={leaf.y} rx={8 * leaf.scale} ry={4.8 * leaf.scale} transform={`rotate(${leaf.rotation} ${leaf.x} ${leaf.y})`}></ellipse>
					</g>
				{/each}
			</g>
		</g>
	{:else}
		<g class="tree-growth" style={`--tree-scale: ${growthScale}`}>
			<path class="trunk" d="M239 119 C239.5 103 241 89 242 82 L246 82 C248 90 249.5 103 250 119 Z"></path>
			{#each FULL_TREE_BRANCHES as branch, index}
				<path class="branch" class:branch-level-2={index >= 2 && index < 6} class:branch-level-3={index >= 6} d={branchPath(branch)}></path>
			{/each}

			<GroveLeaves count={leafCount} {animateGrowth} />

			<g class="blossoms">
				<circle cx="208" cy="45" r="2.4"></circle>
				<circle cx="268" cy="51" r="2.1"></circle>
				<circle cx="226" cy="33" r="2.3"></circle>
			</g>

			{#if leafCount >= 40}
				<g class="bird" transform="translate(278 32)">
					<path d="M0 1 Q7 -5 13 1 Q8 0 6 6 Q4 2 0 1 Z"></path>
					<circle cx="9" cy="0" r="0.8"></circle>
				</g>
			{/if}
		</g>
	{/if}
</g>

<style>
	.tree-growth {
		transform: scale(var(--tree-scale));
		transform-box: view-box;
		transform-origin: 244px 119px;
		transition: transform 900ms cubic-bezier(0.2, 0.78, 0.24, 1);
	}
	.young-tree {
		transform: scale(0.84);
		transform-box: view-box;
		transform-origin: 244px 119px;
	}
	.green-stem { fill: var(--color-moss); }
	.stage-trunk, .trunk { fill: color-mix(in srgb, var(--color-clay) 62%, var(--color-moss-dark)); }
	.stage-branch, .branch { fill: none; stroke: color-mix(in srgb, var(--color-clay) 62%, var(--color-moss-dark)); stroke-linecap: butt; }
	.stage-branch { stroke-width: 2.8; }
	.branch { stroke-width: 3.2; }
	.secondary-branch, .branch-level-2 { stroke-width: 2.4; }
	.branch-level-3 { stroke-width: 1.7; }
	.stage-leaves .leaf-tone-0 { fill: var(--color-moss); }
	.stage-leaves .leaf-tone-1 { fill: var(--color-moss-dark); }
	.stage-leaves .leaf-tone-2 { fill: var(--color-moss); opacity: 0.68; }
	.stage-leaf-growth { transform-box: view-box; }
	.stage-leaves .new-leaf { animation: leaf-bloom 900ms cubic-bezier(0.18, 0.9, 0.28, 1.25) both; }
	.blossoms circle { fill: color-mix(in srgb, var(--color-clay) 64%, var(--color-sun)); filter: drop-shadow(0 0 2px color-mix(in srgb, var(--color-sun) 65%, transparent)); }
	.bird path { fill: var(--color-clay); }
	.bird circle { fill: var(--color-ink); }

	@keyframes leaf-bloom {
		0% { opacity: 0; scale: 0.05; }
		55% { opacity: 1; scale: 1.28; filter: drop-shadow(0 0 5px var(--color-sun)); }
		100% { scale: 1; filter: none; }
	}

	@media (prefers-reduced-motion: reduce) {
		.tree-growth { transition: none; }
		.stage-leaves .new-leaf { animation: none; opacity: 1; scale: 1; }
	}
</style>
