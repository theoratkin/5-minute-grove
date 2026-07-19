export interface FocusTask {
	id: string;
	title: string;
	createdAt: string;
	updatedAt: string;
	completedAt: string | null;
	accumulatedSeconds: number;
	sessionCount: number;
}
