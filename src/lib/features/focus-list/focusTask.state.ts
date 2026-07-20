import type { FocusTask } from './focusTask.types.ts';

export const UNTITLED_TASK_ID = 'focus-task-untitled';
export const UNTITLED_TASK_TITLE = 'Anything';

export function normalizeFocusTasks(value: unknown): FocusTask[] {
	if (!Array.isArray(value)) return [];

	const normalized = value
		.filter(
			(task): task is Partial<FocusTask> & { id: string; title: string; createdAt: string } =>
					Boolean(task) &&
					typeof task.id === 'string' &&
					task.id.trim().length > 0 &&
					typeof task.title === 'string' &&
					typeof task.createdAt === 'string' &&
					isValidDate(task.createdAt) &&
					task.title.trim().length > 0
		)
		.map((task) => ({
			id: isUntitledTask(task) ? UNTITLED_TASK_ID : task.id.trim(),
			title: isUntitledTask(task) ? UNTITLED_TASK_TITLE : task.title.trim().slice(0, 80),
			createdAt: task.createdAt,
			updatedAt: isValidDate(task.updatedAt) ? task.updatedAt : task.createdAt,
			completedAt:
				isUntitledTask(task) ? null : isValidDate(task.completedAt) ? task.completedAt : null,
			accumulatedSeconds: finiteNonNegative(task.accumulatedSeconds),
			sessionCount: finiteNonNegative(task.sessionCount)
		}));

	const tasksById = new Map<string, FocusTask>();
	for (const task of normalized.filter((item) => item.id !== UNTITLED_TASK_ID)) {
		const existing = tasksById.get(task.id);
		if (!existing || new Date(task.updatedAt).getTime() >= new Date(existing.updatedAt).getTime()) {
			tasksById.set(task.id, task);
		}
	}

	const untitledTasks = normalized.filter((task) => task.id === UNTITLED_TASK_ID);
	if (untitledTasks.length === 0) return [...tasksById.values()];

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

	return [
		untitled,
		...tasksById.values()
	];
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

export function assignUntitledTask(tasks: FocusTask[], targetId: string): FocusTask[] {
	const untitled = tasks.find((task) => task.id === UNTITLED_TASK_ID);
	if (!untitled || targetId === UNTITLED_TASK_ID || !tasks.some((task) => task.id === targetId)) {
		return tasks;
	}

	return tasks
		.filter((task) => task.id !== UNTITLED_TASK_ID)
		.map((task) =>
			task.id === targetId
				? {
						...task,
						updatedAt: untitled.updatedAt > task.updatedAt ? untitled.updatedAt : task.updatedAt,
						accumulatedSeconds: task.accumulatedSeconds + untitled.accumulatedSeconds,
						sessionCount: task.sessionCount + untitled.sessionCount
					}
				: task
		);
}

export function sortFocusTasks(tasks: FocusTask[]): FocusTask[] {
	const untitled = tasks.find((task) => task.id === UNTITLED_TASK_ID);
	const openTasks = tasks.filter(
		(task) => !task.completedAt && task.id !== UNTITLED_TASK_ID
	);
	const completedTasks = tasks
		.filter((task) => task.completedAt)
		.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
	return [...(untitled ? [untitled] : []), ...openTasks, ...completedTasks];
}

export function moveOpenFocusTask(
	tasks: FocusTask[],
	id: string,
	direction: -1 | 1
): FocusTask[] {
	const openTasks = tasks.filter((task) => !task.completedAt);
	const completedTasks = tasks.filter((task) => task.completedAt);
	const currentIndex = openTasks.findIndex((task) => task.id === id);
	const nextIndex = currentIndex + direction;
	if (
		currentIndex < 0 ||
		id === UNTITLED_TASK_ID ||
		nextIndex < 0 ||
		nextIndex >= openTasks.length ||
		openTasks[nextIndex].id === UNTITLED_TASK_ID
	) return tasks;

	const reordered = [...openTasks];
	[reordered[currentIndex], reordered[nextIndex]] = [
		reordered[nextIndex],
		reordered[currentIndex]
	];
	return [...reordered, ...completedTasks];
}

export function reorderOpenFocusTasks(tasks: FocusTask[], orderedIds: string[]): FocusTask[] {
	const openTasks = tasks.filter((task) => !task.completedAt);
	const completedTasks = tasks.filter((task) => task.completedAt);
	if (orderedIds.length !== openTasks.length) return tasks;
	const tasksById = new Map(openTasks.map((task) => [task.id, task]));
	if (new Set(orderedIds).size !== openTasks.length || orderedIds.some((id) => !tasksById.has(id))) {
		return tasks;
	}
	const reorderedIds = orderedIds.includes(UNTITLED_TASK_ID)
		? [UNTITLED_TASK_ID, ...orderedIds.filter((id) => id !== UNTITLED_TASK_ID)]
		: orderedIds;
	const reordered = reorderedIds.map((id) => tasksById.get(id)!);
	if (reordered.every((task, index) => task.id === openTasks[index].id)) return tasks;
	return [...reordered, ...completedTasks];
}

function finiteNonNegative(value: unknown): number {
	return typeof value === 'number' && Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0;
}

function isValidDate(value: unknown): value is string {
	return typeof value === 'string' && Number.isFinite(Date.parse(value));
}

function isUntitledTask(task: { id: string; title: string }): boolean {
	const title = task.title.trim().toLocaleLowerCase();
	return (
		task.id === UNTITLED_TASK_ID ||
		title === UNTITLED_TASK_TITLE.toLocaleLowerCase() ||
		title === 'untitled' ||
		title === 'untitled task'
	);
}
