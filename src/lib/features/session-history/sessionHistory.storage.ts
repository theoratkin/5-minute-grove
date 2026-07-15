import { readJson, writeJson } from '$lib/app/storage';
import type { FocusSessionRecord } from '$lib/features/focus-session/focusSession.types';

const HISTORY_KEY = 'just-5-more-minutes:session-history';
const HISTORY_LIMIT = 12;

export function loadSessionHistory(): FocusSessionRecord[] {
	const records = readJson<Array<FocusSessionRecord & { intention?: string }>>(HISTORY_KEY, []);
	if (!Array.isArray(records)) return [];

	return records
		.filter((record) => record && typeof record.id === 'string' && typeof record.startedAt === 'string')
		.map((record) => ({
			id: record.id,
			title:
				record.title?.trim() === 'Sprint'
					? 'Session'
					: record.title?.trim() || record.intention?.trim() || 'Session',
			startedAt: record.startedAt,
			endedAt: record.endedAt || record.startedAt,
			completedContracts: Math.max(0, record.completedContracts || 0),
			extensionCount: Math.max(0, record.extensionCount || 0),
			totalSeconds: Math.max(0, record.totalSeconds || 0)
		}))
		.slice(0, HISTORY_LIMIT);
}

export function saveSessionHistory(records: FocusSessionRecord[]): void {
	writeJson(HISTORY_KEY, records.slice(0, HISTORY_LIMIT));
}
