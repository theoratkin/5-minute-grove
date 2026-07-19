import { getContext, setContext } from 'svelte';
import type { AppPreferences } from '$lib/app/preferences.svelte';
import { notifyContractComplete, prepareTimerNotifications } from '$lib/app/notifications';
import { formatClock } from '$lib/app/time';
import {
	clearActiveSession,
	loadActiveSession,
	loadStartDuration,
	saveStartDuration,
	saveActiveSession
} from './focusSession.storage';
import { elapsedInCurrentContract, restoreFocusSession } from './focusSession.state';
import type { FocusPhase, FocusSessionRecord } from './focusSession.types';
import {
	FIVE_MINUTES_SECONDS,
	createSessionId,
	getSessionTitle,
	normalizeStartDuration
} from './focusSession.utils';
import {
	loadSessionHistory,
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
import { loadFocusTasks, saveFocusTasks } from '$lib/features/focus-list/focusTask.storage';
import {
	createUntitledTask,
	removeEmptyUntitledTask,
	sortFocusTasks,
	UNTITLED_TASK_ID,
	UNTITLED_TASK_TITLE
} from '$lib/features/focus-list/focusTask.state';
import type { FocusTask } from '$lib/features/focus-list/focusTask.types';

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
	activeTaskId = $state<string | null>(null);
	segmentEndsAt = $state<number | null>(null);
	history = $state<FocusSessionRecord[]>([]);
	tasks = $state<FocusTask[]>([]);
	hydrated = $state(false);
	toastMessage = $state('');
	groveState = $state<GroveState>(emptyGroveState());
	groveGrowthToken = $state(0);

	private startOrExtendSound: HTMLAudioElement | null = null;
	private addOneMinuteSound: HTMLAudioElement | null = null;
	private timerFinishSound: HTMLAudioElement | null = null;
	private timerInterval: ReturnType<typeof setInterval> | undefined;

	constructor(private preferences: AppPreferences) {}

	get activeTitle() {
		const activeTask = this.tasks.find((task) => task.id === this.activeTaskId);
		if (activeTask) return activeTask.title;
		return getSessionTitle(this.intention);
	}

	get canCompleteActiveTask() {
		return this.activeTaskId !== null && this.activeTaskId !== UNTITLED_TASK_ID;
	}

	get taskInputValue() {
		return this.activeTaskId === UNTITLED_TASK_ID ? '' : this.intention;
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
			taskId: this.activeTaskId,
			title: this.activeTitle,
			startedAt: this.sessionStartedAt,
			endedAt: new Date().toISOString(),
			completedContracts: this.completedContracts,
			extensionCount: this.extensionCount,
			totalSeconds: this.sessionTimeSeconds
		};
	}

	setup() {
		const startDuration = loadStartDuration();
		this.remainingSeconds = startDuration;
		this.segmentDurationSeconds = startDuration;
		this.history = loadSessionHistory();
		this.tasks = sortFocusTasks(loadFocusTasks());
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
			this.activeTaskId = restored.taskId;
			this.recoverActiveTask();
			this.segmentEndsAt = restored.segmentEndsAt;
			this.toastMessage = restored.completedWhileAway
				? 'Your five-minute contract finished while you were away.'
				: 'Your focus was restored.';
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
		document.removeEventListener('visibilitychange', this.syncTimer);
	}

	persistActiveSession() {
		if (!this.hydrated) return;
		if (this.phase === 'idle' || !this.sessionStartedAt || !this.activeSessionId) {
			clearActiveSession();
			return;
		}

		saveActiveSession({
			version: 2,
			taskId: this.activeTaskId,
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
		this.ensureTaskForIntention();

		this.sessionStartedAt = new Date().toISOString();
		this.activeSessionId = createSessionId();
		this.completedContracts = 0;
		this.extensionCount = 0;
		this.elapsedSessionSeconds = 0;
		const startDuration = normalizeStartDuration(this.remainingSeconds);
		this.remainingSeconds = startDuration;
		this.segmentDurationSeconds = startDuration;
		this.segmentEndsAt = Date.now() + startDuration * 1000;
		saveStartDuration(startDuration);
		this.phase = 'running';
	}

	setStartDuration(seconds: number) {
		if (this.phase !== 'idle') return;
		const duration = normalizeStartDuration(seconds);
		this.remainingSeconds = duration;
		this.segmentDurationSeconds = duration;
		saveStartDuration(duration);
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

	finishSession(message = 'Focus saved.', clearIntention = false) {
		if (!this.sessionStartedAt || !this.activeSessionId || this.sessionTimeSeconds <= 0) return;

		const record: FocusSessionRecord = {
			id: this.activeSessionId,
			taskId: this.activeTaskId,
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
		this.creditTask(record);
		this.resetSession(clearIntention);
		this.toastMessage = message;
		if (clearIntention) {
			requestAnimationFrame(() =>
				document.querySelector<HTMLInputElement>('[data-task-name]')?.focus()
			);
		}
	}

	stopSessionEarly() {
		this.finishSession();
	}

	addTask(title: string): FocusTask | null {
		const cleanTitle = title.trim().slice(0, 80);
		if (!cleanTitle) return null;

		const now = new Date().toISOString();
		const task: FocusTask = {
			id: createSessionId().replace('session', 'task'),
			title: cleanTitle,
			createdAt: now,
			updatedAt: now,
			completedAt: null,
			accumulatedSeconds: 0,
			sessionCount: 0
		};
		this.tasks = sortFocusTasks([task, ...this.tasks]);
		saveFocusTasks(this.tasks);
		return task;
	}

	startTask(task: FocusTask) {
		if (this.phase !== 'idle') {
			this.toastMessage = 'Stop your current focus before starting another task.';
			return false;
		}
		this.activeTaskId = task.id;
		this.intention = task.title;
		this.startSession();
		return true;
	}

	assignActiveTask(id: string) {
		if (this.phase === 'idle') return;
		const task = this.tasks.find((item) => item.id === id && !item.completedAt);
		if (!task || task.id === this.activeTaskId) return;

		const previousTaskId = this.activeTaskId;
		this.activeTaskId = task.id;
		this.intention = task.title;
		if (previousTaskId === UNTITLED_TASK_ID) {
			this.tasks = removeEmptyUntitledTask(this.tasks);
			saveFocusTasks(this.tasks);
		}
		this.toastMessage = `This focus is now assigned to “${task.title}”.`;
	}

	toggleTaskDone(id: string) {
		const task = this.tasks.find((item) => item.id === id);
		if (!task || id === UNTITLED_TASK_ID) return;

		if (id === this.activeTaskId && this.phase !== 'idle') {
			if (this.sessionTimeSeconds > 0) this.finishSession('Task marked done.');
			else this.resetSession(true);
		}
		const now = new Date().toISOString();
		const completedAt = task.completedAt ? null : now;
		this.tasks = sortFocusTasks(
			this.tasks.map((item) =>
				item.id === id ? { ...item, completedAt, updatedAt: now } : item
			)
		);
		saveFocusTasks(this.tasks);
		this.toastMessage = completedAt ? 'Task marked done.' : 'Task moved back to your list.';
		if (completedAt && id === this.activeTaskId) {
			this.activeTaskId = null;
			this.intention = '';
		}
	}

	completeActiveTask() {
		if (!this.activeTaskId || this.activeTaskId === UNTITLED_TASK_ID) {
			this.finishSession();
			return;
		}
		this.toggleTaskDone(this.activeTaskId);
	}

	updateTaskTitle(id: string, title: string) {
		const cleanTitle = title.trim().slice(0, 80);
		if (!cleanTitle || id === UNTITLED_TASK_ID) return;
		const now = new Date().toISOString();
		this.tasks = sortFocusTasks(
			this.tasks.map((task) =>
				task.id === id ? { ...task, title: cleanTitle, updatedAt: now } : task
			)
		);
		if (id === this.activeTaskId) this.intention = cleanTitle;
		saveFocusTasks(this.tasks);
	}

	updateIntention(title: string) {
		const cleanTitle = title.trim().slice(0, 80);
		this.intention = title;
		if (!cleanTitle) {
			if (this.phase === 'idle') this.activeTaskId = null;
			return;
		}
		if (this.activeTaskId === UNTITLED_TASK_ID) {
			const task = this.addTask(cleanTitle);
			if (task) {
				this.activeTaskId = task.id;
				this.intention = task.title;
			}
			return;
		}
		if (this.activeTaskId) this.updateTaskTitle(this.activeTaskId, cleanTitle);
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
		const startDuration = loadStartDuration();
		this.remainingSeconds = startDuration;
		this.segmentDurationSeconds = startDuration;
		this.completedContracts = 0;
		this.extensionCount = 0;
		this.elapsedSessionSeconds = 0;
		this.sessionStartedAt = null;
		this.activeSessionId = null;
		this.segmentEndsAt = null;
		if (clearIntention) {
			this.intention = '';
			this.activeTaskId = null;
		}
	}

	private ensureTaskForIntention() {
		const title = this.intention.trim();
		if (!title) {
			const untitled = this.getOrCreateUntitledTask();
			this.activeTaskId = untitled.id;
			this.intention = untitled.title;
			return;
		}
		if (this.activeTaskId && this.tasks.some((task) => task.id === this.activeTaskId)) return;
		this.activeTaskId = this.addTask(title)?.id ?? null;
	}

	private creditTask(record: FocusSessionRecord) {
		if (!record.taskId) return;
		const now = record.endedAt;
		this.tasks = sortFocusTasks(
			this.tasks.map((task) =>
				task.id === record.taskId
					? {
							...task,
							updatedAt: now,
							accumulatedSeconds: task.accumulatedSeconds + record.totalSeconds,
							sessionCount: task.sessionCount + 1
						}
					: task
			)
		);
		saveFocusTasks(this.tasks);
	}

	private getOrCreateUntitledTask(): FocusTask {
		const existing = this.tasks.find((task) => task.id === UNTITLED_TASK_ID);
		if (existing) return existing;

		const untitled = createUntitledTask();
		this.tasks = sortFocusTasks([untitled, ...this.tasks]);
		saveFocusTasks(this.tasks);
		return untitled;
	}

	private recoverActiveTask() {
		if (this.activeTaskId && this.tasks.some((task) => task.id === this.activeTaskId)) return;
		const title = this.intention.trim();
		if (!title || title.toLocaleLowerCase() === UNTITLED_TASK_TITLE.toLocaleLowerCase() || title === 'Session') {
			const untitled = this.getOrCreateUntitledTask();
			this.activeTaskId = untitled.id;
			this.intention = untitled.title;
			return;
		}
		const task = this.addTask(title);
		this.activeTaskId = task?.id ?? this.getOrCreateUntitledTask().id;
		this.intention = task?.title ?? UNTITLED_TASK_TITLE;
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
