<script lang="ts">
	import { formatClock } from '$lib/app/time';
	import type { FocusPhase } from '$lib/features/focus-session/focusSession.types';

	let {
		remainingSeconds,
		phase,
		completedContracts
	}: {
		remainingSeconds: number;
		phase: FocusPhase;
		completedContracts: number;
	} = $props();

	let statusText = $derived.by(() => {
		if (phase === 'running') return 'Contract in progress';
		if (phase === 'paused') return 'Contract paused';
		if (phase === 'contract-complete') return 'Contract complete';
		return 'Ready when you are';
	});

	let progress = $derived.by(() => {
		if (phase === 'contract-complete') return 100;
		return Math.round(((300 - remainingSeconds) / 300) * 100);
	});

	const confetti = [
		[4, 0.2, 5.8, -2.7, 8, 'var(--color-sun)'],
		[11, 1.7, 6.7, -3.5, 6, 'var(--color-clay)'],
		[18, 3.1, 5.2, -1.8, 10, 'var(--color-moss)'],
		[25, 0.8, 7.1, -4.2, 5, 'var(--color-sprout)'],
		[33, 2.5, 6.1, -2.2, 9, 'var(--color-sun)'],
		[41, 4.2, 5.5, -3.1, 7, 'var(--color-clay)'],
		[49, 1.1, 6.9, -2.5, 11, 'var(--color-moss)'],
		[57, 3.6, 5.9, -3.8, 6, 'var(--color-sun)'],
		[64, 0.4, 7.3, -2.1, 9, 'var(--color-clay)'],
		[72, 2.2, 5.4, -3.3, 5, 'var(--color-sprout)'],
		[79, 4.6, 6.5, -2.6, 10, 'var(--color-moss)'],
		[86, 1.5, 5.7, -4.1, 7, 'var(--color-sun)'],
		[94, 3.3, 7.0, -2.3, 8, 'var(--color-clay)'],
		[7, 4.8, 6.3, -3.6, 6, 'var(--color-moss)'],
		[21, 1.9, 5.6, -2.4, 11, 'var(--color-sun)'],
		[37, 3.8, 6.8, -3.2, 5, 'var(--color-clay)'],
		[53, 0.6, 5.3, -2.9, 9, 'var(--color-sprout)'],
		[68, 2.9, 7.2, -3.9, 7, 'var(--color-moss)'],
		[83, 4.4, 6.0, -2.0, 10, 'var(--color-sun)']
	] as const;
</script>

<section class="grid gap-5" aria-label="Focus timer">
	<div class="flex items-center justify-between gap-4 text-xs font-extrabold tracking-[0.12em] text-ink-muted uppercase">
		<span>{statusText}</span>
		<span class="rounded-full bg-sprout/60 px-3 py-1 text-moss">{Math.max(0, progress)}%</span>
	</div>

	<div
		class:timer-complete={phase === 'contract-complete'}
		class="relative grid min-h-56 place-items-center overflow-hidden rounded-[1.5rem] border border-moss/10 bg-surface px-4 py-7 font-display text-[clamp(4.5rem,18vw,8rem)] leading-none font-semibold tracking-[-0.065em] text-moss-dark shadow-inner"
		aria-live="polite"
	>
		{#if phase === 'contract-complete'}
			<div class="confetti" aria-hidden="true">
				{#each confetti as piece}
					<span
						style={`--x: ${piece[0]}%; --delay: ${piece[1]}s; --duration: ${piece[2]}s; --drift: ${piece[3]}rem; --rotation: ${piece[4]}deg; --confetti-color: ${piece[5]}`}
					></span>
				{/each}
			</div>
		{/if}
		<span class="relative z-10">{formatClock(remainingSeconds)}</span>
	</div>

	<div class="h-3 overflow-hidden rounded-full bg-mist" aria-hidden="true">
		<div class="h-full rounded-full bg-[linear-gradient(90deg,var(--color-moss),var(--color-moss-dark))] transition-[width] duration-200 ease-out" style={`width: ${Math.max(0, Math.min(100, progress))}%`}></div>
	</div>

</section>

<style>
	.timer-complete {
		background: linear-gradient(145deg, color-mix(in srgb, var(--color-sprout) 45%, var(--color-surface)), var(--color-surface) 62%);
	}

	.confetti {
		position: absolute;
		inset: 0;
		overflow: hidden;
		pointer-events: none;
	}

	.confetti span {
		position: absolute;
		top: -1.5rem;
		left: var(--x);
		width: 0.45rem;
		height: 0.8rem;
		border-radius: 0.12rem;
		background: var(--confetti-color);
		opacity: 0;
		animation: confetti-fall var(--duration) linear var(--delay) infinite;
	}

	@keyframes confetti-fall {
		0% {
			transform: translate3d(0, -1rem, 0) rotate(0deg);
			opacity: 0;
		}

		8% {
			opacity: 0.9;
		}

		100% {
			transform: translate3d(var(--drift), 20rem, 0) rotate(calc(540deg + var(--rotation)));
			opacity: 0.85;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.confetti span {
			animation: none;
			opacity: 0.32;
			transform: translateY(5rem) rotate(var(--rotation));
		}
	}
</style>
