import type { FocusTask } from './focusTask.types.ts';

const TASK_LIMIT = 100;

export function normalizeFocusTasks(value: unknown): FocusTask[] {
	if (!Array.isArray(value)) return [];

	return value
		.filter(
			(task): task is Partial<FocusTask> & { id: string; title: string; createdAt: string } =>
				Boolean(task) &&
				typeof task.id === 'string' &&
				typeof task.title === 'string' &&
				typeof task.createdAt === 'string' &&
				task.title.trim().length > 0
		)
		.map((task) => ({
			id: task.id,
			title: task.title.trim().slice(0, 80),
			createdAt: task.createdAt,
			updatedAt: typeof task.updatedAt === 'string' ? task.updatedAt : task.createdAt,
			completedAt: typeof task.completedAt === 'string' ? task.completedAt : null,
			accumulatedSeconds: finiteNonNegative(task.accumulatedSeconds),
			sessionCount: finiteNonNegative(task.sessionCount)
		}))
		.slice(0, TASK_LIMIT);
}

export function sortFocusTasks(tasks: FocusTask[]): FocusTask[] {
	return [...tasks].sort((a, b) => {
		if (Boolean(a.completedAt) !== Boolean(b.completedAt)) return a.completedAt ? 1 : -1;
		return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
	});
}

function finiteNonNegative(value: unknown): number {
	return typeof value === 'number' && Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0;
}
