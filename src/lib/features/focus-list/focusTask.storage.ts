import { readJson, storageKey } from '$lib/app/storage';
import { normalizeFocusTasks } from './focusTask.state';
import type { FocusTask } from './focusTask.types';

export const TASKS_STORAGE_KEY = storageKey('focus-tasks');

// Legacy localStorage reader used only by the one-time IndexedDB migration.

type StoredFocusTasks = {
	version: 1;
	items: unknown;
};

export function loadFocusTasks(): FocusTask[] {
	const stored = readJson<unknown>(TASKS_STORAGE_KEY, []);
	return normalizeFocusTasks(isStoredFocusTasks(stored) ? stored.items : stored);
}

function isStoredFocusTasks(value: unknown): value is StoredFocusTasks {
	return Boolean(value) && typeof value === 'object' && (value as StoredFocusTasks).version === 1;
}
