<script lang="ts">
	import { onDestroy, tick } from 'svelte';
	import { formatClock } from '$lib/app/time';
	import { buttonSplash } from '$lib/actions/buttonSplash';
	import { confettiBurst } from '$lib/actions/confettiBurst';
	import type { FocusPhase } from '../focusSession.types';
	import * as m from '$lib/paraglide/messages.js';

	let {
		phase,
		clockMode,
		remainingSeconds,
		canCompleteTask,
		onStart,
		onAddFive,
		onContinueCountUp,
		onPause,
		onResume,
		onStop,
		onDone,
		onCompleteTask,
		onCommitChange
	}: {
		phase: FocusPhase;
		clockMode: 'countdown' | 'count-up';
		remainingSeconds: number;
		canCompleteTask: boolean;
		onStart: () => void;
		onAddFive: () => void;
		onContinueCountUp: () => void;
		onPause: () => void;
		onResume: () => void;
		onStop: () => void;
		onDone: () => void;
		onCompleteTask: () => void;
		onCommitChange: (active: boolean) => void;
	} = $props();

	let isStarting = $state(false);
	let isExtending = $state(false);
	let resetTimeout: ReturnType<typeof setTimeout> | undefined;
	let primaryCompletionAction = $state<HTMLButtonElement | undefined>();

	function commit(action: () => void, kind: 'start' | 'extend') {
		if (isStarting || isExtending) return;
		if (kind === 'start') isStarting = true;
		else isExtending = true;
		onCommitChange(true);
		action();
		resetTimeout = setTimeout(() => {
			isStarting = false;
			isExtending = false;
			onCommitChange(false);
		}, 420);
	}

	$effect(() => {
		if (phase === 'contract-complete') void tick().then(() => primaryCompletionAction?.focus());
	});

	onDestroy(() => {
		if (resetTimeout) clearTimeout(resetTimeout);
		onCommitChange(false);
	});
</script>

{#if phase === 'idle'}
	<div class="raised-button">
		<button class:starting={isStarting} class="start-button relative z-10 flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-moss px-5 py-4 text-base font-extrabold text-on-accent transition hover:bg-moss-dark active:translate-y-1" type="button" use:buttonSplash onclick={() => commit(onStart, 'start')} disabled={isStarting}>
			<i class:starting={isStarting} class="start-icon ph-fill ph-play text-lg" aria-hidden="true"></i>
			<span>{isStarting ? m.timer_here_we_go() : clockMode === 'count-up' ? m.timer_start_count_up() : m.timer_start({ time: formatClock(remainingSeconds) })}</span>
		</button>
	</div>
{:else if phase === 'contract-complete'}
	<div class="grid gap-3" aria-label={m.timer_completed_controls()}>
		<div class="raised-button raised-button-extend">
			<button bind:this={primaryCompletionAction} class:starting={isExtending} class="extend-button relative z-10 flex min-h-14 w-full min-w-0 items-center justify-center gap-2 rounded-2xl bg-moss px-4 font-extrabold text-on-accent transition hover:bg-moss-dark active:translate-y-1" type="button" use:buttonSplash onclick={() => commit(onAddFive, 'extend')} disabled={isExtending}>
				<i class:starting={isExtending} class="extend-icon ph-bold ph-plus text-lg" aria-hidden="true"></i>
				<span>{isExtending ? m.timer_another_five() : m.timer_add_five()}</span>
			</button>
		</div>
		<button class="flex min-h-11 items-center justify-center gap-2 rounded-xl border border-moss/15 bg-mist/55 px-3 text-sm font-extrabold text-moss transition hover:bg-sprout/40" type="button" use:buttonSplash onclick={onContinueCountUp}><i class="ph-bold ph-trend-up" aria-hidden="true"></i><span>{m.timer_continue_count_up()}</span></button>
		<div class={`grid gap-2 ${canCompleteTask ? 'grid-cols-2' : 'grid-cols-1'}`}>
			<button class="flex min-h-12 items-center justify-center gap-1 rounded-xl border border-moss/15 bg-surface px-2 text-sm font-extrabold text-moss transition hover:bg-mist" type="button" onclick={onDone} title={m.timer_save_without_completing()}><i class="ph-bold ph-stop" aria-hidden="true"></i><span>{m.timer_stop_for_now()}</span></button>
			{#if canCompleteTask}<button class="flex min-h-12 items-center justify-center gap-1 rounded-xl border border-moss/20 bg-sprout/25 px-2 text-sm font-extrabold text-moss transition hover:bg-sprout/45" type="button" use:confettiBurst onclick={onCompleteTask} title={m.timer_save_and_complete()}><i class="ph-bold ph-check" aria-hidden="true"></i><span>{m.timer_mark_done()}</span></button>{/if}
		</div>
	</div>
{:else if phase === 'paused'}
	<div class="grid min-h-14 grid-cols-2 gap-3" aria-label={m.timer_paused_controls()}>
		<div class="raised-button raised-button-resume"><button class="relative z-10 flex h-full w-full items-center justify-center gap-2 rounded-2xl bg-moss px-4 font-extrabold text-on-accent transition hover:bg-moss-dark active:translate-y-1" type="button" onclick={onResume}><i class="ph-fill ph-play text-[1.0625rem]" aria-hidden="true"></i><span>{m.timer_resume()}</span></button></div>
		<button class="flex items-center justify-center gap-2 rounded-2xl border border-clay/30 bg-surface px-4 font-bold text-clay transition hover:bg-clay/10" type="button" onclick={onStop}><i class="ph-fill ph-stop-circle text-[1.0625rem]" aria-hidden="true"></i><span>{m.timer_stop_for_now()}</span></button>
	</div>
{:else}
	<div class="grid min-h-14 grid-cols-2 gap-3" aria-label={m.timer_running_controls()}>
		<button class="flex items-center justify-center gap-2 rounded-2xl border border-moss/15 bg-mist px-4 font-extrabold text-moss transition hover:-translate-y-0.5 hover:bg-sprout/50" type="button" onclick={onPause}><i class="ph-fill ph-pause text-[1.0625rem]" aria-hidden="true"></i><span>{m.timer_pause()}</span></button>
		<button class="flex items-center justify-center gap-2 rounded-2xl border border-clay/30 bg-surface px-4 font-bold text-clay transition hover:bg-clay/10" type="button" onclick={onStop}><i class="ph-fill ph-stop-circle text-[1.0625rem]" aria-hidden="true"></i><span>{m.timer_stop_for_now()}</span></button>
	</div>
{/if}

<style>
	.raised-button { position: relative; isolation: isolate; transition: transform 150ms; }
	.raised-button::before { position: absolute; z-index: 0; inset: 0 0 -0.5rem; border-radius: 1rem; background: var(--color-moss-pressed); content: ''; }
	.raised-button-extend::before { bottom: -0.3125rem; }
	.raised-button-resume::before { bottom: -0.375rem; }
	.raised-button:hover { transform: translateY(-0.125rem); }
	.raised-button:hover::before { background: var(--color-moss-hover-pressed); }
	.start-button.starting, .extend-button.starting { pointer-events: none; animation: button-press 420ms cubic-bezier(0.2, 0.8, 0.2, 1) forwards; }
	.start-icon.starting { animation: play-forward 420ms ease-out forwards; }
	.extend-icon.starting { animation: plus-forward 420ms ease-out forwards; }
	@keyframes button-press { 0% { transform: translateY(0); } 28% { transform: translateY(0.4rem); box-shadow: none; } 100% { transform: translateY(0); } }
	@keyframes play-forward { 35% { transform: translateX(0.16rem); } 100% { transform: translateX(0); } }
	@keyframes plus-forward { 35% { transform: rotate(90deg) scale(1.12); } 100% { transform: rotate(0) scale(1); } }
	@media (prefers-reduced-motion: reduce) { .start-button.starting, .start-icon.starting, .extend-button.starting, .extend-icon.starting { animation: none; } }
</style>
