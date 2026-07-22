export type FocusPhase = 'idle' | 'running' | 'paused' | 'contract-complete';
export type FocusClockMode = 'countdown' | 'count-up';

export interface FocusSessionRecord {
	id: string;
	taskId?: string | null;
	title: string;
	startedAt: string;
	endedAt: string;
	completedContracts: number;
	extensionCount: number;
	totalSeconds: number;
}

export interface ActiveFocusSession {
	version: 3;
	taskId: string | null;
	intention: string;
	clockMode: FocusClockMode;
	phase: Exclude<FocusPhase, 'idle'>;
	remainingSeconds: number;
	segmentDurationSeconds: number;
	completedContracts: number;
	extensionCount: number;
	elapsedSessionSeconds: number;
	sessionStartedAt: string;
	activeSessionId: string;
	segmentEndsAt: number | null;
	countUpStartedAt: number | null;
}
