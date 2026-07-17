export interface GroveState {
	version: 2;
	totalLeaves: number;
	creditedMinutesBySession: Record<string, number>;
	settledMatureTreeCount: number;
}

export interface GroveSeedRecord {
	id: string;
	completedContracts: number;
	totalSeconds?: number;
}

export interface GroveProgress {
	matureTreeCount: number;
	currentTreeNumber: number;
	currentTreeLeaves: number;
}
