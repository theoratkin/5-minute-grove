export type FocusPhase = 'idle' | 'running' | 'contract-complete';

export type SessionEndReason = 'done' | 'break' | 'switch';

export interface FocusSessionRecord {
	id: string;
	intention: string;
	startedAt: string;
	endedAt: string;
	completedContracts: number;
	extensionCount: number;
	totalSeconds: number;
	reason: SessionEndReason;
}
