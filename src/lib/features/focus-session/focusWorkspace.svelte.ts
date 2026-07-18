import { getContext, setContext } from 'svelte';
import type { AppPreferences } from '$lib/app/preferences.svelte';
import { notifyContractComplete, prepareTimerNotifications } from '$lib/app/notifications';
import { formatClock } from '$lib/app/time';
import {
	clearActiveSession,
	loadActiveSession,
	saveActiveSession
} from './focusSession.storage';
import { elapsedInCurrentContract, restoreFocusSession } from './focusSession.state';
import type { FocusPhase, FocusSessionRecord } from './focusSession.types';
import { FIVE_MINUTES_SECONDS, createSessionId, getSessionTitle } from './focusSession.utils';
import {
	loadSessionHistory,
	removeSessionById,
	restoreSessionRecord,
	saveSessionHistory
} from '$lib/features/session-history/sessionHistory.storage';
import {
	creditElapsedMinutes,
	deriveGroveProgress,
	emptyGroveState,
	resetGroveState,
	settleMatureTrees
} from '$lib/features/grove/grove.state';
import { loadOrInitializeGrove, saveGroveState } from '$lib/features/grove/grove.storage';
import type { GroveState } from '$lib/features/grove/grove.types';

const FOCUS_WORKSPACE_CONTEXT = Symbol('focus-workspace');
const C_MAJOR_OCTAVE_SEMITONES = [0, 2, 4, 5, 7, 9, 11, 12] as const;
const LOWER_C_MAJOR_OCTAVE_SEMITONES = [-12, -10, -8, -7, -5, -3, -1, 0] as const;

export class FocusWorkspace {
	intention = $state('');
	phase = $state<FocusPhase>('idle');
	remainingSeconds = $state(FIVE_MINUTES_SECONDS);
	segmentDurationSeconds = $state(FIVE_MINUTES_SECONDS);
	completedContracts = $state(0);
	extensionCount = $state(0);
	elapsedSessionSeconds = $state(0);
	sessionStartedAt = $state<string | null>(null);
	activeSessionId = $state<string | null>(null);
	segmentEndsAt = $state<number | null>(null);
	history = $state<FocusSessionRecord[]>([]);
	hydrated = $state(false);
	toastMessage = $state('');
	deletedRecord = $state<FocusSessionRecord | null>(null);
	groveState = $state<GroveState>(emptyGroveState());
	groveGrowthToken = $state(0);

	private startOrExtendSound: HTMLAudioElement | null = null;
	private addOneMinuteSound: HTMLAudioElement | null = null;
	private timerFinishSound: HTMLAudioElement | null = null;
	private timerInterval: ReturnType<typeof setInterval> | undefined;
	private deleteTimeout: ReturnType<typeof setTimeout> | undefined;

	constructor(private preferences: AppPreferences) {}

	get activeTitle() {
		return getSessionTitle(this.intention);
	}

	get segmentProgress() {
		if (this.phase === 'contract-complete') return 100;
		return (
			((this.segmentDurationSeconds - this.remainingSeconds) / this.segmentDurationSeconds) * 100
		);
	}

	get groveTotalLeaves() {
		return this.groveState.totalLeaves;
	}

	get groveSettledMatureTreeCount() {
		return this.groveState.settledMatureTreeCount;
	}

	get sessionTimeSeconds() {
		return this.phase === 'idle'
			? 0
			: this.elapsedSessionSeconds +
					(this.phase === 'contract-complete'
						? 0
						: elapsedInCurrentContract(this.remainingSeconds, this.segmentDurationSeconds));
	}

	get pageTitle() {
		if (this.phase === 'running') {
			return `${formatClock(this.remainingSeconds)} - Five Minute Grove`;
		}
		if (this.phase === 'paused') return 'Paused - Five Minute Grove';
		return 'Five Minute Grove';
	}

	get currentSession(): FocusSessionRecord | null {
		if (this.phase === 'idle' || !this.sessionStartedAt || !this.activeSessionId) return null;

		return {
			id: this.activeSessionId,
			title: this.activeTitle,
			startedAt: this.sessionStartedAt,
			endedAt: new Date().toISOString(),
			completedContracts: this.completedContracts,
			extensionCount: this.extensionCount,
			totalSeconds: this.sessionTimeSeconds
		};
	}

	setup() {
		this.history = loadSessionHistory();
		this.startOrExtendSound = new Audio('/sounds/start-or-extend.wav');
		this.addOneMinuteSound = new Audio('/sounds/add-1-minute.wav');
		this.timerFinishSound = new Audio('/sounds/timer-finish.wav');
		this.startOrExtendSound.preload = 'auto';
		this.addOneMinuteSound.preload = 'auto';
		this.timerFinishSound.preload = 'auto';

		const savedSession = loadActiveSession();
		if (savedSession) {
			const restored = restoreFocusSession(savedSession);
			this.intention = restored.intention;
			this.phase = restored.phase;
			this.remainingSeconds = restored.remainingSeconds;
			this.segmentDurationSeconds = restored.segmentDurationSeconds;
			this.completedContracts = restored.completedContracts;
			this.extensionCount = restored.extensionCount;
			this.elapsedSessionSeconds = restored.elapsedSessionSeconds;
			this.sessionStartedAt = restored.sessionStartedAt;
			this.activeSessionId = restored.activeSessionId;
			this.segmentEndsAt = restored.segmentEndsAt;
			this.toastMessage = restored.completedWhileAway
				? 'Your five-minute contract finished while you were away.'
				: 'Your session was restored.';
			if (restored.completedWhileAway && this.preferences.notificationsEnabled) {
				notifyContractComplete({
					intention: this.activeTitle,
					completedContracts: restored.completedContracts
				});
			}
		}

		const groveSeeds = this.history.map((record) => ({
			id: record.id,
			completedContracts: record.completedContracts,
			totalSeconds: record.totalSeconds
		}));
		if (this.activeSessionId) {
			groveSeeds.push({
				id: this.activeSessionId,
				completedContracts: this.completedContracts,
				totalSeconds: this.sessionTimeSeconds
			});
		}
		this.groveState = loadOrInitializeGrove(groveSeeds);
		this.creditCurrentSessionMinutes();

		this.hydrated = true;
		this.timerInterval = window.setInterval(() => this.syncTimer(), 250);
		document.addEventListener('visibilitychange', this.syncTimer);
	}

	dispose() {
		if (this.timerInterval) window.clearInterval(this.timerInterval);
		if (this.deleteTimeout) window.clearTimeout(this.deleteTimeout);
		document.removeEventListener('visibilitychange', this.syncTimer);
	}

	persistActiveSession() {
		if (!this.hydrated) return;
		if (this.phase === 'idle' || !this.sessionStartedAt || !this.activeSessionId) {
			clearActiveSession();
			return;
		}

		saveActiveSession({
			version: 1,
			intention: this.intention,
			phase: this.phase,
			remainingSeconds: this.remainingSeconds,
			segmentDurationSeconds: this.segmentDurationSeconds,
			completedContracts: this.completedContracts,
			extensionCount: this.extensionCount,
			elapsedSessionSeconds: this.elapsedSessionSeconds,
			sessionStartedAt: this.sessionStartedAt,
			activeSessionId: this.activeSessionId,
			segmentEndsAt: this.segmentEndsAt
		});
	}

	handleKeyboard(event: KeyboardEvent) {
		const target = event.target as HTMLElement;
		if (
			event.repeat ||
			target.matches('input, textarea, select, button, a, summary, [contenteditable="true"]')
		) {
			return;
		}

		if (event.code === 'Space' && (this.phase === 'running' || this.phase === 'paused')) {
			event.preventDefault();
			this.phase === 'running' ? this.pauseSession() : this.resumeSession();
		} else if (event.key === 'Enter' && this.phase === 'idle') {
			event.preventDefault();
			this.startSession();
		} else if (
			(event.key === '+' || event.key === '=') &&
			this.phase === 'contract-complete'
		) {
			event.preventDefault();
			this.addFiveMinutes();
		} else if (
			import.meta.env.DEV &&
			event.key.toLowerCase() === 'f' &&
			(this.phase === 'running' || this.phase === 'paused')
		) {
			event.preventDefault();
			this.fastForwardCurrentContract();
		} else if (
			import.meta.env.DEV &&
			event.key.toLowerCase() === 'm' &&
			(this.phase === 'running' || this.phase === 'paused')
		) {
			event.preventDefault();
			this.skipOneMinute();
		}
	}

	startSession() {
		if (this.preferences.notificationsEnabled) void prepareTimerNotifications();
		this.playSound(this.startOrExtendSound);
		this.settleGrove();

		this.sessionStartedAt = new Date().toISOString();
		this.activeSessionId = createSessionId();
		this.completedContracts = 0;
		this.extensionCount = 0;
		this.elapsedSessionSeconds = 0;
		this.remainingSeconds = FIVE_MINUTES_SECONDS;
		this.segmentDurationSeconds = FIVE_MINUTES_SECONDS;
		this.segmentEndsAt = Date.now() + FIVE_MINUTES_SECONDS * 1000;
		this.phase = 'running';
	}

	addFiveMinutes() {
		if (this.preferences.notificationsEnabled) void prepareTimerNotifications();
		this.playSound(this.startOrExtendSound);
		this.settleGrove();

		this.extensionCount += 1;
		this.remainingSeconds = FIVE_MINUTES_SECONDS;
		this.segmentDurationSeconds = FIVE_MINUTES_SECONDS;
		this.segmentEndsAt = Date.now() + FIVE_MINUTES_SECONDS * 1000;
		this.phase = 'running';
	}

	addOneMinute() {
		if (this.phase !== 'running' || this.segmentEndsAt === null) return;
		if (this.segmentEndsAt <= Date.now()) {
			this.syncTimer();
			return;
		}

		this.segmentDurationSeconds += 60;
		this.segmentEndsAt += 60 * 1000;
		this.remainingSeconds = Math.max(
			1,
			Math.ceil((this.segmentEndsAt - Date.now()) / 1000)
		);
		this.playRandomMajorNote(this.addOneMinuteSound, C_MAJOR_OCTAVE_SEMITONES);
	}

	removeOneMinute() {
		if (
			this.phase !== 'running' ||
			this.segmentEndsAt === null ||
			this.segmentDurationSeconds <= 60
		) {
			return;
		}

		const remainingSeconds = Math.max(
			0,
			Math.ceil((this.segmentEndsAt - Date.now()) / 1000)
		);
		if (remainingSeconds === 0) {
			this.syncTimer();
			return;
		}

		const secondsToRemove = Math.min(60, remainingSeconds);
		this.segmentDurationSeconds -= secondsToRemove;
		this.segmentEndsAt -= secondsToRemove * 1000;
		this.remainingSeconds = Math.max(
			0,
			Math.ceil((this.segmentEndsAt - Date.now()) / 1000)
		);
		this.playRandomMajorNote(this.addOneMinuteSound, LOWER_C_MAJOR_OCTAVE_SEMITONES);
		if (this.remainingSeconds === 0) this.completeCurrentContract(false);
	}

	pauseSession() {
		if (this.phase !== 'running' || this.segmentEndsAt === null) return;
		this.remainingSeconds = Math.max(
			1,
			Math.ceil((this.segmentEndsAt - Date.now()) / 1000)
		);
		this.segmentEndsAt = null;
		this.phase = 'paused';
	}

	resumeSession() {
		if (this.phase !== 'paused') return;
		this.segmentEndsAt = Date.now() + this.remainingSeconds * 1000;
		this.phase = 'running';
	}

	finishSession(message = 'Session saved.', clearIntention = false) {
		if (!this.sessionStartedAt || !this.activeSessionId || this.sessionTimeSeconds <= 0) return;

		const record: FocusSessionRecord = {
			id: this.activeSessionId,
			title: this.activeTitle,
			startedAt: this.sessionStartedAt,
			endedAt: new Date().toISOString(),
			completedContracts: this.completedContracts,
			extensionCount: this.extensionCount,
			totalSeconds: this.sessionTimeSeconds
		};

		this.history = [...this.history.filter((session) => session.id !== record.id), record]
			.sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime())
			.slice(0, 12);
		saveSessionHistory(this.history);
		this.resetSession(clearIntention);
		this.toastMessage = message;
		if (clearIntention) {
			requestAnimationFrame(() =>
				document.querySelector<HTMLInputElement>('[data-session-name]')?.focus()
			);
		}
	}

	stopSessionEarly() {
		this.finishSession();
	}

	switchTask() {
		this.finishSession('Session saved.', true);
	}

	resumeSavedSession(record: FocusSessionRecord) {
		if (this.phase !== 'idle') {
			this.toastMessage = 'Finish your current session before continuing another one.';
			return false;
		}

		this.intention = record.title === 'Session' || record.title === 'Sprint' ? '' : record.title;
		this.activeSessionId = record.id;
		this.sessionStartedAt = new Date().toISOString();
		this.completedContracts =
			record.completedContracts || Math.round(record.totalSeconds / FIVE_MINUTES_SECONDS);
		this.extensionCount = record.extensionCount;
		this.elapsedSessionSeconds = record.totalSeconds;
		this.remainingSeconds = FIVE_MINUTES_SECONDS;
		this.segmentDurationSeconds = FIVE_MINUTES_SECONDS;
		this.segmentEndsAt = Date.now() + FIVE_MINUTES_SECONDS * 1000;
		this.phase = 'running';
		if (this.preferences.notificationsEnabled) void prepareTimerNotifications();
		this.playSound(this.startOrExtendSound);
		return true;
	}

	deleteSession(id: string) {
		if (id === this.activeSessionId) return;
		const result = removeSessionById(this.history, id);
		if (!result.removed) return;

		this.history = result.records;
		this.deletedRecord = result.removed;
		saveSessionHistory(this.history);
		this.toastMessage = `Removed “${result.removed.title}”.`;
		if (this.deleteTimeout) window.clearTimeout(this.deleteTimeout);
		this.deleteTimeout = window.setTimeout(() => (this.deletedRecord = null), 6000);
	}

	undoDelete() {
		if (!this.deletedRecord) return;
		this.history = restoreSessionRecord(this.history, this.deletedRecord);
		saveSessionHistory(this.history);
		this.toastMessage = `Restored “${this.deletedRecord.title}”.`;
		this.deletedRecord = null;
		if (this.deleteTimeout) window.clearTimeout(this.deleteTimeout);
	}

	updateSessionTitle(id: string, title: string) {
		if (id === this.activeSessionId) {
			this.intention = title === 'Session' ? '' : title;
			return;
		}

		this.history = this.history.map((session) =>
			session.id === id ? { ...session, title } : session
		);
		saveSessionHistory(this.history);
	}

	dismissToast() {
		this.toastMessage = '';
	}

	resetGrove() {
		const groveSeeds = this.history.map((record) => ({
			id: record.id,
			completedContracts: record.completedContracts,
			totalSeconds: record.totalSeconds
		}));
		if (this.activeSessionId) {
			groveSeeds.push({
				id: this.activeSessionId,
				completedContracts: this.completedContracts,
				totalSeconds: this.sessionTimeSeconds
			});
		}

		this.groveState = resetGroveState(groveSeeds);
		this.groveGrowthToken += 1;
		saveGroveState(this.groveState);
		this.toastMessage = 'Your grove has been reset.';
	}

	private syncTimer = () => {
		if (this.phase !== 'running' || this.segmentEndsAt === null) return;
		this.remainingSeconds = Math.max(
			0,
			Math.ceil((this.segmentEndsAt - Date.now()) / 1000)
		);
		if (this.remainingSeconds === 0) {
			this.completeCurrentContract();
		} else {
			this.creditCurrentSessionMinutes();
		}
	};

	private completeCurrentContract(playFinishSound = true) {
		if (this.phase !== 'running') return;

		const nextCompletedContracts = this.completedContracts + 1;
		this.elapsedSessionSeconds += this.segmentDurationSeconds;
		this.remainingSeconds = 0;
		this.completedContracts = nextCompletedContracts;
		this.phase = 'contract-complete';
		this.segmentEndsAt = null;
		this.creditCurrentSessionMinutes();
		if (playFinishSound) this.playSound(this.timerFinishSound);
		if (this.preferences.notificationsEnabled) {
			notifyContractComplete({
				intention: this.activeTitle,
				completedContracts: nextCompletedContracts
			});
		}
	}

	private fastForwardCurrentContract() {
		if (!import.meta.env.DEV || (this.phase !== 'running' && this.phase !== 'paused')) return;
		if (this.phase === 'paused') this.phase = 'running';
		this.completeCurrentContract();
	}

	private skipOneMinute() {
		if (!import.meta.env.DEV || (this.phase !== 'running' && this.phase !== 'paused')) return;

		if (this.remainingSeconds <= 60) {
			if (this.phase === 'paused') this.phase = 'running';
			this.completeCurrentContract();
			return;
		}

		this.remainingSeconds -= 60;
		if (this.phase === 'running') {
			this.segmentEndsAt = Date.now() + this.remainingSeconds * 1000;
		}
		this.creditCurrentSessionMinutes();
	}

	private resetSession(clearIntention = false) {
		this.phase = 'idle';
		this.remainingSeconds = FIVE_MINUTES_SECONDS;
		this.segmentDurationSeconds = FIVE_MINUTES_SECONDS;
		this.completedContracts = 0;
		this.extensionCount = 0;
		this.elapsedSessionSeconds = 0;
		this.sessionStartedAt = null;
		this.activeSessionId = null;
		this.segmentEndsAt = null;
		if (clearIntention) this.intention = '';
	}

	private creditCurrentSessionMinutes() {
		if (!this.activeSessionId) return;
		const previousProgress = deriveGroveProgress(
			this.groveState.totalLeaves,
			this.groveState.settledMatureTreeCount
		);
		const result = creditElapsedMinutes(
			this.groveState,
			this.activeSessionId,
			Math.floor(this.sessionTimeSeconds / 60)
		);
		if (result.addedLeaves === 0) return;

		this.groveState = result.state;
		const nextProgress = deriveGroveProgress(
			this.groveState.totalLeaves,
			this.groveState.settledMatureTreeCount
		);
		if (nextProgress.currentTreeLeaves !== previousProgress.currentTreeLeaves) {
			this.groveGrowthToken += 1;
		}
		saveGroveState(this.groveState);
	}

	private settleGrove() {
		const settledGrove = settleMatureTrees(this.groveState);
		if (settledGrove === this.groveState) return;

		this.groveState = settledGrove;
		saveGroveState(this.groveState);
	}

	private playSound(sound: HTMLAudioElement | null) {
		if (!sound || !this.preferences.soundEnabled) return;
		sound.currentTime = 0;
		void sound.play().catch(() => {
			// Some browsers may block non-gesture audio if autoplay permission is unavailable.
		});
	}

	private playRandomMajorNote(sound: HTMLAudioElement | null, semitoneChoices: readonly number[]) {
		if (!sound || !this.preferences.soundEnabled) return;
		const semitones = semitoneChoices[Math.floor(Math.random() * semitoneChoices.length)];
		sound.preservesPitch = false;
		sound.playbackRate = 2 ** (semitones / 12);
		this.playSound(sound);
	}
}

export function provideFocusWorkspace(workspace: FocusWorkspace) {
	setContext(FOCUS_WORKSPACE_CONTEXT, workspace);
}

export function useFocusWorkspace(): FocusWorkspace {
	return getContext<FocusWorkspace>(FOCUS_WORKSPACE_CONTEXT);
}
