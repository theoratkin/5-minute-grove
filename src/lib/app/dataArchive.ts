import { normalizeFocusTasks } from '../features/focus-list/focusTask.state.ts';
import type { FocusTask } from '../features/focus-list/focusTask.types.ts';
import type { FocusSessionRecord } from '../features/focus-session/focusSession.types.ts';
import { normalizeGroveState } from '../features/grove/grove.state.ts';
import type { GroveState } from '../features/grove/grove.types.ts';
import { normalizeSessionHistory } from '../features/session-history/sessionHistory.state.ts';

export const DATA_ARCHIVE_FORMAT = '5-minute-grove';
export const DATA_ARCHIVE_SCHEMA_VERSION = 1;

export interface DurableData {
	tasks: FocusTask[];
	sessions: FocusSessionRecord[];
	grove: GroveState;
}

export interface DataArchive {
	format: typeof DATA_ARCHIVE_FORMAT;
	schemaVersion: typeof DATA_ARCHIVE_SCHEMA_VERSION;
	exportedAt: string;
	data: DurableData;
}

export type DataImportMode = 'replace' | 'merge';

export class DataArchiveError extends Error {
	constructor(message: string) {
		super(message);
		this.name = 'DataArchiveError';
	}
}

export function createDataArchive(
	data: DurableData,
	exportedAt = new Date().toISOString()
): DataArchive {
	if (!isValidDate(exportedAt)) throw new DataArchiveError('The export timestamp is invalid.');

	return {
		format: DATA_ARCHIVE_FORMAT,
		schemaVersion: DATA_ARCHIVE_SCHEMA_VERSION,
		exportedAt,
		data: normalizeDurableData(data)
	};
}

export function serializeDataArchive(archive: DataArchive): string {
	return JSON.stringify(createDataArchive(archive.data, archive.exportedAt), null, 2);
}

export function parseDataArchive(input: string | unknown): DataArchive {
	let value: unknown = input;
	if (typeof input === 'string') {
		try {
			value = JSON.parse(input) as unknown;
		} catch {
			throw new DataArchiveError('This file is not valid JSON.');
		}
	}

	if (!value || typeof value !== 'object') {
		throw new DataArchiveError('This file is not a 5 Minute Grove archive.');
	}

	const candidate = value as Record<string, unknown>;
	if (candidate.format !== DATA_ARCHIVE_FORMAT) {
		throw new DataArchiveError('This file is not a 5 Minute Grove archive.');
	}
	if (candidate.schemaVersion !== DATA_ARCHIVE_SCHEMA_VERSION) {
		throw new DataArchiveError(`Archive schema version ${String(candidate.schemaVersion)} is not supported.`);
	}
	if (!isValidDate(candidate.exportedAt)) {
		throw new DataArchiveError('The archive export timestamp is invalid.');
	}

	const data = candidate.data;
	if (!data || typeof data !== 'object') {
		throw new DataArchiveError('The archive does not contain durable app data.');
	}
	assertValidDataShape(data as Record<string, unknown>);

	return createDataArchive(data as unknown as DurableData, candidate.exportedAt);
}

export function mergeDurableData(current: DurableData, incoming: DurableData): DurableData {
	const normalizedCurrent = normalizeDurableData(current);
	const normalizedIncoming = normalizeDurableData(incoming);
	if (isEmptyDurableData(normalizedCurrent)) return normalizedIncoming;

	const sessions = normalizeSessionHistory([
		...normalizedCurrent.sessions,
		...normalizedIncoming.sessions
	]);
	const tasks = mergeTasks(normalizedCurrent, normalizedIncoming, sessions);
	const grove = mergeGrove(normalizedCurrent.grove, normalizedIncoming.grove);

	return { tasks, sessions, grove };
}

export function applyDataImport(
	current: DurableData,
	archive: DataArchive,
	mode: DataImportMode
): DurableData {
	return mode === 'replace'
		? normalizeDurableData(archive.data)
		: mergeDurableData(current, archive.data);
}

export function normalizeDurableData(data: DurableData): DurableData {
	return {
		tasks: normalizeFocusTasks(data.tasks),
		sessions: normalizeSessionHistory(data.sessions),
		grove: normalizeGroveState(data.grove)
	};
}

function assertValidDataShape(data: Record<string, unknown>): void {
	if (!Array.isArray(data.tasks) || data.tasks.some((task) => normalizeFocusTasks([task]).length !== 1)) {
		throw new DataArchiveError('The archive contains an invalid task record.');
	}
	if (
		!Array.isArray(data.sessions) ||
		data.sessions.some((session) => normalizeSessionHistory([session]).length !== 1)
	) {
		throw new DataArchiveError('The archive contains an invalid session record.');
	}
	if (!data.grove || typeof data.grove !== 'object') {
		throw new DataArchiveError('The archive contains invalid grove data.');
	}
	const groveVersion = (data.grove as Record<string, unknown>).version;
	if (groveVersion !== 1 && groveVersion !== 2) {
		throw new DataArchiveError(`Grove schema version ${String(groveVersion)} is not supported.`);
	}
}

function mergeTasks(
	current: DurableData,
	incoming: DurableData,
	mergedSessions: FocusSessionRecord[]
): FocusTask[] {
	const currentById = new Map(current.tasks.map((task) => [task.id, task]));
	const incomingById = new Map(incoming.tasks.map((task) => [task.id, task]));
	const mergedSessionStats = taskSessionStats(mergedSessions);
	const currentSessionStats = taskSessionStats(current.sessions);
	const incomingSessionStats = taskSessionStats(incoming.sessions);
	const taskIds = new Set([...currentById.keys(), ...incomingById.keys()]);
	const tasks: FocusTask[] = [];

	for (const id of taskIds) {
		const currentTask = currentById.get(id);
		const incomingTask = incomingById.get(id);
		const winner = chooseLatestTask(currentTask, incomingTask);
		if (!winner) continue;

		const currentResidual = aggregateResidual(currentTask, currentSessionStats.get(id));
		const incomingResidual = aggregateResidual(incomingTask, incomingSessionStats.get(id));
		const mergedStats = mergedSessionStats.get(id) ?? { seconds: 0, count: 0 };
		tasks.push({
			...winner,
			accumulatedSeconds:
				Math.max(currentResidual.seconds, incomingResidual.seconds) + mergedStats.seconds,
			sessionCount: Math.max(currentResidual.count, incomingResidual.count) + mergedStats.count
		});
	}

	return normalizeFocusTasks(tasks);
}

function chooseLatestTask(
	current: FocusTask | undefined,
	incoming: FocusTask | undefined
): FocusTask | undefined {
	if (!current) return incoming;
	if (!incoming) return current;
	return Date.parse(incoming.updatedAt) >= Date.parse(current.updatedAt) ? incoming : current;
}

type Aggregate = { seconds: number; count: number };

function taskSessionStats(sessions: FocusSessionRecord[]): Map<string, Aggregate> {
	const stats = new Map<string, Aggregate>();
	for (const session of sessions) {
		if (!session.taskId) continue;
		const current = stats.get(session.taskId) ?? { seconds: 0, count: 0 };
		current.seconds += session.totalSeconds;
		current.count += 1;
		stats.set(session.taskId, current);
	}
	return stats;
}

function aggregateResidual(task: FocusTask | undefined, retained: Aggregate | undefined): Aggregate {
	if (!task) return { seconds: 0, count: 0 };
	return {
		seconds: Math.max(0, task.accumulatedSeconds - (retained?.seconds ?? 0)),
		count: Math.max(0, task.sessionCount - (retained?.count ?? 0))
	};
}

function mergeGrove(current: GroveState, incoming: GroveState): GroveState {
	const creditedMinutesBySession = { ...current.creditedMinutesBySession };
	let addedLeaves = 0;
	for (const [sessionId, importedMinutes] of Object.entries(incoming.creditedMinutesBySession)) {
		const currentMinutes = creditedMinutesBySession[sessionId] ?? 0;
		addedLeaves += Math.max(0, importedMinutes - currentMinutes);
		creditedMinutesBySession[sessionId] = Math.max(currentMinutes, importedMinutes);
	}

	const totalLeaves = current.totalLeaves + addedLeaves;
	return normalizeGroveState({
		version: 2,
		totalLeaves,
		creditedMinutesBySession,
		settledMatureTreeCount: Math.max(
			current.settledMatureTreeCount,
			incoming.settledMatureTreeCount
		)
	});
}

function isEmptyDurableData(data: DurableData): boolean {
	return (
		data.tasks.length === 0 &&
		data.sessions.length === 0 &&
		data.grove.totalLeaves === 0 &&
		Object.keys(data.grove.creditedMinutesBySession).length === 0
	);
}

function isValidDate(value: unknown): value is string {
	return typeof value === 'string' && Number.isFinite(Date.parse(value));
}
