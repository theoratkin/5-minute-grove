import { readJson, writeJson } from '$lib/app/storage';
import type { FocusSessionRecord } from '$lib/features/focus-session/focusSession.types';

const HISTORY_KEY = 'just-5-more-minutes:session-history';
const HISTORY_LIMIT = 12;

export function loadSessionHistory(): FocusSessionRecord[] {
	const records = readJson<FocusSessionRecord[]>(HISTORY_KEY, []);
	return Array.isArray(records) ? records.slice(0, HISTORY_LIMIT) : [];
}

export function saveSessionHistory(records: FocusSessionRecord[]): void {
	writeJson(HISTORY_KEY, records.slice(0, HISTORY_LIMIT));
}
