import { readJson, storageKey } from '$lib/app/storage';
import type { FocusSessionRecord } from '$lib/features/focus-session/focusSession.types';
import { normalizeSessionHistory } from './sessionHistory.state';
export { removeSessionById, restoreSessionRecord } from './sessionHistory.state';

export const HISTORY_STORAGE_KEY = storageKey('session-history');

// Legacy localStorage reader used only by the one-time IndexedDB migration.

type StoredSessionHistory = {
	version: 1;
	items: unknown;
};

export function loadSessionHistory(): FocusSessionRecord[] {
	const stored = readJson<unknown>(HISTORY_STORAGE_KEY, []);
	return normalizeSessionHistory(isStoredSessionHistory(stored) ? stored.items : stored);
}

function isStoredSessionHistory(value: unknown): value is StoredSessionHistory {
	return Boolean(value) && typeof value === 'object' && (value as StoredSessionHistory).version === 1;
}
