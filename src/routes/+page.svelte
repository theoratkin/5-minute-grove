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

	let intention = $state('');
	let phase = $state<FocusPhase>('idle');
	let remainingSeconds = $state(FIVE_MINUTES_SECONDS);
	let completedContracts = $state(0);
	let extensionCount = $state(0);
	let sessionStartedAt = $state<string | null>(null);
	let segmentEndsAt = $state<number | null>(null);
	let history = $state<FocusSessionRecord[]>([]);
	let startOrExtendSound: HTMLAudioElement | null = null;
	let timerFinishSound: HTMLAudioElement | null = null;

	let canEditIntention = $derived(phase === 'idle');
	let activeTitle = $derived(getSessionTitle(intention));
	let pageTitle = $derived(
		phase === 'running'
			? `${formatClock(remainingSeconds)} - Just 5 More Minutes`
			: phase === 'paused'
				? 'Paused - Just 5 More Minutes'
				: 'Just 5 More Minutes'
	);

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
				const nextCompletedContracts = completedContracts + 1;

				completedContracts = nextCompletedContracts;
				phase = 'contract-complete';
				segmentEndsAt = null;
				playSound(timerFinishSound);
				notifyContractComplete({
					intention: activeTitle,
					completedContracts: nextCompletedContracts
				});
			}
		}, 250);

		return () => window.clearInterval(interval);
	});

	function startSession() {
		void prepareTimerNotifications();
		playSound(startOrExtendSound);

		sessionStartedAt = new Date().toISOString();
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

	function stopSession() {
		if (completedContracts > 0) {
			finishSession('break');
			return;
		}

		resetSession();
	}

	function finishSession(reason: SessionEndReason) {
		if (!sessionStartedAt || completedContracts === 0) return;

		const record: FocusSessionRecord = {
			id: createSessionId(),
			intention: activeTitle,
			startedAt: sessionStartedAt,
			endedAt: new Date().toISOString(),
			completedContracts,
			extensionCount,
			totalSeconds: completedContracts * FIVE_MINUTES_SECONDS,
			reason
		};

		history = [record, ...history].slice(0, 12);
		saveSessionHistory(history);
		resetSession(reason === 'switch');
	}

	function resetSession(clearIntention = false) {
		phase = 'idle';
		remainingSeconds = FIVE_MINUTES_SECONDS;
		completedContracts = 0;
		extensionCount = 0;
		sessionStartedAt = null;
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

<main>
	<section class="workspace" aria-label="Just 5 More Minutes workspace">
		<header>
			<p>Just 5 More Minutes</p>
			<h1>{phase === 'contract-complete' ? 'You can stop here.' : 'Start small.'}</h1>
		</header>

		<div class="panel">
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
			/>

			{#if phase === 'idle'}
				<button class="start-button" type="button" onclick={startSession}>Start 5 minutes</button>
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
				<div class="timer-controls" aria-label="Paused timer controls">
					<button class="resume-button" type="button" onclick={resumeSession}>Resume</button>
					<button class="stop-button" type="button" onclick={stopSession}>Stop</button>
				</div>
			{:else}
				<div class="timer-controls" aria-label="Running timer controls">
					<button type="button" onclick={pauseSession}>Pause</button>
					<button class="stop-button" type="button" onclick={stopSession}>Stop</button>
				</div>
			{/if}
		</div>
	</section>

	<aside>
		<SessionHistory records={history} />
	</aside>
</main>

<style>
	main {
		width: min(1180px, calc(100vw - 2rem));
		min-height: 100vh;
		margin: 0 auto;
		display: grid;
		grid-template-columns: minmax(0, 1fr) minmax(18rem, 24rem);
		gap: 1.25rem;
		align-items: start;
		padding: 2rem 0;
	}

	.workspace,
	aside {
		border: 1px solid var(--line);
		border-radius: 8px;
		background: rgba(60, 56, 54, 0.9);
		box-shadow: var(--shadow);
	}

	.workspace {
		display: grid;
		gap: 1.25rem;
		padding: clamp(1rem, 3vw, 2rem);
	}

	header {
		display: grid;
		gap: 0.25rem;
	}

	header p,
	h1 {
		margin: 0;
	}

	header p {
		color: var(--amber);
		font-size: 0.82rem;
		font-weight: 900;
		text-transform: uppercase;
	}

	h1 {
		font-size: clamp(2.2rem, 7vw, 5.6rem);
		line-height: 0.96;
		letter-spacing: 0;
	}

	.panel {
		display: grid;
		gap: 1.2rem;
	}

	.start-button {
		width: 100%;
		min-height: 3.35rem;
		border: 0;
		border-radius: 8px;
		background: var(--green-dark);
		color: #282828;
		font-weight: 900;
	}

	.start-button:hover {
		background: #fabd2f;
	}

	.timer-controls {
		min-height: 3.35rem;
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 0.7rem;
	}

	.timer-controls button {
		border: 1px solid var(--line);
		border-radius: 8px;
		background: var(--surface-muted);
		color: var(--ink);
		font-weight: 800;
	}

	.timer-controls button:hover {
		transform: translateY(-1px);
	}

	.timer-controls .resume-button {
		border-color: var(--green);
		background: var(--green);
		color: #282828;
	}

	.timer-controls .stop-button {
		border-color: rgba(251, 73, 52, 0.55);
		color: #ffb4a8;
	}

	aside {
		padding: 1rem;
		position: sticky;
		top: 1rem;
	}

	@media (max-width: 880px) {
		main {
			grid-template-columns: 1fr;
			padding: 1rem 0;
		}

		aside {
			position: static;
		}
	}
</style>
