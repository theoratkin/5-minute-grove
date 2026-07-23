<script lang="ts">
	import { formatClock } from '$lib/app/time';
	import { buttonSplash } from '$lib/actions/buttonSplash';
	import type { FocusPhase } from '../focusSession.types';
	import DurationField from './DurationField.svelte';
	import EndOfTimerPrompt from './EndOfTimerPrompt.svelte';
	import * as m from '$lib/paraglide/messages.js';

	let {
		phase,
		clockMode,
		remainingSeconds,
		elapsedSeconds,
		canRemoveOneMinute,
		onDurationChange,
		onStart,
		onAddOne,
		onRemoveOne
	}: {
		phase: FocusPhase;
		clockMode: 'countdown' | 'count-up';
		remainingSeconds: number;
		elapsedSeconds: number;
		canRemoveOneMinute: boolean;
		onDurationChange: (seconds: number) => void;
		onStart: () => void;
		onAddOne: () => void;
		onRemoveOne: () => void;
	} = $props();
</script>

<div class="h-48">
	{#if phase === 'contract-complete'}
		<div aria-live="polite"><EndOfTimerPrompt /></div>
	{:else}
		<div class:paused-readout={phase === 'paused'} class="grid h-full place-items-center text-moss-dark">
			{#if phase === 'paused'}
				<div class="paused-badge font-sans text-xs font-bold">
					<i class="ph-fill ph-pause text-sm" aria-hidden="true"></i>
					{m.timer_paused()}
				</div>
			{/if}
			{#if clockMode === 'count-up'}
				<div class="count-up-readout" role="timer" aria-label={m.duration_elapsed({ time: formatClock(elapsedSeconds) })}>{formatClock(elapsedSeconds)}</div>
			{:else if phase === 'running'}
				<div class="timer-adjustment-layout">
					<button class="minute-adjust minute-adjust-remove" type="button" use:buttonSplash={{ ripples: 1, durationMs: 2000, simple: true }} onclick={onRemoveOne} title={m.timer_remove_minute_title()} aria-label={m.timer_remove_minute()} disabled={!canRemoveOneMinute}>−1:00</button>
					<div class="timer-adjust-readout"><DurationField seconds={remainingSeconds} editable={false} /></div>
					<button class="minute-adjust minute-adjust-add" type="button" use:buttonSplash={{ ripples: 1, durationMs: 2000, simple: true }} onclick={onAddOne} title={m.timer_add_minute_title()} aria-label={m.timer_add_minute()}>+1:00</button>
				</div>
			{:else if phase === 'idle'}
				<DurationField seconds={remainingSeconds} onchange={onDurationChange} onsubmit={onStart} />
			{:else}
				<DurationField seconds={remainingSeconds} editable={false} />
			{/if}
		</div>
	{/if}
</div>

<style>
	.count-up-readout {
		font-family: var(--font-timer);
		font-size: clamp(4.5rem, 18vw, 8rem);
		font-weight: 700;
		font-variant-numeric: tabular-nums lining-nums;
		font-feature-settings: 'tnum' 1, 'lnum' 1;
		letter-spacing: -0.035em;
		line-height: 1;
	}
	.minute-adjust { min-width: 3.25rem; border: 1px solid color-mix(in srgb, var(--color-moss) 13%, transparent); border-radius: 9999px; padding: 0.35rem 0.4rem; color: var(--color-ink-muted); background: color-mix(in srgb, var(--color-surface) 55%, transparent); font-family: var(--font-timer); font-size: 0.6875rem; font-weight: 700; font-variant-numeric: tabular-nums; line-height: 1; transition: border-color 150ms, color 150ms, background 150ms; }
	.timer-adjustment-layout { display: grid; grid-template-areas: 'readout readout' 'remove add'; grid-template-columns: 1fr 1fr; align-items: center; justify-items: center; column-gap: 0.5rem; row-gap: 0.6rem; width: 100%; }
	.timer-adjust-readout { grid-area: readout; }
	.minute-adjust-remove { grid-area: remove; justify-self: end; }
	.minute-adjust-add { grid-area: add; justify-self: start; }
	.minute-adjust:hover { border-color: color-mix(in srgb, var(--color-moss) 28%, transparent); color: var(--color-moss); background: color-mix(in srgb, var(--color-mist) 72%, transparent); }
	.minute-adjust:disabled { cursor: default; opacity: 0.35; }
	.paused-readout { position: relative; }
	.paused-badge { display: inline-flex; position: absolute; top: 0.25rem; left: 50%; align-items: center; gap: 0.4rem; border: 1px solid color-mix(in srgb, var(--color-clay) 46%, transparent); border-radius: 9999px; padding: 0.35rem 0.65rem; color: var(--color-clay); background: color-mix(in srgb, var(--color-surface) 78%, var(--color-clay)); transform: translateX(-50%); }
	@media (min-width: 640px) {
		.timer-adjustment-layout { grid-template-areas: 'remove readout add'; grid-template-columns: 3.75rem 1fr 3.75rem; column-gap: 0.5rem; row-gap: 0; }
		.minute-adjust-remove { justify-self: start; }
		.minute-adjust-add { justify-self: end; }
	}
</style>
