<script lang="ts">
	let { visibleCount }: { visibleCount: number } = $props();

	const treePositions = [
		{ x: 92, scale: 0.7, variant: 'round', tone: 'deep', mirror: false },
		{ x: 145, scale: 0.58, variant: 'tall', tone: 'soft', mirror: true },
		{ x: 48, scale: 0.5, variant: 'wide', tone: 'bright', mirror: false },
		{ x: 18, scale: 0.4, variant: 'tall', tone: 'deep', mirror: false },
		{ x: 184, scale: 0.42, variant: 'round', tone: 'bright', mirror: true },
		{ x: 120, scale: 0.34, variant: 'wide', tone: 'soft', mirror: true }
	] as const;
</script>

{#each treePositions.slice(0, visibleCount) as tree}
	<g
		class={`background-tree tone-${tree.tone}`}
		transform={`translate(${tree.x} ${112 - tree.scale * 112}) scale(${tree.scale})`}
	>
		<g transform={tree.mirror ? 'scale(-1 1)' : undefined}>
			{#if tree.variant === 'round'}
				<path class="trunk" d="M0 118 C-2 96 2 80 0 58 C8 77 10 87 9 99 C16 84 21 76 29 70 C21 86 16 101 17 118 Z"></path>
				<path class="crown" d="M-34 65 C-42 44 -25 31 -10 34 C-7 16 14 11 25 25 C43 21 55 39 46 54 C55 68 42 82 27 79 C17 92 -2 88 -8 78 C-24 85 -40 77 -34 65 Z"></path>
			{:else if tree.variant === 'tall'}
				<path class="trunk" d="M-3 118 C0 98 1 76 8 55 C9 76 8 94 11 118 Z"></path>
				<path class="crown" d="M-23 69 C-31 56 -24 43 -14 39 C-20 26 -9 15 2 16 C5 2 21 -2 28 12 C42 14 47 27 39 37 C50 46 46 61 34 65 C34 80 18 87 8 78 C-4 87 -20 81 -23 69 Z"></path>
			{:else}
				<path class="trunk" d="M-1 118 C0 98 4 82 8 65 C12 80 11 98 13 118 Z M7 88 C1 78 -7 71 -17 66 C-7 67 3 73 10 80 Z"></path>
				<path class="crown" d="M-45 64 C-48 50 -34 42 -23 44 C-19 31 -3 27 7 35 C17 22 35 28 37 40 C52 39 60 52 53 63 C48 73 34 75 25 70 C15 82 -2 79 -8 71 C-20 80 -39 76 -45 64 Z"></path>
			{/if}
		</g>
	</g>
{/each}

<style>
	.trunk { fill: color-mix(in srgb, var(--color-clay) 58%, var(--color-moss-dark)); }
	.crown { fill: color-mix(in srgb, var(--color-moss) 72%, var(--color-sprout)); }
	.tone-deep .crown { fill: color-mix(in srgb, var(--color-moss-dark) 38%, var(--color-moss)); }
	.tone-bright .crown { fill: color-mix(in srgb, var(--color-moss) 58%, var(--color-sprout)); }
	.tone-soft .crown { fill: color-mix(in srgb, var(--color-moss) 66%, var(--color-sprout)); }
</style>
