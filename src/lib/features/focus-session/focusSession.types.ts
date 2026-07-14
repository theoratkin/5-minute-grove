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
