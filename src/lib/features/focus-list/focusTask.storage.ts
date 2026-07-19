import { readJson, storageKey, writeJson } from '$lib/app/storage';
import { normalizeFocusTasks } from './focusTask.state';
import type { FocusTask } from './focusTask.types';

const TASKS_KEY = storageKey('focus-tasks');

export function loadFocusTasks(): FocusTask[] {
	return normalizeFocusTasks(readJson<unknown>(TASKS_KEY, []));
}

export function saveFocusTasks(tasks: FocusTask[]): void {
	writeJson(TASKS_KEY, tasks.slice(0, 100));
}
