export type FocusPhase = 'idle' | 'running' | 'paused' | 'contract-complete';

export interface FocusSessionRecord {
	id: string;
	title: string;
	startedAt: string;
	endedAt: string;
	completedContracts: number;
	extensionCount: number;
	totalSeconds: number;
}

export interface ActiveFocusSession {
	version: 1;
	intention: string;
	phase: Exclude<FocusPhase, 'idle'>;
	remainingSeconds: number;
	completedContracts: number;
	extensionCount: number;
	elapsedSessionSeconds: number;
	sessionStartedAt: string;
	activeSessionId: string;
	segmentEndsAt: number | null;
}
