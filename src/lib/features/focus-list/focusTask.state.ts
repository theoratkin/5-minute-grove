import type { FocusTask } from './focusTask.types.ts';

const TASK_LIMIT = 100;
export const UNTITLED_TASK_ID = 'focus-task-untitled';
export const UNTITLED_TASK_TITLE = 'Untitled';

export function normalizeFocusTasks(value: unknown): FocusTask[] {
	if (!Array.isArray(value)) return [];

	const normalized = value
		.filter(
			(task): task is Partial<FocusTask> & { id: string; title: string; createdAt: string } =>
				Boolean(task) &&
				typeof task.id === 'string' &&
				typeof task.title === 'string' &&
				typeof task.createdAt === 'string' &&
				task.title.trim().length > 0
		)
		.map((task) => ({
			id: isUntitledTask(task) ? UNTITLED_TASK_ID : task.id,
			title: isUntitledTask(task) ? UNTITLED_TASK_TITLE : task.title.trim().slice(0, 80),
			createdAt: task.createdAt,
			updatedAt: typeof task.updatedAt === 'string' ? task.updatedAt : task.createdAt,
			completedAt:
				isUntitledTask(task) ? null : typeof task.completedAt === 'string' ? task.completedAt : null,
			accumulatedSeconds: finiteNonNegative(task.accumulatedSeconds),
			sessionCount: finiteNonNegative(task.sessionCount)
		}));

	const untitledTasks = normalized.filter((task) => task.id === UNTITLED_TASK_ID);
	const namedTasks = normalized.filter((task) => task.id !== UNTITLED_TASK_ID);
	if (untitledTasks.length === 0) return namedTasks.slice(0, TASK_LIMIT);

	const untitled = untitledTasks.reduce((merged, task) => ({
		...merged,
		createdAt:
			new Date(task.createdAt).getTime() < new Date(merged.createdAt).getTime()
				? task.createdAt
				: merged.createdAt,
		updatedAt:
			new Date(task.updatedAt).getTime() > new Date(merged.updatedAt).getTime()
				? task.updatedAt
				: merged.updatedAt,
		accumulatedSeconds: merged.accumulatedSeconds + task.accumulatedSeconds,
		sessionCount: merged.sessionCount + task.sessionCount
	}));

	return [untitled, ...namedTasks].slice(0, TASK_LIMIT);
}

export function createUntitledTask(now = new Date().toISOString()): FocusTask {
	return {
		id: UNTITLED_TASK_ID,
		title: UNTITLED_TASK_TITLE,
		createdAt: now,
		updatedAt: now,
		completedAt: null,
		accumulatedSeconds: 0,
		sessionCount: 0
	};
}

export function removeEmptyUntitledTask(tasks: FocusTask[]): FocusTask[] {
	return tasks.filter(
		(task) =>
			task.id !== UNTITLED_TASK_ID || task.accumulatedSeconds > 0 || task.sessionCount > 0
	);
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

function isUntitledTask(task: { id: string; title: string }): boolean {
	const title = task.title.trim().toLocaleLowerCase();
	return (
		task.id === UNTITLED_TASK_ID ||
		title === UNTITLED_TASK_TITLE.toLocaleLowerCase() ||
		title === 'untitled task'
	);
}
