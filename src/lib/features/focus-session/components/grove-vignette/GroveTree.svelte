<script lang="ts">
	import GroveLeaves from './GroveLeaves.svelte';

	let { leafCount, animateGrowth = false }: { leafCount: number; animateGrowth?: boolean } = $props();
</script>

<g class="current-tree">
	<path class="trunk" d="M236 119 C235 99 239 84 240 66 C241 43 240 31 244 20 C247 34 246 47 248 69 C250 89 251 102 253 119 Z"></path>
	<path class="branch" d="M243 69 C229 61 216 52 205 41 M247 58 C258 49 269 43 278 36 M241 84 C228 78 215 72 203 63 M250 82 C262 75 273 67 282 58 M243 49 C234 42 226 35 219 27"></path>

	<GroveLeaves count={leafCount} {animateGrowth} />

	{#if leafCount >= 10}
		<g class="ground-sprout">
			<path d="M285 119 Q281 110 276 106 M285 119 Q289 109 295 105"></path>
			<ellipse cx="276" cy="106" rx="5" ry="2.5" transform="rotate(28 276 106)"></ellipse>
			<ellipse cx="295" cy="105" rx="5" ry="2.5" transform="rotate(-30 295 105)"></ellipse>
		</g>
	{/if}

	{#if leafCount >= 25}
		<g class="blossoms">
			<circle cx="218" cy="50" r="2.4"></circle>
			<circle cx="264" cy="47" r="2.1"></circle>
			<circle cx="235" cy="31" r="2.3"></circle>
		</g>
	{/if}

	{#if leafCount >= 40}
		<g class="bird" transform="translate(275 65)">
			<path d="M0 1 Q7 -5 13 1 Q8 0 6 6 Q4 2 0 1 Z"></path>
			<circle cx="9" cy="0" r="0.8"></circle>
		</g>
	{/if}
</g>

<style>
	.trunk { fill: color-mix(in srgb, var(--color-clay) 62%, var(--color-moss-dark)); }
	.branch { fill: none; stroke: color-mix(in srgb, var(--color-clay) 62%, var(--color-moss-dark)); stroke-width: 3.2; stroke-linecap: round; }
	.ground-sprout path { fill: none; stroke: var(--color-moss); stroke-width: 2; stroke-linecap: round; }
	.ground-sprout ellipse { fill: var(--color-moss); }
	.blossoms circle { fill: color-mix(in srgb, var(--color-clay) 64%, var(--color-sun)); filter: drop-shadow(0 0 2px color-mix(in srgb, var(--color-sun) 65%, transparent)); }
	.bird path { fill: var(--color-clay); }
	.bird circle { fill: var(--color-ink); }
</style>
