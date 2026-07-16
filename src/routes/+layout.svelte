<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { onMount } from 'svelte';
	import favicon from '$lib/assets/favicon.svg';
	import GlobalHeader from '$lib/app/GlobalHeader.svelte';
	import { applyTheme, loadTheme, type ThemeId } from '$lib/app/theme';
	import { AppPreferences, providePreferences } from '$lib/app/preferences.svelte';
	import {
		FocusWorkspace,
		provideFocusWorkspace
	} from '$lib/features/focus-session/focusWorkspace.svelte';
	import type { FocusSessionRecord } from '$lib/features/focus-session/focusSession.types';
	import SessionHistory from '$lib/features/session-history/components/SessionHistory.svelte';
	import '$lib/styles/tokens.css';
	import '@phosphor-icons/web/bold';
	import '@phosphor-icons/web/fill';

	let { children } = $props();
	let theme = $state<ThemeId>('soft-daylight');
	const preferences = new AppPreferences();
	providePreferences(preferences);
	const workspace = new FocusWorkspace(preferences);
	provideFocusWorkspace(workspace);

	onMount(() => {
		theme = loadTheme();
		applyTheme(theme);
		preferences.load();
		workspace.setup();

		return () => workspace.dispose();
	});

	$effect(() => workspace.persistActiveSession());

	function changeTheme(nextTheme: ThemeId) {
		theme = nextTheme;
		applyTheme(theme);
	}

	function resumeSavedSession(record: FocusSessionRecord) {
		if (workspace.resumeSavedSession(record) && page.url.pathname !== '/') {
			void goto('/');
		}
	}
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<div id="button-splash-background" class="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden="true"></div>

<GlobalHeader {theme} {preferences} onThemeChange={changeTheme} />

<main class="relative z-10 mx-auto grid min-h-[calc(100vh-5rem)] w-full max-w-6xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start lg:px-8 lg:py-10">
	{@render children()}

	<aside class="rounded-[1.5rem] border border-surface/90 bg-paper/80 p-5 shadow-[0_18px_50px_rgb(0_0_0/8%)] backdrop-blur lg:sticky lg:top-8">
		<SessionHistory
			records={workspace.history}
			currentSession={workspace.currentSession}
			onresume={resumeSavedSession}
			deleteSession={(id) => workspace.deleteSession(id)}
			updateSessionTitle={(id, title) => workspace.updateSessionTitle(id, title)}
		/>
	</aside>
</main>

{#if workspace.toastMessage}
	<div class="fixed right-4 bottom-4 left-4 z-50 mx-auto flex min-h-12 max-w-md items-center justify-between gap-4 rounded-2xl border border-moss/15 bg-paper px-4 py-3 text-sm font-semibold text-ink shadow-[0_16px_45px_rgb(0_0_0/18%)]" role="status">
		<span>{workspace.toastMessage}</span>
		{#if workspace.deletedRecord}
			<button class="min-h-11 shrink-0 rounded-xl px-3 font-extrabold text-moss transition hover:bg-mist" type="button" onclick={() => workspace.undoDelete()}>Undo</button>
		{:else}
			<button class="grid size-11 shrink-0 place-items-center rounded-xl text-ink-muted transition hover:bg-mist" type="button" aria-label="Dismiss message" onclick={() => workspace.dismissToast()}><i class="ph-bold ph-x" aria-hidden="true"></i></button>
		{/if}
	</div>
{/if}

<footer class="relative z-10 mx-auto w-full max-w-6xl px-4 pb-6 text-center text-xs sm:px-6 lg:px-8">
	<p class="inline-block rounded-full border border-surface/90 bg-paper/95 px-4 py-2 text-ink-muted shadow-sm backdrop-blur">
		by Theo Ratkin (<a
			class="font-semibold text-ink transition hover:text-moss focus-visible:text-moss"
			href="https://theoratkin.com"
		>theoratkin.com</a>)
	</p>
</footer>
