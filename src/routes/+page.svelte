<script lang="ts">
	import { onMount } from 'svelte';
	import FocusTimer from '$lib/features/focus-session/components/FocusTimer.svelte';
	import EndOfTimerPrompt from '$lib/features/focus-session/components/EndOfTimerPrompt.svelte';
	import {
		FIVE_MINUTES_SECONDS,
		createSessionId,
		getSessionTitle
	} from '$lib/features/focus-session/focusSession.utils';
	import type {
		FocusPhase,
		FocusSessionRecord,
		SessionEndReason
	} from '$lib/features/focus-session/focusSession.types';
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
	import TaskIntentionInput from '$lib/features/task-intention/components/TaskIntentionInput.svelte';
	import { buttonSplash } from '$lib/actions/buttonSplash';

	let intention = $state('');
	let phase = $state<FocusPhase>('idle');
	let remainingSeconds = $state(FIVE_MINUTES_SECONDS);
	let completedContracts = $state(0);
	let extensionCount = $state(0);
	let sessionStartedAt = $state<string | null>(null);
	let activeSprintId = $state<string | null>(null);
	let segmentEndsAt = $state<number | null>(null);
	let history = $state<FocusSessionRecord[]>([]);
	let startOrExtendSound: HTMLAudioElement | null = null;
	let timerFinishSound: HTMLAudioElement | null = null;

	let canEditIntention = $derived(phase === 'idle');
	let activeTitle = $derived(getSessionTitle(intention));
	let sprintTimeSeconds = $derived(
		phase === 'idle'
			? 0
			: completedContracts * FIVE_MINUTES_SECONDS +
				(phase === 'contract-complete' ? 0 : FIVE_MINUTES_SECONDS - remainingSeconds)
	);
	let pageTitle = $derived(
		phase === 'running'
			? `${formatClock(remainingSeconds)} - Just 5 More Minutes`
			: phase === 'paused'
				? 'Paused - Just 5 More Minutes'
				: 'Just 5 More Minutes'
	);

	function finishCurrentTurn() {
		if (phase !== 'running' && phase !== 'paused') return;

		const nextCompletedContracts = completedContracts + 1;

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

	function startSession() {
		void prepareTimerNotifications();
		playSound(startOrExtendSound);

		sessionStartedAt = new Date().toISOString();
		activeSprintId = createSessionId();
		completedContracts = 0;
		extensionCount = 0;
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

	function finishSession(reason: SessionEndReason) {
		if (!sessionStartedAt || !activeSprintId || completedContracts === 0) return;

		const record: FocusSessionRecord = {
			id: activeSprintId,
			title: activeTitle,
			startedAt: sessionStartedAt,
			endedAt: new Date().toISOString(),
			completedContracts,
			extensionCount,
			totalSeconds: completedContracts * FIVE_MINUTES_SECONDS
		};

		history = [...history.filter((sprint) => sprint.id !== record.id), record]
			.sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime())
			.slice(0, 12);
		saveSessionHistory(history);
		resetSession(reason === 'switch');
	}

	function resumeSprint(record: FocusSessionRecord) {
		if (phase !== 'idle') return;

		intention = record.title === 'Sprint' ? '' : record.title;
		activeSprintId = record.id;
		sessionStartedAt = record.startedAt;
		completedContracts = record.completedContracts || Math.round(record.totalSeconds / FIVE_MINUTES_SECONDS);
		extensionCount = record.extensionCount;
		remainingSeconds = FIVE_MINUTES_SECONDS;
		segmentEndsAt = Date.now() + FIVE_MINUTES_SECONDS * 1000;
		phase = 'running';
		void prepareTimerNotifications();
		playSound(startOrExtendSound);
	}

	function deleteSprint(id: string) {
		if (id === activeSprintId) return;
		history = history.filter((sprint) => sprint.id !== id);
		saveSessionHistory(history);
	}

	function resetSession(clearIntention = false) {
		phase = 'idle';
		remainingSeconds = FIVE_MINUTES_SECONDS;
		completedContracts = 0;
		extensionCount = 0;
		sessionStartedAt = null;
		activeSprintId = null;
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


<main class="relative mx-auto grid min-h-screen w-full max-w-6xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start lg:px-8 lg:py-10">
	<section class="overflow-hidden rounded-[2rem] border border-white/80 bg-paper/90 shadow-[0_24px_70px_rgb(36_48_41/12%)] backdrop-blur" aria-label="Just 5 More Minutes workspace">
		<header class="border-b border-moss/10 bg-[linear-gradient(120deg,#eaf1db,transparent_62%)] px-6 py-7 sm:px-10 sm:py-9">
			<p class="mb-3 flex items-center gap-2 text-xs font-black tracking-[0.18em] text-moss uppercase before:h-2 before:w-2 before:rounded-full before:bg-sun before:content-['']">Just 5 More Minutes</p>
			<h1 class="max-w-xl font-display text-5xl leading-[0.94] font-semibold tracking-[-0.045em] text-moss-dark sm:text-6xl">{phase === 'contract-complete' ? 'You can stop here.' : 'Start small.'}</h1>
		</header>

		<div class="grid gap-7 px-6 py-7 sm:px-10 sm:py-9">
			<TaskIntentionInput
				value={intention}
				disabled={!canEditIntention}
				onchange={(nextValue) => (intention = nextValue)}
			/>

			<FocusTimer
				{remainingSeconds}
				{phase}
				{completedContracts}
				{extensionCount}
				totalTimeSeconds={sprintTimeSeconds}
			/>

			{#if phase === 'idle'}
				<button class="min-h-14 w-full rounded-2xl bg-moss px-5 py-4 text-base font-extrabold text-white shadow-[0_8px_0_#204536] transition hover:-translate-y-0.5 hover:bg-moss-dark active:translate-y-1 active:shadow-none" type="button" use:buttonSplash onclick={startSession}>
					Start 5 minutes
				</button>
			{:else if phase === 'contract-complete'}
				<EndOfTimerPrompt
					intention={activeTitle}
					{completedContracts}
					{extensionCount}
					onAddFive={addFiveMinutes}
					onDone={() => finishSession('done')}
					onBreak={() => finishSession('break')}
					onSwitchTask={() => finishSession('switch')}
				/>
			{:else if phase === 'paused'}
				<div class="grid min-h-14 grid-cols-2 gap-3" aria-label="Paused timer controls">
					<button class="rounded-2xl bg-moss px-4 font-extrabold text-white shadow-[0_5px_0_#204536] transition hover:-translate-y-0.5" type="button" onclick={resumeSession}>Resume</button>
					<button class="rounded-2xl border border-clay/30 bg-white px-4 font-bold text-clay transition hover:bg-clay/10" type="button" onclick={finishCurrentTurn}>Finish</button>
				</div>
			{:else}
				<div class="grid min-h-14 grid-cols-2 gap-3" aria-label="Running timer controls">
					<button class="rounded-2xl border border-moss/15 bg-mist px-4 font-extrabold text-moss transition hover:-translate-y-0.5 hover:bg-sprout/50" type="button" onclick={pauseSession}>Pause</button>
					<button class="rounded-2xl border border-clay/30 bg-white px-4 font-bold text-clay transition hover:bg-clay/10" type="button" onclick={finishCurrentTurn}>Finish</button>
				</div>
			{/if}
		</div>
	</section>

	<aside class="rounded-[1.5rem] border border-white/90 bg-paper/80 p-5 shadow-[0_18px_50px_rgb(36_48_41/8%)] backdrop-blur lg:sticky lg:top-8">
			<SessionHistory records={history} onresume={resumeSprint} {deleteSprint} />
	</aside>
</main>
