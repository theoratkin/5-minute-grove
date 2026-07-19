export type FocusPhase = 'idle' | 'running' | 'paused' | 'contract-complete';

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
	version: 2;
	taskId: string | null;
	intention: string;
	phase: Exclude<FocusPhase, 'idle'>;
	remainingSeconds: number;
	segmentDurationSeconds: number;
	completedContracts: number;
	extensionCount: number;
	elapsedSessionSeconds: number;
	sessionStartedAt: string;
	activeSessionId: string;
	segmentEndsAt: number | null;
}
