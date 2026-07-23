<script lang="ts">
	const pieces = [
		[4, 0.2, 5.8, -2.7, 8, 'var(--color-sun)'], [11, 1.7, 6.7, -3.5, 6, 'var(--color-clay)'],
		[18, 3.1, 5.2, -1.8, 10, 'var(--color-moss)'], [25, 0.8, 7.1, -4.2, 5, 'var(--color-sprout)'],
		[33, 2.5, 6.1, -2.2, 9, 'var(--color-sun)'], [41, 4.2, 5.5, -3.1, 7, 'var(--color-clay)'],
		[49, 1.1, 6.9, -2.5, 11, 'var(--color-moss)'], [57, 3.6, 5.9, -3.8, 6, 'var(--color-sun)'],
		[64, 0.4, 7.3, -2.1, 9, 'var(--color-clay)'], [72, 2.2, 5.4, -3.3, 5, 'var(--color-sprout)'],
		[79, 4.6, 6.5, -2.6, 10, 'var(--color-moss)'], [86, 1.5, 5.7, -4.1, 7, 'var(--color-sun)'],
		[94, 3.3, 7.0, -2.3, 8, 'var(--color-clay)'], [7, 4.8, 6.3, -3.6, 6, 'var(--color-moss)'],
		[21, 1.9, 5.6, -2.4, 11, 'var(--color-sun)'], [37, 3.8, 6.8, -3.2, 5, 'var(--color-clay)'],
		[53, 0.6, 5.3, -2.9, 9, 'var(--color-sprout)'], [68, 2.9, 7.2, -3.9, 7, 'var(--color-moss)'],
		[83, 4.4, 6.0, -2.0, 10, 'var(--color-sun)']
	] as const;
</script>

<div class="confetti" aria-hidden="true">
	{#each pieces as piece}
		<span style={`--x: ${piece[0]}%; --delay: ${piece[1]}s; --duration: ${piece[2]}s; --drift: ${piece[3]}rem; --rotation: ${piece[4]}deg; --confetti-color: ${piece[5]}`}></span>
	{/each}
</div>

<style>
	.confetti { position: absolute; z-index: 0; inset: 0; overflow: hidden; pointer-events: none; }
	.confetti span { position: absolute; top: -1.5rem; left: var(--x); width: 0.45rem; height: 0.8rem; border-radius: 0.12rem; background: var(--confetti-color); opacity: 0; animation: confetti-fall var(--duration) linear var(--delay) infinite; }
	@keyframes confetti-fall {
		0% { top: -1.5rem; transform: translate3d(0, 0, 0) rotate(0deg); opacity: 0; }
		8% { opacity: 0.9; }
		100% { top: calc(100% + 1.5rem); transform: translate3d(var(--drift), 0, 0) rotate(calc(540deg + var(--rotation))); opacity: 0.85; }
	}
	@media (prefers-reduced-motion: reduce) {
		.confetti span { animation: none; opacity: 0.32; transform: translateY(5rem) rotate(var(--rotation)); }
	}
</style>
