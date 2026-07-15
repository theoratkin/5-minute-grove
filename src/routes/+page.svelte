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
		saveSessionHistory
	} from '$lib/features/session-history/sessionHistory.storage';
	import {
		notifyContractComplete,
		prepareTimerNotifications
	} from '$lib/app/notifications';
	import { formatClock } from '$lib/app/time';
	import ThemeSelector from '$lib/app/ThemeSelector.svelte';
	import { applyTheme, loadTheme, type ThemeId } from '$lib/app/theme';

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
	let theme = $state<ThemeId>('soft-daylight');

	let activeTitle = $derived(getSessionTitle(intention));
	let segmentProgress = $derived.by(() => {
		if (phase === 'contract-complete') return 100;
		return ((FIVE_MINUTES_SECONDS - remainingSeconds) / FIVE_MINUTES_SECONDS) * 100;
	});
	let sessionTimeSeconds = $derived(
		phase === 'idle'
			? 0
			: elapsedSessionSeconds +
				(phase === 'contract-complete' ? 0 : FIVE_MINUTES_SECONDS - remainingSeconds)
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

	function finishCurrentTurn() {
		if (phase !== 'running' && phase !== 'paused') return;

		const nextCompletedContracts = completedContracts + 1;
		elapsedSessionSeconds += FIVE_MINUTES_SECONDS - remainingSeconds;

		remainingSeconds = 0;
		completedContracts = nextCompletedContracts;
		phase = 'contract-complete';
		segmentEndsAt = null;
		playSound(timerFinishSound);
		notifyContractComplete({
			intention: activeTitle,
			completedContracts: nextCompletedContracts
		});
	}

	onMount(() => {
		theme = loadTheme();
		applyTheme(theme);
		history = loadSessionHistory();
		startOrExtendSound = new Audio('/sounds/start-or-extend.mp3');
		timerFinishSound = new Audio('/sounds/timer-finish.mp3');
		startOrExtendSound.preload = 'auto';
		timerFinishSound.preload = 'auto';

		const interval = window.setInterval(() => {
			if (phase !== 'running' || segmentEndsAt === null) return;

			const nextRemaining = Math.max(0, Math.ceil((segmentEndsAt - Date.now()) / 1000));
			remainingSeconds = nextRemaining;

			if (nextRemaining === 0) {
				finishCurrentTurn();
			}
		}, 250);

		return () => window.clearInterval(interval);
	});

	function changeTheme(nextTheme: ThemeId) {
		theme = nextTheme;
		applyTheme(theme);
	}

	function startSession() {
		void prepareTimerNotifications();
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
		void prepareTimerNotifications();
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

	function finishSession() {
		if (!sessionStartedAt || !activeSessionId || completedContracts === 0) return;

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
		resetSession();
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
		void prepareTimerNotifications();
		playSound(startOrExtendSound);
	}

	function deleteSession(id: string) {
		if (id === activeSessionId) return;
		history = history.filter((session) => session.id !== id);
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
		if (!sound) return;

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


<main class="relative z-10 mx-auto grid min-h-screen w-full max-w-6xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start lg:px-8 lg:py-10">
	<section class="overflow-hidden rounded-[2rem] border border-surface/80 bg-paper/90 shadow-[0_24px_70px_rgb(0_0_0/12%)] backdrop-blur" aria-label="Just 5 More Minutes workspace">
		<header class="border-b border-moss/10 bg-[linear-gradient(120deg,var(--color-sprout),transparent_62%)] px-6 py-7 sm:px-10 sm:py-9">
			<p class="mb-3 flex items-center gap-2 text-xs font-black tracking-[0.18em] text-moss uppercase before:h-2 before:w-2 before:rounded-full before:bg-sun before:content-['']">Just 5 More Minutes</p>
			<h1 class="max-w-xl font-display text-5xl leading-[0.94] font-semibold tracking-[-0.045em] text-moss-dark sm:text-6xl">{phase === 'contract-complete' ? 'You can stop here.' : 'Start small.'}</h1>
		</header>

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
				onFinish={finishCurrentTurn}
				onDone={finishSession}
			/>

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
		<ThemeSelector value={theme} onchange={changeTheme} />
		<div class="my-5 border-t border-moss/10"></div>
			<SessionHistory records={history} {currentSession} onresume={resumeSavedSession} {deleteSession} />
	</aside>
</main>
