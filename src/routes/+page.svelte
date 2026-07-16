<script lang="ts">
	import { onMount } from 'svelte';
	import FocusTimer from '$lib/features/focus-session/components/FocusTimer.svelte';
	import {
		FIVE_MINUTES_SECONDS,
		createSessionId,
		getSessionTitle
	} from '$lib/features/focus-session/focusSession.utils';
	import type { FocusPhase, FocusSessionRecord } from '$lib/features/focus-session/focusSession.types';
	import SessionHistory from '$lib/features/session-history/components/SessionHistory.svelte';
	import {
		loadSessionHistory,
		saveSessionHistory,
		removeSessionById,
		restoreSessionRecord
	} from '$lib/features/session-history/sessionHistory.storage';
	import {
		notifyContractComplete,
		prepareTimerNotifications
	} from '$lib/app/notifications';
	import { formatClock } from '$lib/app/time';
	import { usePreferences } from '$lib/app/preferences.svelte';
	import {
		clearActiveSession,
		loadActiveSession,
		saveActiveSession
	} from '$lib/features/focus-session/focusSession.storage';
	import {
		elapsedInCurrentContract,
		restoreFocusSession
	} from '$lib/features/focus-session/focusSession.state';

	let intention = $state('');
	let phase = $state<FocusPhase>('idle');
	let remainingSeconds = $state(FIVE_MINUTES_SECONDS);
	let completedContracts = $state(0);
	let extensionCount = $state(0);
	let elapsedSessionSeconds = $state(0);
	let sessionStartedAt = $state<string | null>(null);
	let activeSessionId = $state<string | null>(null);
	let segmentEndsAt = $state<number | null>(null);
	let history = $state<FocusSessionRecord[]>([]);
	let startOrExtendSound: HTMLAudioElement | null = null;
	let timerFinishSound: HTMLAudioElement | null = null;
	let hydrated = $state(false);
	let toastMessage = $state('');
	let deletedRecord = $state<FocusSessionRecord | null>(null);
	let deleteTimeout: ReturnType<typeof setTimeout> | undefined;
	const preferences = usePreferences();

	let activeTitle = $derived(getSessionTitle(intention));
	let segmentProgress = $derived.by(() => {
		if (phase === 'contract-complete') return 100;
		return ((FIVE_MINUTES_SECONDS - remainingSeconds) / FIVE_MINUTES_SECONDS) * 100;
	});
	let sessionTimeSeconds = $derived(
		phase === 'idle'
			? 0
			: elapsedSessionSeconds +
				(phase === 'contract-complete' ? 0 : elapsedInCurrentContract(remainingSeconds))
	);
	let pageTitle = $derived(
		phase === 'running'
			? `${formatClock(remainingSeconds)} - Just 5 More Minutes`
			: phase === 'paused'
				? 'Paused - Just 5 More Minutes'
				: 'Just 5 More Minutes'
	);
	let currentSession = $derived<FocusSessionRecord | null>(
		phase === 'idle' || !sessionStartedAt || !activeSessionId
			? null
			: {
				id: activeSessionId,
				title: activeTitle,
				startedAt: sessionStartedAt,
				endedAt: new Date().toISOString(),
				completedContracts,
				extensionCount,
				totalSeconds: sessionTimeSeconds
			}
	);

	function completeCurrentContract() {
		if (phase !== 'running') return;

		const nextCompletedContracts = completedContracts + 1;
		elapsedSessionSeconds += FIVE_MINUTES_SECONDS;
		remainingSeconds = 0;
		completedContracts = nextCompletedContracts;
		phase = 'contract-complete';
		segmentEndsAt = null;
		playSound(timerFinishSound);
		if (preferences.notificationsEnabled) {
			notifyContractComplete({ intention: activeTitle, completedContracts: nextCompletedContracts });
		}
	}

	onMount(() => {
		history = loadSessionHistory();
		startOrExtendSound = new Audio('/sounds/start-or-extend.mp3');
		timerFinishSound = new Audio('/sounds/timer-finish.mp3');
		startOrExtendSound.preload = 'auto';
		timerFinishSound.preload = 'auto';

		const savedSession = loadActiveSession();
		if (savedSession) {
			const restored = restoreFocusSession(savedSession);
			intention = restored.intention;
			phase = restored.phase;
			remainingSeconds = restored.remainingSeconds;
			completedContracts = restored.completedContracts;
			extensionCount = restored.extensionCount;
			elapsedSessionSeconds = restored.elapsedSessionSeconds;
			sessionStartedAt = restored.sessionStartedAt;
			activeSessionId = restored.activeSessionId;
			segmentEndsAt = restored.segmentEndsAt;
			toastMessage = restored.completedWhileAway
				? 'Your five-minute contract finished while you were away.'
				: 'Your session was restored.';
			if (restored.completedWhileAway && preferences.notificationsEnabled) {
				notifyContractComplete({ intention: activeTitle, completedContracts: restored.completedContracts });
			}
		}
		hydrated = true;

		function syncTimer() {
			if (phase !== 'running' || segmentEndsAt === null) return;

			remainingSeconds = Math.max(0, Math.ceil((segmentEndsAt - Date.now()) / 1000));
			if (remainingSeconds === 0) completeCurrentContract();
		}

		const interval = window.setInterval(syncTimer, 250);
		document.addEventListener('visibilitychange', syncTimer);

		function handleKeyboard(event: KeyboardEvent) {
			const target = event.target as HTMLElement;
			if (event.repeat || target.matches('input, textarea, select, button, a, summary, [contenteditable="true"]')) return;

			if (event.code === 'Space' && (phase === 'running' || phase === 'paused')) {
				event.preventDefault();
				phase === 'running' ? pauseSession() : resumeSession();
			} else if (event.key === 'Enter' && phase === 'idle') {
				event.preventDefault();
				startSession();
			} else if ((event.key === '+' || event.key === '=') && phase === 'contract-complete') {
				event.preventDefault();
				addFiveMinutes();
			}
		}
		window.addEventListener('keydown', handleKeyboard);

		return () => {
			window.clearInterval(interval);
			document.removeEventListener('visibilitychange', syncTimer);
			window.removeEventListener('keydown', handleKeyboard);
			if (deleteTimeout) window.clearTimeout(deleteTimeout);
		};
	});

	$effect(() => {
		if (!hydrated) return;
		if (phase === 'idle' || !sessionStartedAt || !activeSessionId) {
			clearActiveSession();
			return;
		}

		saveActiveSession({
			version: 1,
			intention,
			phase,
			remainingSeconds,
			completedContracts,
			extensionCount,
			elapsedSessionSeconds,
			sessionStartedAt,
			activeSessionId,
			segmentEndsAt
		});
	});

	function startSession() {
		if (preferences.notificationsEnabled) void prepareTimerNotifications();
		playSound(startOrExtendSound);

		sessionStartedAt = new Date().toISOString();
		activeSessionId = createSessionId();
		completedContracts = 0;
		extensionCount = 0;
		elapsedSessionSeconds = 0;
		remainingSeconds = FIVE_MINUTES_SECONDS;
		segmentEndsAt = Date.now() + FIVE_MINUTES_SECONDS * 1000;
		phase = 'running';
	}

	function addFiveMinutes() {
		if (preferences.notificationsEnabled) void prepareTimerNotifications();
		playSound(startOrExtendSound);

		extensionCount += 1;
		remainingSeconds = FIVE_MINUTES_SECONDS;
		segmentEndsAt = Date.now() + FIVE_MINUTES_SECONDS * 1000;
		phase = 'running';
	}

	function pauseSession() {
		if (phase !== 'running' || segmentEndsAt === null) return;

		remainingSeconds = Math.max(1, Math.ceil((segmentEndsAt - Date.now()) / 1000));
		segmentEndsAt = null;
		phase = 'paused';
	}

	function resumeSession() {
		if (phase !== 'paused') return;

		segmentEndsAt = Date.now() + remainingSeconds * 1000;
		phase = 'running';
	}

	function finishSession(message = 'Five minutes counts. You finished here.', clearIntention = false) {
		if (!sessionStartedAt || !activeSessionId || sessionTimeSeconds <= 0) return;

		const record: FocusSessionRecord = {
			id: activeSessionId,
			title: activeTitle,
			startedAt: sessionStartedAt,
			endedAt: new Date().toISOString(),
			completedContracts,
			extensionCount,
			totalSeconds: sessionTimeSeconds
		};

		history = [...history.filter((session) => session.id !== record.id), record]
			.sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime())
			.slice(0, 12);
		saveSessionHistory(history);
		resetSession(clearIntention);
		toastMessage = message;
		if (clearIntention) {
			requestAnimationFrame(() => document.querySelector<HTMLInputElement>('[data-session-name]')?.focus());
		}
	}

	function stopSessionEarly() {
		finishSession('You stopped when you needed to. The time you spent still counts.');
	}

	function takeBreak() {
		finishSession('Contract complete. Enjoy a guilt-free break.');
	}

	function switchTask() {
		finishSession('Contract complete. Name the next small thing when you are ready.', true);
	}

	function resumeSavedSession(record: FocusSessionRecord) {
		if (phase !== 'idle') return;

		intention = record.title === 'Session' || record.title === 'Sprint' ? '' : record.title;
		activeSessionId = record.id;
		sessionStartedAt = new Date().toISOString();
		completedContracts = record.completedContracts || Math.round(record.totalSeconds / FIVE_MINUTES_SECONDS);
		extensionCount = record.extensionCount;
		elapsedSessionSeconds = record.totalSeconds;
		remainingSeconds = FIVE_MINUTES_SECONDS;
		segmentEndsAt = Date.now() + FIVE_MINUTES_SECONDS * 1000;
		phase = 'running';
		if (preferences.notificationsEnabled) void prepareTimerNotifications();
		playSound(startOrExtendSound);
	}

	function deleteSession(id: string) {
		if (id === activeSessionId) return;
		const result = removeSessionById(history, id);
		if (!result.removed) return;
		history = result.records;
		deletedRecord = result.removed;
		saveSessionHistory(history);
		toastMessage = `Removed “${result.removed.title}”.`;
		if (deleteTimeout) window.clearTimeout(deleteTimeout);
		deleteTimeout = window.setTimeout(() => (deletedRecord = null), 6000);
	}

	function undoDelete() {
		if (!deletedRecord) return;
		history = restoreSessionRecord(history, deletedRecord);
		saveSessionHistory(history);
		toastMessage = `Restored “${deletedRecord.title}”.`;
		deletedRecord = null;
		if (deleteTimeout) window.clearTimeout(deleteTimeout);
	}

	function updateSessionTitle(id: string, title: string) {
		if (id === activeSessionId) {
			intention = title === 'Session' ? '' : title;
			return;
		}

		history = history.map((session) => (session.id === id ? { ...session, title } : session));
		saveSessionHistory(history);
	}

	function resetSession(clearIntention = false) {
		phase = 'idle';
		remainingSeconds = FIVE_MINUTES_SECONDS;
		completedContracts = 0;
		extensionCount = 0;
		elapsedSessionSeconds = 0;
		sessionStartedAt = null;
		activeSessionId = null;
		segmentEndsAt = null;

		if (clearIntention) {
			intention = '';
		}
	}

	function playSound(sound: HTMLAudioElement | null) {
		if (!sound || !preferences.soundEnabled) return;

		sound.currentTime = 0;
		void sound.play().catch(() => {
			// Some browsers may block non-gesture audio if autoplay permission is unavailable.
		});
	}
</script>

<svelte:head>
	<title>{pageTitle}</title>
	<meta
		name="description"
		content="A tiny focus timer centered on five-minute starts and voluntary continuation."
	/>
</svelte:head>


<main class="relative z-10 mx-auto grid min-h-[calc(100vh-5rem)] w-full max-w-6xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start lg:px-8 lg:py-10">
	<h1 class="sr-only">Just 5 More Minutes focus timer</h1>
	<section class="overflow-hidden rounded-[2rem] border border-surface/80 bg-paper/90 shadow-[0_24px_70px_rgb(0_0_0/12%)] backdrop-blur" aria-label="Just 5 More Minutes workspace">
		<div class="grid gap-7 px-6 py-7 sm:px-10 sm:py-9">
			<FocusTimer
				{remainingSeconds}
				progress={segmentProgress}
				{phase}
				{completedContracts}
				{extensionCount}
				intention={activeTitle}
				intentionValue={intention}
				onIntentionChange={(nextValue) => (intention = nextValue)}
				onStart={startSession}
				onAddFive={addFiveMinutes}
				onPause={pauseSession}
				onResume={resumeSession}
				onStop={stopSessionEarly}
				onDone={() => finishSession()}
				onBreak={takeBreak}
				onSwitch={switchTask}
			/>

			<p class="hidden text-center text-xs text-ink-muted sm:block" aria-label="Keyboard shortcuts">
				{#if phase === 'idle'}Press <kbd>Enter</kbd> to start{:else if phase === 'contract-complete'}Press <kbd>+</kbd> to add five minutes{:else}Press <kbd>Space</kbd> to {phase === 'paused' ? 'resume' : 'pause'}{/if}
			</p>

			<div class="grid grid-cols-2 gap-3" aria-label="Current session progress">
				<div class="rounded-2xl border border-moss/10 bg-mist/60 p-4">
					<strong class="block text-2xl leading-none font-extrabold text-moss-dark">{formatClock(sessionTimeSeconds)}</strong>
					<span class="mt-1 block text-xs font-bold tracking-wide text-ink-muted uppercase">session time</span>
				</div>
				<div class="rounded-2xl border border-moss/10 bg-mist/60 p-4">
					<strong class="block text-2xl leading-none font-extrabold text-moss-dark">{extensionCount}</strong>
					<span class="mt-1 block text-xs font-bold tracking-wide text-ink-muted uppercase">extensions</span>
				</div>
			</div>
		</div>
	</section>

	<aside class="rounded-[1.5rem] border border-surface/90 bg-paper/80 p-5 shadow-[0_18px_50px_rgb(0_0_0/8%)] backdrop-blur lg:sticky lg:top-8">
		<SessionHistory records={history} {currentSession} onresume={resumeSavedSession} {deleteSession} {updateSessionTitle} />
	</aside>
</main>

{#if toastMessage}
	<div class="fixed right-4 bottom-4 left-4 z-50 mx-auto flex min-h-12 max-w-md items-center justify-between gap-4 rounded-2xl border border-moss/15 bg-paper px-4 py-3 text-sm font-semibold text-ink shadow-[0_16px_45px_rgb(0_0_0/18%)]" role="status">
		<span>{toastMessage}</span>
		{#if deletedRecord}
			<button class="min-h-11 shrink-0 rounded-xl px-3 font-extrabold text-moss transition hover:bg-mist" type="button" onclick={undoDelete}>Undo</button>
		{:else}
			<button class="grid size-11 shrink-0 place-items-center rounded-xl text-ink-muted transition hover:bg-mist" type="button" aria-label="Dismiss message" onclick={() => (toastMessage = '')}><i class="ph-bold ph-x" aria-hidden="true"></i></button>
		{/if}
	</div>
{/if}
