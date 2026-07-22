<script lang="ts">
	import { onMount } from 'svelte';
	import { formatClock } from '$lib/app/time';
	import FocusTimer from '$lib/features/focus-session/components/FocusTimer.svelte';
	import { useFocusWorkspace } from '$lib/features/focus-session/focusWorkspace.svelte';
	import * as m from '$lib/paraglide/messages.js';

	const workspace = useFocusWorkspace();

	onMount(() => {
		const handleKeyboard = (event: KeyboardEvent) => workspace.handleKeyboard(event);
		window.addEventListener('keydown', handleKeyboard);
		return () => window.removeEventListener('keydown', handleKeyboard);
	});
</script>

<svelte:head>
	<title>{workspace.pageTitle}</title>
	<meta
		name="description"
		content={m.home_meta_description()}
	/>
</svelte:head>

<h1 class="sr-only">{m.home_heading()}</h1>
<section class="workspace-card overflow-hidden border border-surface/80 bg-paper/90 shadow-[0_24px_70px_rgb(0_0_0/12%)] backdrop-blur" aria-label={m.home_workspace_label()}>
	<div class="grid gap-7 px-6 py-7 sm:px-10 sm:py-9">
		<FocusTimer
			remainingSeconds={workspace.remainingSeconds}
			elapsedSeconds={workspace.sessionTimeSeconds}
			clockMode={workspace.clockMode}
			canRemoveOneMinute={workspace.segmentDurationSeconds > 60}
			progress={workspace.segmentProgress}
			groveTotalLeaves={workspace.groveTotalLeaves}
			groveSettledMatureTreeCount={workspace.groveSettledMatureTreeCount}
			groveGrowthToken={workspace.groveGrowthToken}
			phase={workspace.phase}
			onDurationChange={(seconds) => workspace.setStartDuration(seconds)}
			onClockModeChange={(mode) => workspace.setClockMode(mode)}
			onContinueCountUp={() => workspace.continueCountingUp()}
			intentionValue={workspace.taskInputValue}
			tasks={workspace.tasks}
			activeTaskId={workspace.activeTaskId}
			onAssignTask={(id) => workspace.assignActiveTask(id)}
			onRenameTask={(id, title) => workspace.updateTaskTitle(id, title)}
			onCreateTask={(title) => {
				const task = workspace.addTask(title);
				if (task) workspace.assignActiveTask(task.id);
			}}
			onIntentionChange={(nextValue) => workspace.updateIntention(nextValue)}
			onStart={() => workspace.startSession()}
			onAddFive={() => workspace.addFiveMinutes()}
			onAddOne={() => workspace.addOneMinute()}
			onRemoveOne={() => workspace.removeOneMinute()}
			onPause={() => workspace.pauseSession()}
			onResume={() => workspace.resumeSession()}
			onStop={() => workspace.stopSessionEarly()}
			onDone={() => workspace.stopSessionEarly()}
			canCompleteTask={workspace.canCompleteActiveTask}
			onCompleteTask={() => workspace.completeActiveTask()}
		/>

		<p class="hidden text-center text-xs text-ink-muted sm:block" aria-label={m.keyboard_shortcuts_label()}>
			{#if workspace.phase === 'idle'}{m.keyboard_set_time()} <kbd>Enter</kbd> {m.keyboard_to_start()}{:else if workspace.phase === 'contract-complete'}{m.keyboard_press()} <kbd>+</kbd> {m.keyboard_to_add_five()}{:else}{m.keyboard_press()} <kbd>Space</kbd> {workspace.phase === 'paused' ? m.keyboard_to_resume() : m.keyboard_to_pause()}{#if import.meta.env.DEV} · <kbd>M</kbd> {m.keyboard_skip_minute()} · <kbd>F</kbd> {m.keyboard_fast_forward()}{/if}{/if}{#if import.meta.env.DEV} · <kbd>Shift</kbd> + <kbd>I</kbd> {m.keyboard_for_intro()}{/if}
		</p>

		<div class="grid grid-cols-2 gap-3" aria-label={m.current_focus_progress_label()}>
			<div class="metric-card metric-card-time border border-moss/10 bg-mist/60 p-4">
				<strong class="block text-2xl leading-none font-extrabold text-moss-dark">{formatClock(workspace.sessionTimeSeconds)}</strong>
				<span class="mt-1 block text-xs font-bold text-ink-muted">{m.focused_now()}</span>
			</div>
			<div class="metric-card metric-card-extensions border border-moss/10 bg-mist/60 p-4">
				<strong class="block text-2xl leading-none font-extrabold text-moss-dark">{workspace.extensionCount}</strong>
				<span class="mt-1 block text-xs font-bold text-ink-muted">{m.extensions()}</span>
			</div>
		</div>
	</div>
</section>

<style>
	.workspace-card { border-radius: 2.4rem 1.8rem 2.15rem 1.65rem; }
	.metric-card { box-shadow: inset 0 1px color-mix(in srgb, var(--color-surface) 70%, transparent); }
	.metric-card-time { border-radius: 1.55rem 1rem 1.35rem 1rem; }
	.metric-card-extensions { border-radius: 1rem 1.55rem 1rem 1.35rem; }
</style>
