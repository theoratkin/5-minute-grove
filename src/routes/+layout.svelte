<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { onMount } from 'svelte';
	import favicon from '$lib/assets/favicon.svg';
	import AmbientCanopy from '$lib/app/AmbientCanopy.svelte';
	import GlobalHeader from '$lib/app/GlobalHeader.svelte';
	import IntroductionModal from '$lib/app/IntroductionModal.svelte';
	import SleepReminder from '$lib/app/SleepReminder.svelte';
	import { hasSeenIntroduction, markIntroductionSeen } from '$lib/app/introduction';
	import { applyTheme, loadTheme, type ThemeId } from '$lib/app/theme';
	import { AppPreferences, providePreferences } from '$lib/app/preferences.svelte';
	import {
		FocusWorkspace,
		provideFocusWorkspace
	} from '$lib/features/focus-session/focusWorkspace.svelte';
	import type { FocusTask } from '$lib/features/focus-list/focusTask.types';
	import FocusList from '$lib/features/focus-list/components/FocusList.svelte';
	import '$lib/styles/tokens.css';
	import '@phosphor-icons/web/bold';
	import '@phosphor-icons/web/fill';

	let { children } = $props();
	let theme = $state<ThemeId>('soft-daylight');
	let introductionOpen = $state(false);
	const preferences = new AppPreferences();
	providePreferences(preferences);
	const workspace = new FocusWorkspace(preferences);
	provideFocusWorkspace(workspace);

	onMount(() => {
		theme = loadTheme();
		applyTheme(theme);
		preferences.load();
		workspace.setup();
		introductionOpen = !hasSeenIntroduction();

		function showIntroductionForDevelopment(event: KeyboardEvent) {
			if (!import.meta.env.DEV || event.key.toLowerCase() !== 'i' || !event.shiftKey) return;
			if (event.ctrlKey || event.metaKey || event.altKey) return;

			const target = event.target as Element | null;
			if (
				target?.closest(
					'input, textarea, select, [contenteditable]:not([contenteditable="false"])'
				)
			) {
				return;
			}

			event.preventDefault();
			introductionOpen = true;
		}

		window.addEventListener('keydown', showIntroductionForDevelopment);

		return () => {
			window.removeEventListener('keydown', showIntroductionForDevelopment);
			workspace.dispose();
		};
	});

	$effect(() => workspace.persistActiveSession());

	function changeTheme(nextTheme: ThemeId) {
		theme = nextTheme;
		applyTheme(theme);
	}

	function startTask(task: FocusTask) {
		if (workspace.startTask(task) && page.url.pathname !== '/') void goto('/');
	}

	function dismissIntroduction() {
		markIntroductionSeen();
		introductionOpen = false;
	}
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<AmbientCanopy />
<div id="button-splash-background" class="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden="true"></div>

<GlobalHeader
	{theme}
	{preferences}
	onThemeChange={changeTheme}
	onResetGrove={() => workspace.resetGrove()}
/>

<SleepReminder {preferences} />

<IntroductionModal open={introductionOpen} ondismiss={dismissIntroduction} />

<main class="relative z-10 mx-auto grid min-h-[calc(100vh-5rem)] w-full max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[minmax(0,1fr)_24rem] lg:items-start lg:px-8 lg:py-10">
	{@render children()}

	<aside class="rounded-[1.35rem_2rem_1.65rem_1.2rem] border border-surface/90 bg-paper/80 p-5 shadow-[0_18px_50px_rgb(0_0_0/8%)] backdrop-blur lg:sticky lg:top-8">
		<FocusList
			tasks={workspace.tasks}
			currentSession={workspace.currentSession}
			activeTaskId={workspace.activeTaskId}
			onadd={(title) => workspace.addTask(title)}
			onstart={startTask}
			ontoggle={(id) => workspace.toggleTaskDone(id)}
			onrename={(id, title) => workspace.updateTaskTitle(id, title)}
			onmove={(id, direction) => workspace.moveTask(id, direction)}
			onreorder={(orderedIds) => workspace.reorderTasks(orderedIds)}
			ondelete={(id) => workspace.deleteTask(id)}
		/>
	</aside>
</main>

{#if workspace.toastMessage}
	<div class="fixed right-4 bottom-4 z-50 flex min-h-12 w-max max-w-[calc(100vw-2rem)] items-center justify-between gap-4 rounded-2xl border border-moss/15 bg-paper px-4 py-3 text-sm font-semibold text-ink shadow-[0_16px_45px_rgb(0_0_0/18%)]" role="status">
		<span>{workspace.toastMessage}</span>
		<button class="grid size-11 shrink-0 place-items-center rounded-xl text-ink-muted transition hover:bg-mist" type="button" aria-label="Dismiss message" onclick={() => workspace.dismissToast()}><i class="ph-bold ph-x" aria-hidden="true"></i></button>
	</div>
{/if}

<footer class="relative z-10 mx-auto w-full max-w-7xl px-4 pb-6 text-center text-xs sm:px-6 lg:px-8">
	<p class="inline-block rounded-full border border-surface/90 bg-paper/95 px-4 py-2 text-ink-muted shadow-sm backdrop-blur">
		by Theo Ratkin (<a
			class="font-semibold text-ink transition hover:text-moss focus-visible:text-moss"
			href="https://theoratkin.com"
		>theoratkin.com</a>)
	</p>
</footer>
