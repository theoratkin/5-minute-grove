import test from 'node:test';
import assert from 'node:assert/strict';
import {
	DataArchiveError,
	applyDataImport,
	createDataArchive,
	mergeDurableData,
	parseDataArchive,
	serializeDataArchive,
	type DurableData
} from '../src/lib/app/dataArchive.ts';
import type { FocusTask } from '../src/lib/features/focus-list/focusTask.types.ts';
import type { FocusSessionRecord } from '../src/lib/features/focus-session/focusSession.types.ts';
import { emptyGroveState } from '../src/lib/features/grove/grove.state.ts';

const exportedAt = '2026-07-19T12:00:00.000Z';

function task(overrides: Partial<FocusTask> = {}): FocusTask {
	return {
		id: 'task-one',
		title: 'Draft proposal',
		createdAt: '2026-07-18T10:00:00.000Z',
		updatedAt: '2026-07-18T10:00:00.000Z',
		completedAt: null,
		accumulatedSeconds: 0,
		sessionCount: 0,
		...overrides
	};
}

function session(overrides: Partial<FocusSessionRecord> = {}): FocusSessionRecord {
	return {
		id: 'session-one',
		taskId: 'task-one',
		title: 'Draft proposal',
		startedAt: '2026-07-18T10:00:00.000Z',
		endedAt: '2026-07-18T10:05:00.000Z',
		completedContracts: 1,
		extensionCount: 0,
		totalSeconds: 300,
		...overrides
	};
}

function data(overrides: Partial<DurableData> = {}): DurableData {
	return { tasks: [], sessions: [], grove: emptyGroveState(), ...overrides };
}

test('round-trips a versioned archive', () => {
	const archive = createDataArchive(
		data({ tasks: [task()], sessions: [session()] }),
		exportedAt
	);
	const parsed = parseDataArchive(serializeDataArchive(archive));

	assert.equal(parsed.format, '5-minute-grove');
	assert.equal(parsed.schemaVersion, 1);
	assert.equal(parsed.exportedAt, exportedAt);
	assert.equal(parsed.data.tasks[0].title, 'Draft proposal');
});

test('rejects malformed and unsupported archives before import', () => {
	assert.throws(() => parseDataArchive('{broken'), DataArchiveError);
	assert.throws(
		() => parseDataArchive({ format: '5-minute-grove', schemaVersion: 99 }),
		/Archive schema version 99 is not supported/
	);
	assert.throws(
		() =>
			parseDataArchive({
				format: '5-minute-grove',
				schemaVersion: 0,
				exportedAt,
				data: data()
			}),
		/no migration registered from version 0 to version 1/
	);

	const archive = createDataArchive(data(), exportedAt) as unknown as Record<string, unknown>;
	archive.data = { tasks: [{ id: '' }], sessions: [], grove: emptyGroveState() };
	assert.throws(() => parseDataArchive(archive), /invalid task record/);
});

test('replace imports use only normalized archive data', () => {
	const current = data({ tasks: [task({ title: 'Old title' })] });
	const archive = createDataArchive(data({ tasks: [task({ title: 'New title' })] }), exportedAt);
	const replaced = applyDataImport(current, archive, 'replace');

	assert.equal(replaced.tasks.length, 1);
	assert.equal(replaced.tasks[0].title, 'New title');
});

test('merge deduplicates sessions and preserves non-reconstructable task aggregate baselines', () => {
	const oldSession = session();
	const newSession = session({
		id: 'session-two',
		startedAt: '2026-07-19T10:00:00.000Z',
		endedAt: '2026-07-19T10:05:00.000Z'
	});
	const current = data({
		tasks: [task({ accumulatedSeconds: 900, sessionCount: 3 })],
		sessions: [oldSession]
	});
	const incoming = data({
		tasks: [
			task({
				title: 'Renamed proposal',
				updatedAt: '2026-07-19T11:00:00.000Z',
				accumulatedSeconds: 1200,
				sessionCount: 4
			})
		],
		sessions: [oldSession, newSession]
	});

	const merged = mergeDurableData(current, incoming);
	assert.deepEqual(merged.sessions.map((record) => record.id), ['session-two', 'session-one']);
	assert.equal(merged.tasks[0].title, 'Renamed proposal');
	assert.equal(merged.tasks[0].accumulatedSeconds, 1200);
	assert.equal(merged.tasks[0].sessionCount, 4);
});

test('merge adds only new grove credits without undoing a local reset', () => {
	const current = data({
		grove: {
			version: 2,
			totalLeaves: 1,
			creditedMinutesBySession: { old: 10, active: 1 },
			settledMatureTreeCount: 0
		}
	});
	const incoming = data({
		grove: {
			version: 2,
			totalLeaves: 15,
			creditedMinutesBySession: { old: 10, imported: 5 },
			settledMatureTreeCount: 0
		}
	});

	const merged = mergeDurableData(current, incoming);
	assert.equal(merged.grove.totalLeaves, 6);
	assert.deepEqual(merged.grove.creditedMinutesBySession, { old: 10, active: 1, imported: 5 });
});
