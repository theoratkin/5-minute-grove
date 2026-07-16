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
		content="A tiny focus timer centered on five-minute starts and voluntary continuation."
	/>
</svelte:head>

<h1 class="sr-only">Just 5 More Minutes focus timer</h1>
<section class="overflow-hidden rounded-[2rem] border border-surface/80 bg-paper/90 shadow-[0_24px_70px_rgb(0_0_0/12%)] backdrop-blur" aria-label="Just 5 More Minutes workspace">
	<div class="grid gap-7 px-6 py-7 sm:px-10 sm:py-9">
		<FocusTimer
			remainingSeconds={workspace.remainingSeconds}
			progress={workspace.segmentProgress}
			phase={workspace.phase}
			intention={workspace.activeTitle}
			intentionValue={workspace.intention}
			onIntentionChange={(nextValue) => (workspace.intention = nextValue)}
			onStart={() => workspace.startSession()}
			onAddFive={() => workspace.addFiveMinutes()}
			onPause={() => workspace.pauseSession()}
			onResume={() => workspace.resumeSession()}
			onStop={() => workspace.stopSessionEarly()}
			onDone={() => workspace.finishSession()}
			onSwitch={() => workspace.switchTask()}
		/>

		<p class="hidden text-center text-xs text-ink-muted sm:block" aria-label="Keyboard shortcuts">
			{#if workspace.phase === 'idle'}Press <kbd>Enter</kbd> to start{:else if workspace.phase === 'contract-complete'}Press <kbd>+</kbd> to add five minutes{:else}Press <kbd>Space</kbd> to {workspace.phase === 'paused' ? 'resume' : 'pause'}{#if import.meta.env.DEV} · <kbd>F</kbd> to fast-forward{/if}{/if}
		</p>

		<div class="grid grid-cols-2 gap-3" aria-label="Current session progress">
			<div class="rounded-2xl border border-moss/10 bg-mist/60 p-4">
				<strong class="block text-2xl leading-none font-extrabold text-moss-dark">{formatClock(workspace.sessionTimeSeconds)}</strong>
				<span class="mt-1 block text-xs font-bold tracking-wide text-ink-muted uppercase">session time</span>
			</div>
			<div class="rounded-2xl border border-moss/10 bg-mist/60 p-4">
				<strong class="block text-2xl leading-none font-extrabold text-moss-dark">{workspace.extensionCount}</strong>
				<span class="mt-1 block text-xs font-bold tracking-wide text-ink-muted uppercase">extensions</span>
			</div>
		</div>
	</div>
</section>
