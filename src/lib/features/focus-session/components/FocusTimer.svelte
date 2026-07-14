<script lang="ts">
	import { formatClock } from '$lib/app/time';
	import type { FocusPhase } from '$lib/features/focus-session/focusSession.types';

	let {
		remainingSeconds,
		phase,
		completedContracts,
		extensionCount,
		totalTimeSeconds
	}: {
		remainingSeconds: number;
		phase: FocusPhase;
		completedContracts: number;
		extensionCount: number;
		totalTimeSeconds: number;
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
</script>

<section class="grid gap-5" aria-label="Focus timer">
	<div class="flex items-center justify-between gap-4 text-xs font-extrabold tracking-[0.12em] text-ink-muted uppercase">
		<span>{statusText}</span>
		<span class="rounded-full bg-sprout/60 px-3 py-1 text-moss">{Math.max(0, progress)}%</span>
	</div>

	<div class="grid min-h-56 place-items-center rounded-[1.5rem] border border-moss/10 bg-surface px-4 py-7 font-display text-[clamp(4.5rem,18vw,8rem)] leading-none font-semibold tracking-[-0.065em] text-moss-dark shadow-inner" aria-live="polite">{formatClock(remainingSeconds)}</div>

	<div class="h-3 overflow-hidden rounded-full bg-mist" aria-hidden="true">
		<div class="h-full rounded-full bg-[linear-gradient(90deg,var(--color-moss),var(--color-moss-dark))] transition-[width] duration-200 ease-out" style={`width: ${Math.max(0, Math.min(100, progress))}%`}></div>
	</div>

	<div class="grid grid-cols-2 gap-3" aria-label="Current sprint progress">
		<div class="rounded-2xl border border-moss/10 bg-mist/60 p-4">
			<strong class="block text-2xl leading-none font-extrabold text-moss-dark">{formatClock(totalTimeSeconds)}</strong>
			<span class="mt-1 block text-xs font-bold tracking-wide text-ink-muted uppercase">sprint time</span>
		</div>
		<div class="rounded-2xl border border-moss/10 bg-mist/60 p-4">
			<strong class="block text-2xl leading-none font-extrabold text-moss-dark">{extensionCount}</strong>
			<span class="mt-1 block text-xs font-bold tracking-wide text-ink-muted uppercase">extensions</span>
		</div>
	</div>
</section>
