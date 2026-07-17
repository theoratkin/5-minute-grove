<script lang="ts">
	import GroveLeaves from './GroveLeaves.svelte';

	let { leafCount, animateGrowth = false }: { leafCount: number; animateGrowth?: boolean } = $props();

	type Point = { x: number; y: number };
	type Leaf = Point & { rotation: number; scale: number; tone: number };
	type GrowthLine = { start: Point; end: Point; leaves: number };

	const sproutLeaves: Leaf[] = [
		{ x: 238, y: 105, rotation: 18, scale: 0.72, tone: 0 },
		{ x: 250, y: 100, rotation: -20, scale: 0.75, tone: 1 },
		{ x: 238, y: 96, rotation: 14, scale: 0.78, tone: 2 },
		{ x: 250, y: 91, rotation: -18, scale: 0.76, tone: 0 },
		{ x: 244, y: 85, rotation: -82, scale: 0.72, tone: 1 }
	];

	function leavesAlong(lines: GrowthLine[]): Leaf[] {
		return lines.flatMap((line, lineIndex) => {
			const dx = line.end.x - line.start.x;
			const dy = line.end.y - line.start.y;
			const length = Math.hypot(dx, dy);
			return Array.from({ length: line.leaves }, (_, index) => {
				const t = 0.18 + (index / Math.max(1, line.leaves - 1)) * 0.78;
				const side = (index + lineIndex) % 2 === 0 ? 1 : -1;
				const normal = { x: (-dy / length) * side, y: (dx / length) * side };
				return {
					x: line.start.x + dx * t + normal.x * 5,
					y: line.start.y + dy * t + normal.y * 5,
					rotation: (Math.atan2(normal.y, normal.x) * 180) / Math.PI,
					scale: 0.72 + ((index + lineIndex) % 3) * 0.055,
					tone: (index + lineIndex * 2) % 3
				};
			});
		});
	}

	const saplingLeaves = leavesAlong([
		{ start: { x: 244, y: 111 }, end: { x: 244, y: 66 }, leaves: 9 },
		{ start: { x: 244, y: 91 }, end: { x: 267, y: 75 }, leaves: 6 }
	]);

	const youngTreeLeaves = leavesAlong([
		{ start: { x: 244, y: 108 }, end: { x: 244, y: 38 }, leaves: 10 },
		{ start: { x: 243, y: 88 }, end: { x: 213, y: 69 }, leaves: 7 },
		{ start: { x: 245, y: 70 }, end: { x: 274, y: 50 }, leaves: 7 },
		{ start: { x: 243, y: 56 }, end: { x: 221, y: 39 }, leaves: 6 }
	]);

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
				<ellipse class:new-leaf={animateGrowth && index === leafCount - 1} class={`leaf-tone-${leaf.tone}`} cx={leaf.x} cy={leaf.y} rx={7.2 * leaf.scale} ry={4.2 * leaf.scale} transform={`rotate(${leaf.rotation} ${leaf.x} ${leaf.y})`}></ellipse>
			{/each}
		</g>
	{:else if leafCount <= 15}
		<path class="stage-trunk" d="M240.5 119 Q241 91 244 63 Q247 91 248.5 119 Z"></path>
		<path class="stage-branch" d="M244 91 Q254 84 267 75"></path>
		<g class="stage-leaves">
			{#each saplingLeaves.slice(0, leafCount) as leaf, index}
				<ellipse class:new-leaf={animateGrowth && index === leafCount - 1} class={`leaf-tone-${leaf.tone}`} cx={leaf.x} cy={leaf.y} rx={7.6 * leaf.scale} ry={4.5 * leaf.scale} transform={`rotate(${leaf.rotation} ${leaf.x} ${leaf.y})`}></ellipse>
			{/each}
		</g>
	{:else if leafCount <= 30}
		<g class="young-tree">
			<path class="stage-trunk" d="M239 119 Q240 75 244 35 Q248 76 250 119 Z"></path>
			<path class="stage-branch" d="M243 88 Q228 80 213 69 M245 70 Q259 61 274 50 M243 56 Q232 48 221 39"></path>
			<g class="stage-leaves">
				{#each youngTreeLeaves.slice(0, leafCount) as leaf, index}
					<ellipse class:new-leaf={animateGrowth && index === leafCount - 1} class={`leaf-tone-${leaf.tone}`} cx={leaf.x} cy={leaf.y} rx={8 * leaf.scale} ry={4.8 * leaf.scale} transform={`rotate(${leaf.rotation} ${leaf.x} ${leaf.y})`}></ellipse>
				{/each}
			</g>
		</g>
	{:else}
		<g class="tree-growth" style={`--tree-scale: ${growthScale}`}>
			<path class="trunk" d="M236 119 C235 99 239 84 240 66 C241 43 240 31 244 20 C247 34 246 47 248 69 C250 89 251 102 253 119 Z"></path>
			<path class="branch" d="M243 69 C229 61 216 52 205 41 M247 58 C258 49 269 43 278 36 M241 84 C228 78 215 72 203 63 M250 82 C262 75 273 67 282 58 M243 49 C234 42 226 35 219 27"></path>

			<GroveLeaves count={leafCount} {animateGrowth} />

			<g class="blossoms">
				<circle cx="218" cy="50" r="2.4"></circle>
				<circle cx="264" cy="47" r="2.1"></circle>
				<circle cx="235" cy="31" r="2.3"></circle>
			</g>

			{#if leafCount >= 40}
				<g class="bird" transform="translate(275 65)">
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
	.stage-leaves .leaf-tone-0 { fill: var(--color-moss); }
	.stage-leaves .leaf-tone-1 { fill: var(--color-moss-dark); }
	.stage-leaves .leaf-tone-2 { fill: var(--color-moss); opacity: 0.68; }
	.stage-leaves .new-leaf { animation: leaf-bloom 900ms cubic-bezier(0.18, 0.9, 0.28, 1.25) both; transform-box: fill-box; transform-origin: center; }
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
