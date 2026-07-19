<script lang="ts">
	import { onMount } from 'svelte';
	import { formatClock } from '$lib/app/time';
	import FocusTimer from '$lib/features/focus-session/components/FocusTimer.svelte';
	import { useFocusWorkspace } from '$lib/features/focus-session/focusWorkspace.svelte';

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
		content="A gentle focus timer with a duration you choose and voluntary five-minute extensions."
	/>
</svelte:head>

<h1 class="sr-only">Five Minute Grove focus timer</h1>
<section class="workspace-card overflow-hidden border border-surface/80 bg-paper/90 shadow-[0_24px_70px_rgb(0_0_0/12%)] backdrop-blur" aria-label="Five Minute Grove workspace">
	<div class="grid gap-7 px-6 py-7 sm:px-10 sm:py-9">
		<FocusTimer
			remainingSeconds={workspace.remainingSeconds}
			canRemoveOneMinute={workspace.segmentDurationSeconds > 60}
			progress={workspace.segmentProgress}
			groveTotalLeaves={workspace.groveTotalLeaves}
			groveSettledMatureTreeCount={workspace.groveSettledMatureTreeCount}
			groveGrowthToken={workspace.groveGrowthToken}
			phase={workspace.phase}
			onDurationChange={(seconds) => workspace.setStartDuration(seconds)}
			intention={workspace.activeTitle}
			intentionValue={workspace.intention}
			onIntentionChange={(nextValue) => (workspace.intention = nextValue)}
			onStart={() => workspace.startSession()}
			onAddFive={() => workspace.addFiveMinutes()}
			onAddOne={() => workspace.addOneMinute()}
			onRemoveOne={() => workspace.removeOneMinute()}
			onPause={() => workspace.pauseSession()}
			onResume={() => workspace.resumeSession()}
			onStop={() => workspace.stopSessionEarly()}
			onDone={() => workspace.finishSession()}
			onSwitch={() => workspace.switchTask()}
		/>

		<p class="hidden text-center text-xs text-ink-muted sm:block" aria-label="Keyboard shortcuts">
			{#if workspace.phase === 'idle'}Set a time, then press <kbd>Enter</kbd> to start{:else if workspace.phase === 'contract-complete'}Press <kbd>+</kbd> to add five minutes{:else}Press <kbd>Space</kbd> to {workspace.phase === 'paused' ? 'resume' : 'pause'}{#if import.meta.env.DEV} · <kbd>M</kbd> to skip 1 minute · <kbd>F</kbd> to fast-forward{/if}{/if}{#if import.meta.env.DEV} · <kbd>Shift</kbd> + <kbd>I</kbd> for intro{/if}
		</p>

		<div class="grid grid-cols-2 gap-3" aria-label="Current session progress">
			<div class="metric-card metric-card-time border border-moss/10 bg-mist/60 p-4">
				<strong class="block text-2xl leading-none font-extrabold text-moss-dark">{formatClock(workspace.sessionTimeSeconds)}</strong>
				<span class="mt-1 block text-xs font-bold text-ink-muted">Session time</span>
			</div>
			<div class="metric-card metric-card-extensions border border-moss/10 bg-mist/60 p-4">
				<strong class="block text-2xl leading-none font-extrabold text-moss-dark">{workspace.extensionCount}</strong>
				<span class="mt-1 block text-xs font-bold text-ink-muted">Extensions</span>
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
