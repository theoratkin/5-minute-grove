<script lang="ts">
	import { onDestroy, tick } from 'svelte';
	import { formatClock } from '$lib/app/time';
	import { buttonSplash } from '$lib/actions/buttonSplash';
	import { confettiBurst } from '$lib/actions/confettiBurst';
	import EndOfTimerPrompt from './EndOfTimerPrompt.svelte';
	import type { FocusPhase } from '$lib/features/focus-session/focusSession.types';
	import type { FocusTask } from '$lib/features/focus-list/focusTask.types';
	import TaskIntentionInput from '$lib/features/task-intention/components/TaskIntentionInput.svelte';
	import ActiveTaskPicker from './ActiveTaskPicker.svelte';
	import GroveVignette from './GroveVignette.svelte';
	import DurationField from './DurationField.svelte';
	import * as m from '$lib/paraglide/messages.js';

	let {
		remainingSeconds,
		canRemoveOneMinute,
		progress,
		groveTotalLeaves,
		groveSettledMatureTreeCount,
		groveGrowthToken,
		phase,
		intentionValue,
		tasks,
		activeTaskId,
		onAssignTask,
		onRenameTask,
		onCreateTask,
		onIntentionChange,
		onDurationChange,
		onStart,
		onAddFive,
		onAddOne,
		onRemoveOne,
		onPause,
		onResume,
		onStop,
		onDone,
		canCompleteTask,
		onCompleteTask,
	}: {
		remainingSeconds: number;
		canRemoveOneMinute: boolean;
		progress: number;
		groveTotalLeaves: number;
		groveSettledMatureTreeCount: number;
		groveGrowthToken: number;
		phase: FocusPhase;
		intentionValue: string;
		tasks: FocusTask[];
		activeTaskId: string | null;
		onAssignTask: (id: string) => void;
		onRenameTask: (id: string, title: string) => void;
		onCreateTask: (title: string) => void;
		onIntentionChange: (value: string) => void;
		onDurationChange: (seconds: number) => void;
		onStart: () => void;
		onAddFive: () => void;
		onAddOne: () => void;
		onRemoveOne: () => void;
		onPause: () => void;
		onResume: () => void;
		onStop: () => void;
		onDone: () => void;
		canCompleteTask: boolean;
		onCompleteTask: () => void;
	} = $props();

	let isStarting = $state(false);
	let isExtending = $state(false);
	let startTimeout: ReturnType<typeof setTimeout> | undefined;
	let extendTimeout: ReturnType<typeof setTimeout> | undefined;
	let primaryCompletionAction = $state<HTMLButtonElement | undefined>();

	let statusText = $derived.by(() => {
		if (phase === 'running') return m.timer_status_running();
		if (phase === 'paused') return m.timer_status_paused();
		if (phase === 'contract-complete') return m.timer_status_complete();
		return m.timer_status_idle();
	});

	let companionText = $derived.by(() => {
		if (phase === 'contract-complete') return m.timer_companion_complete();
		if (phase === 'paused') return m.timer_companion_paused();
		if (phase === 'running') return m.timer_companion_running();
		return m.timer_companion_idle();
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

	function startWithCommitment() {
		if (isStarting) return;

		isStarting = true;
		onStart();
		startTimeout = setTimeout(() => {
			isStarting = false;
		}, 420);
	}

	function extendWithCommitment() {
		if (isExtending) return;

		isExtending = true;
		onAddFive();
		extendTimeout = setTimeout(() => {
			isExtending = false;
		}, 420);
	}

	$effect(() => {
		if (phase === 'contract-complete') {
			void tick().then(() => primaryCompletionAction?.focus());
		}
	});

	onDestroy(() => {
		if (startTimeout) clearTimeout(startTimeout);
		if (extendTimeout) clearTimeout(extendTimeout);
	});
</script>

<section class="grid gap-5" aria-label={m.timer_label()}>
	<div class="flex items-center justify-between gap-4 text-sm font-semibold text-ink-muted">
		<span aria-live="polite">{statusText}</span>
		<span class="flex items-center gap-1.5 text-xs"><i class="ph-fill ph-leaf text-moss" aria-hidden="true"></i> {companionText}</span>
	</div>

	<div
		class:timer-complete={phase === 'contract-complete'}
		class:timer-paused={phase === 'paused'}
		class:timer-starting={isStarting || isExtending}
		class="timer-panel relative overflow-hidden rounded-[1.35rem_2.25rem_1.5rem_2rem] border border-moss/10 bg-surface px-4 py-5 shadow-inner"
		style={`--timer-progress: ${Math.max(0, Math.min(100, progress))}%`}
	>
		{#if isStarting || isExtending}
			<div class="start-commit-glow" aria-hidden="true"></div>
		{/if}
		{#if phase === 'running' || phase === 'paused'}
			<div class:paused-fill={phase === 'paused'} class="timer-progress-fill" aria-hidden="true"></div>
		{/if}
		{#if phase === 'contract-complete'}
			<div class="confetti" aria-hidden="true">
				{#each confetti as piece}
					<span
						style={`--x: ${piece[0]}%; --delay: ${piece[1]}s; --duration: ${piece[2]}s; --drift: ${piece[3]}rem; --rotation: ${piece[4]}deg; --confetti-color: ${piece[5]}`}
					></span>
				{/each}
			</div>
		{/if}
		<div class="relative z-10 mb-3">
			<GroveVignette
				{progress}
				totalLeaves={groveTotalLeaves}
				settledMatureTreeCount={groveSettledMatureTreeCount}
				growthToken={groveGrowthToken}
				paused={phase === 'paused'}
			/>
		</div>
		<div class="relative z-10 h-48">
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
					{#if phase === 'running'}
						<div class="timer-adjustment-layout">
							<button class="minute-adjust minute-adjust-remove" type="button" use:buttonSplash={{ ripples: 1, durationMs: 2000, simple: true }} onclick={onRemoveOne} title={m.timer_remove_minute_title()} aria-label={m.timer_remove_minute()} disabled={!canRemoveOneMinute}>−1:00</button>
							<div class="timer-adjust-readout"><DurationField seconds={remainingSeconds} editable={false} /></div>
							<button class="minute-adjust minute-adjust-add" type="button" use:buttonSplash={{ ripples: 1, durationMs: 2000, simple: true }} onclick={onAddOne} title={m.timer_add_minute_title()} aria-label={m.timer_add_minute()}>+1:00</button>
						</div>
					{:else if phase === 'idle'}
						<DurationField seconds={remainingSeconds} onchange={onDurationChange} onsubmit={startWithCommitment} />
					{:else}
						<DurationField seconds={remainingSeconds} editable={false} />
					{/if}
				</div>
			{/if}
		</div>

		<div class="relative z-10 -mt-1">
			{#if phase === 'idle'}
				<TaskIntentionInput value={intentionValue} onchange={onIntentionChange} onsubmit={startWithCommitment} />
			{:else if activeTaskId}
				<ActiveTaskPicker {tasks} {activeTaskId} onassign={onAssignTask} onrename={onRenameTask} oncreate={onCreateTask} />
			{/if}
		</div>

		<div class="relative z-10 mt-7">
			{#if phase === 'idle'}
				<div class="raised-button raised-button-start">
					<button class:starting={isStarting} class="start-button relative z-10 flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-moss px-5 py-4 text-base font-extrabold text-on-accent transition hover:bg-moss-dark active:translate-y-1" type="button" use:buttonSplash onclick={startWithCommitment} disabled={isStarting}>
						<i class:starting={isStarting} class="start-icon ph-fill ph-play text-lg" aria-hidden="true"></i>
						<span>{isStarting ? m.timer_here_we_go() : m.timer_start({ time: formatClock(remainingSeconds) })}</span>
					</button>
				</div>
			{:else if phase === 'contract-complete'}
				<div class="grid gap-3" aria-label={m.timer_completed_controls()}>
					<div class="raised-button raised-button-extend">
						<button bind:this={primaryCompletionAction} class:starting={isExtending} class="extend-button relative z-10 flex min-h-14 w-full min-w-0 items-center justify-center gap-2 rounded-2xl bg-moss px-4 font-extrabold text-on-accent transition hover:bg-moss-dark active:translate-y-1" type="button" use:buttonSplash onclick={extendWithCommitment} disabled={isExtending}>
							<i class:starting={isExtending} class="extend-icon ph-bold ph-plus text-lg" aria-hidden="true"></i>
							<span>{isExtending ? m.timer_another_five() : m.timer_add_five()}</span>
						</button>
					</div>
					<div class={`grid gap-2 ${canCompleteTask ? 'grid-cols-2' : 'grid-cols-1'}`}>
						<button class="flex min-h-12 items-center justify-center gap-1 rounded-xl border border-moss/15 bg-surface px-2 text-sm font-extrabold text-moss transition hover:bg-mist" type="button" onclick={onDone} title={m.timer_save_without_completing()}><i class="ph-bold ph-stop" aria-hidden="true"></i><span>{m.timer_stop_for_now()}</span></button>
						{#if canCompleteTask}<button class="flex min-h-12 items-center justify-center gap-1 rounded-xl border border-moss/20 bg-sprout/25 px-2 text-sm font-extrabold text-moss transition hover:bg-sprout/45" type="button" use:confettiBurst onclick={onCompleteTask} title={m.timer_save_and_complete()}><i class="ph-bold ph-check" aria-hidden="true"></i><span>{m.timer_mark_done()}</span></button>{/if}
					</div>
				</div>
			{:else if phase === 'paused'}
				<div class="grid min-h-14 grid-cols-2 gap-3" aria-label={m.timer_paused_controls()}>
					<div class="raised-button raised-button-resume">
						<button class="relative z-10 flex h-full w-full items-center justify-center gap-2 rounded-2xl bg-moss px-4 font-extrabold text-on-accent transition hover:bg-moss-dark active:translate-y-1" type="button" onclick={onResume}>
							<i class="ph-fill ph-play text-[1.0625rem]" aria-hidden="true"></i>
							<span>{m.timer_resume()}</span>
						</button>
					</div>
					<button class="flex items-center justify-center gap-2 rounded-2xl border border-clay/30 bg-surface px-4 font-bold text-clay transition hover:bg-clay/10" type="button" onclick={onStop}>
						<i class="ph-fill ph-stop-circle text-[1.0625rem]" aria-hidden="true"></i>
						<span>{m.timer_stop_for_now()}</span>
					</button>
				</div>
			{:else}
				<div class="grid min-h-14 grid-cols-2 gap-3" aria-label={m.timer_running_controls()}>
					<button class="flex items-center justify-center gap-2 rounded-2xl border border-moss/15 bg-mist px-4 font-extrabold text-moss transition hover:-translate-y-0.5 hover:bg-sprout/50" type="button" onclick={onPause}>
						<i class="ph-fill ph-pause text-[1.0625rem]" aria-hidden="true"></i>
						<span>{m.timer_pause()}</span>
					</button>
					<button class="flex items-center justify-center gap-2 rounded-2xl border border-clay/30 bg-surface px-4 font-bold text-clay transition hover:bg-clay/10" type="button" onclick={onStop}>
						<i class="ph-fill ph-stop-circle text-[1.0625rem]" aria-hidden="true"></i>
						<span>{m.timer_stop_for_now()}</span>
					</button>
				</div>
			{/if}
		</div>
	</div>

</section>

<style>
	.minute-adjust {
		min-width: 3.25rem;
		border: 1px solid color-mix(in srgb, var(--color-moss) 13%, transparent);
		border-radius: 9999px;
		padding: 0.35rem 0.4rem;
		color: var(--color-ink-muted);
		background: color-mix(in srgb, var(--color-surface) 55%, transparent);
		font-family: var(--font-timer);
		font-size: 0.6875rem;
		font-weight: 700;
		font-variant-numeric: tabular-nums;
		line-height: 1;
		transition: border-color 150ms, color 150ms, background 150ms;
	}

	.timer-adjustment-layout {
		display: grid;
		grid-template-areas:
			'readout readout'
			'remove add';
		grid-template-columns: 1fr 1fr;
		align-items: center;
		justify-items: center;
		column-gap: 0.5rem;
		row-gap: 0.6rem;
		width: 100%;
	}

	.timer-adjust-readout {
		grid-area: readout;
	}

	.minute-adjust-remove {
		grid-area: remove;
		justify-self: end;
	}

	.minute-adjust-add {
		grid-area: add;
		justify-self: start;
	}

	.minute-adjust:hover {
		border-color: color-mix(in srgb, var(--color-moss) 28%, transparent);
		color: var(--color-moss);
		background: color-mix(in srgb, var(--color-mist) 72%, transparent);
	}

	.minute-adjust:disabled {
		cursor: default;
		opacity: 0.35;
	}

	@media (min-width: 640px) {
		.timer-adjustment-layout {
			grid-template-areas: 'remove readout add';
			grid-template-columns: 3.75rem 1fr 3.75rem;
			column-gap: 0.5rem;
			row-gap: 0;
		}

		.minute-adjust-remove {
			justify-self: start;
		}

		.minute-adjust-add {
			justify-self: end;
		}
	}

	.timer-panel {
		--timer-progress: 0%;
		border-color: color-mix(in srgb, var(--color-moss) 10%, var(--color-surface));
		background-clip: padding-box;
	}

	.timer-progress-fill {
		position: absolute;
		z-index: 0;
		inset: 0;
		--progress-color: color-mix(in srgb, var(--color-moss) 34%, var(--color-surface));
		background: linear-gradient(90deg, color-mix(in srgb, var(--color-moss) 22%, var(--color-surface)), var(--progress-color));
		clip-path: inset(0 calc(100% - var(--timer-progress)) 0 0);
		transition: clip-path 200ms ease-out;
	}

	.timer-starting {
		animation: timer-commit 420ms cubic-bezier(0.2, 0.8, 0.2, 1);
	}

	.start-commit-glow {
		position: absolute;
		z-index: 0;
		inset: auto 50% 1.5rem;
		width: 2rem;
		height: 2rem;
		border-radius: 9999px;
		background: color-mix(in srgb, var(--color-sprout) 78%, transparent);
		transform: translateX(-50%);
		animation: commit-glow 420ms ease-out forwards;
	}

	.start-button.starting {
		pointer-events: none;
		animation: start-press 420ms cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
	}

	.raised-button {
		position: relative;
		isolation: isolate;
		transition: transform 150ms;
	}

	.raised-button::before {
		position: absolute;
		z-index: 0;
		inset: 0 0 -0.5rem;
		border-radius: 1rem;
		background: var(--color-moss-pressed);
		content: '';
	}

	.raised-button-extend::before {
		bottom: -0.3125rem;
	}

	.raised-button-resume::before {
		bottom: -0.375rem;
	}

	.raised-button:hover {
		transform: translateY(-0.125rem);
	}

	.raised-button:hover::before {
		background: var(--color-moss-hover-pressed);
	}

	.extend-button.starting {
		pointer-events: none;
		animation: extend-press 420ms cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
	}

	.start-icon.starting {
		animation: play-forward 420ms ease-out forwards;
	}

	.extend-icon.starting {
		animation: plus-forward 420ms ease-out forwards;
	}

	.timer-paused {
		border-color: color-mix(in srgb, var(--color-clay) 42%, var(--color-surface));
		background:
			repeating-linear-gradient(-45deg, color-mix(in srgb, var(--color-clay) 7%, transparent) 0 0.7rem, transparent 0.7rem 1.4rem),
			linear-gradient(145deg, color-mix(in srgb, var(--color-clay) 12%, var(--color-surface)), var(--color-surface) 64%);
	}

	.paused-fill {
		--progress-color: color-mix(in srgb, var(--color-clay) 26%, var(--color-surface));
		background: linear-gradient(90deg, color-mix(in srgb, var(--color-clay) 15%, var(--color-surface)), var(--progress-color));
	}

	.timer-complete {
		background: linear-gradient(145deg, color-mix(in srgb, var(--color-sprout) 45%, var(--color-surface)), var(--color-surface) 62%);
	}

	.paused-readout {
		position: relative;
	}

	.paused-badge {
		display: inline-flex;
		position: absolute;
		top: 0.25rem;
		left: 50%;
		align-items: center;
		gap: 0.4rem;
		border: 1px solid color-mix(in srgb, var(--color-clay) 46%, transparent);
		border-radius: 9999px;
		padding: 0.35rem 0.65rem;
		color: var(--color-clay);
		background: color-mix(in srgb, var(--color-surface) 78%, var(--color-clay));
		transform: translateX(-50%);
	}

	.confetti {
		position: absolute;
		z-index: 0;
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
			top: -1.5rem;
			transform: translate3d(0, 0, 0) rotate(0deg);
			opacity: 0;
		}

		8% {
			opacity: 0.9;
		}

		100% {
			top: calc(100% + 1.5rem);
			transform: translate3d(var(--drift), 0, 0) rotate(calc(540deg + var(--rotation)));
			opacity: 0.85;
		}
	}

	@keyframes timer-commit {
		0% { transform: scale(1); }
		35% { transform: scale(0.988); }
		100% { transform: scale(1); }
	}

	@keyframes start-press {
		0% { transform: translateY(0); }
		28% { transform: translateY(0.45rem); box-shadow: none; }
		70% { transform: translateY(0.1rem); box-shadow: 0 0 0 var(--color-moss-pressed); }
		100% { transform: translateY(0); }
	}

	@keyframes extend-press {
		0% { transform: translateY(0); }
		28% { transform: translateY(0.3rem); box-shadow: none; }
		70% { transform: translateY(0.05rem); box-shadow: 0 0 0 var(--color-moss-pressed); }
		100% { transform: translateY(0); }
	}

	@keyframes commit-glow {
		0% { transform: translateX(-50%) scale(0); opacity: 0.72; }
		100% { transform: translateX(-50%) scale(18); opacity: 0; }
	}

	@keyframes play-forward {
		35% { transform: translateX(0.16rem); }
		100% { transform: translateX(0); }
	}

	@keyframes plus-forward {
		35% { transform: rotate(90deg) scale(1.12); }
		100% { transform: rotate(0) scale(1); }
	}

	@media (prefers-reduced-motion: reduce) {
		.timer-starting,
		.start-button.starting,
		.start-icon.starting,
		.extend-button.starting,
		.extend-icon.starting,
		.start-commit-glow {
			animation: none;
		}

		.confetti span {
			animation: none;
			opacity: 0.32;
			transform: translateY(5rem) rotate(var(--rotation));
		}
	}
</style>
