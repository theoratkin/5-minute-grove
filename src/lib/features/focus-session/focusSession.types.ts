export type FocusPhase = 'idle' | 'running' | 'paused' | 'contract-complete';

export type SessionEndReason = 'done' | 'break' | 'switch';

export interface FocusSessionRecord {
	id: string;
	title: string;
	startedAt: string;
	endedAt: string;
	completedContracts: number;
	extensionCount: number;
	totalSeconds: number;
}
