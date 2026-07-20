import type { FocusSessionRecord } from '../focus-session/focusSession.types.ts';

export function normalizeSessionHistory(value: unknown): FocusSessionRecord[] {
	if (!Array.isArray(value)) return [];

	const records = (value as Partial<FocusSessionRecord>[])
		.filter(
			(record): record is Partial<FocusSessionRecord> & { id: string; startedAt: string } =>
				Boolean(record) &&
				typeof record.id === 'string' &&
				record.id.trim().length > 0 &&
				typeof record.startedAt === 'string' &&
				isValidDate(record.startedAt)
		)
		.map((record) => ({
			id: record.id.trim(),
			taskId:
				typeof record.taskId === 'string' && record.taskId.trim() ? record.taskId.trim() : null,
			title: normalizeTitle(record.title) || 'Session',
			startedAt: record.startedAt,
			endedAt: isValidDate(record.endedAt) ? record.endedAt : record.startedAt,
			completedContracts: finiteCount(record.completedContracts),
			extensionCount: finiteCount(record.extensionCount),
			totalSeconds: finiteCount(record.totalSeconds)
		}));

	const recordsById = new Map<string, FocusSessionRecord>();
	for (const record of records) {
		const existing = recordsById.get(record.id);
		if (!existing || new Date(record.endedAt).getTime() >= new Date(existing.endedAt).getTime()) {
			recordsById.set(record.id, record);
		}
	}

	return [...recordsById.values()].sort(
		(a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()
	);
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
		.sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());
}

function finiteCount(value: unknown): number {
	return typeof value === 'number' && Number.isFinite(value)
		? Math.max(0, Math.floor(value))
		: 0;
}

function isValidDate(value: unknown): value is string {
	return typeof value === 'string' && Number.isFinite(Date.parse(value));
}

function normalizeTitle(value: unknown): string {
	return typeof value === 'string' ? value.trim() : '';
}
