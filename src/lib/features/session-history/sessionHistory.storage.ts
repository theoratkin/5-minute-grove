import { readJson, writeJson } from '$lib/app/storage';
import type { FocusSessionRecord } from '$lib/features/focus-session/focusSession.types';
import { normalizeSessionHistory } from './sessionHistory.state';
export { removeSessionById, restoreSessionRecord } from './sessionHistory.state';

const HISTORY_KEY = 'just-5-more-minutes:session-history';
const HISTORY_LIMIT = 12;

export function loadSessionHistory(): FocusSessionRecord[] {
	return normalizeSessionHistory(readJson<unknown>(HISTORY_KEY, []));
}

export function saveSessionHistory(records: FocusSessionRecord[]): void {
	writeJson(HISTORY_KEY, records.slice(0, HISTORY_LIMIT));
}
