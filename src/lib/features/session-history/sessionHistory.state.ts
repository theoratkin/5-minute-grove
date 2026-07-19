import type { FocusSessionRecord } from '../focus-session/focusSession.types.ts';

const HISTORY_LIMIT = 12;

type LegacySessionRecord = Partial<FocusSessionRecord> & { intention?: string };

export function normalizeSessionHistory(value: unknown): FocusSessionRecord[] {
	if (!Array.isArray(value)) return [];

	return (value as LegacySessionRecord[])
		.filter(
			(record): record is LegacySessionRecord & { id: string; startedAt: string } =>
				Boolean(record) && typeof record.id === 'string' && typeof record.startedAt === 'string'
		)
		.map((record) => ({
			id: record.id,
			taskId: typeof record.taskId === 'string' ? record.taskId : null,
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

export function removeSessionById(
	records: FocusSessionRecord[],
	id: string
): { records: FocusSessionRecord[]; removed: FocusSessionRecord | null } {
	return {
		records: records.filter((record) => record.id !== id),
		removed: records.find((record) => record.id === id) ?? null
	};
}

export function restoreSessionRecord(
	records: FocusSessionRecord[],
	record: FocusSessionRecord
): FocusSessionRecord[] {
	return [...records.filter((item) => item.id !== record.id), record]
		.sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime())
		.slice(0, HISTORY_LIMIT);
}
