<script lang="ts">
	import type { FocusPhase } from '$lib/features/focus-session/focusSession.types';
	import type { FocusTask } from '$lib/features/focus-list/focusTask.types';
	import TaskIntentionInput from '$lib/features/task-intention/components/TaskIntentionInput.svelte';
	import ActiveTaskPicker from './ActiveTaskPicker.svelte';
	import ClockModeSwitch from './ClockModeSwitch.svelte';
	import GroveVignette from './GroveVignette.svelte';
	import TimerConfetti from './TimerConfetti.svelte';
	import TimerControls from './TimerControls.svelte';
	import TimerReadout from './TimerReadout.svelte';
	import * as m from '$lib/paraglide/messages.js';

	let {
		remainingSeconds,
		elapsedSeconds,
		clockMode,
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
		onClockModeChange,
		onContinueCountUp,
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
		elapsedSeconds: number;
		clockMode: 'countdown' | 'count-up';
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
		onClockModeChange: (mode: 'countdown' | 'count-up') => void;
		onContinueCountUp: () => void;
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

	let isCommitting = $state(false);

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

	function startWithCommitment() {
		onStart();
	}
</script>

<section class="grid gap-5" aria-label={m.timer_label()}>
	<div class="flex flex-wrap items-center justify-between gap-3 text-sm font-semibold text-ink-muted">
		<span aria-live="polite">{statusText}</span>
		{#if phase === 'contract-complete'}
			<span class="flex items-center gap-1.5 text-xs"><i class="ph-fill ph-leaf text-moss" aria-hidden="true"></i> {companionText}</span>
		{:else}
			<ClockModeSwitch mode={clockMode} onchange={onClockModeChange} />
		{/if}
	</div>

	<div
		class:timer-complete={phase === 'contract-complete'}
		class:timer-paused={phase === 'paused'}
		class:timer-starting={isCommitting}
		class="timer-panel relative overflow-hidden rounded-[1.35rem_2.25rem_1.5rem_2rem] border border-moss/10 bg-surface px-4 py-5 shadow-inner"
		style={`--timer-progress: ${Math.max(0, Math.min(100, progress))}%`}
	>
		{#if isCommitting}
			<div class="start-commit-glow" aria-hidden="true"></div>
		{/if}
		{#if (phase === 'running' || phase === 'paused') && clockMode === 'countdown'}
			<div class:paused-fill={phase === 'paused'} class="timer-progress-fill" aria-hidden="true"></div>
		{/if}
		{#if phase === 'contract-complete'}
			<TimerConfetti />
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
		<div class="relative z-10">
			<TimerReadout {phase} {clockMode} {remainingSeconds} {elapsedSeconds} {canRemoveOneMinute} {onDurationChange} onStart={startWithCommitment} {onAddOne} {onRemoveOne} />
		</div>

		<div class="relative z-10 -mt-1">
			{#if phase === 'idle'}
				<TaskIntentionInput value={intentionValue} onchange={onIntentionChange} onsubmit={startWithCommitment} />
			{:else if activeTaskId}
				<ActiveTaskPicker {tasks} {activeTaskId} onassign={onAssignTask} onrename={onRenameTask} oncreate={onCreateTask} />
			{/if}
		</div>

		<div class="relative z-10 mt-7">
			<TimerControls {phase} {clockMode} {remainingSeconds} {canCompleteTask} {onStart} {onAddFive} {onContinueCountUp} {onPause} {onResume} {onStop} {onDone} {onCompleteTask} onCommitChange={(active) => (isCommitting = active)} />
		</div>
	</div>

</section>

<style>
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

	@keyframes timer-commit {
		0% { transform: scale(1); }
		35% { transform: scale(0.988); }
		100% { transform: scale(1); }
	}

	@keyframes commit-glow {
		0% { transform: translateX(-50%) scale(0); opacity: 0.72; }
		100% { transform: translateX(-50%) scale(18); opacity: 0; }
	}

	@media (prefers-reduced-motion: reduce) {
		.timer-starting,
		.start-commit-glow {
			animation: none;
		}
	}
</style>
