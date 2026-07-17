<script lang="ts">
	let { visibleCount }: { visibleCount: number } = $props();

	const treePositions = [
		{ x: 92, scale: 0.7 },
		{ x: 145, scale: 0.58 },
		{ x: 48, scale: 0.5 },
		{ x: 18, scale: 0.4 },
		{ x: 184, scale: 0.42 },
		{ x: 120, scale: 0.34 }
	] as const;

</script>

{#each treePositions.slice(0, visibleCount) as tree}
	<g class="background-tree" transform={`translate(${tree.x} ${112 - tree.scale * 112}) scale(${tree.scale})`}>
		<path class="trunk" d="M0 118 C-2 96 2 80 0 58 C8 77 10 87 9 99 C16 84 21 76 29 70 C21 86 16 101 17 118 Z"></path>
		<path class="crown" d="M-34 65 C-42 44 -25 31 -10 34 C-7 16 14 11 25 25 C43 21 55 39 46 54 C55 68 42 82 27 79 C17 92 -2 88 -8 78 C-24 85 -40 77 -34 65 Z"></path>
	</g>
{/each}

<style>
	.trunk { fill: color-mix(in srgb, var(--color-clay) 58%, var(--color-moss-dark)); }
	.crown { fill: color-mix(in srgb, var(--color-moss) 72%, var(--color-sprout)); }
</style>
