import test from 'node:test';
import assert from 'node:assert/strict';
import {
	normalizeSessionHistory,
	removeSessionById,
	restoreSessionRecord
} from '../src/lib/features/session-history/sessionHistory.state.ts';
import type { FocusSessionRecord } from '../src/lib/features/focus-session/focusSession.types.ts';

const first: FocusSessionRecord = {
	id: 'first',
	title: 'First task',
	startedAt: '2026-07-16T10:00:00.000Z',
	endedAt: '2026-07-16T10:05:00.000Z',
	completedContracts: 1,
	extensionCount: 0,
	totalSeconds: 300
};

const second: FocusSessionRecord = {
	...first,
	id: 'second',
	title: 'Second task',
	startedAt: '2026-07-16T11:00:00.000Z'
};

test('migrates legacy intention and Sprint titles', () => {
	const records = normalizeSessionHistory([
		{ id: 'legacy-1', intention: 'Outline chapter', startedAt: first.startedAt, totalSeconds: 300 },
		{ id: 'legacy-2', title: 'Sprint', startedAt: second.startedAt, totalSeconds: 600 }
	]);

	assert.equal(records[0].title, 'Outline chapter');
	assert.equal(records[1].title, 'Session');
	assert.equal(records[0].endedAt, first.startedAt);
});

test('ignores malformed history and clamps negative counters', () => {
	assert.deepEqual(normalizeSessionHistory({}), []);
	const [record] = normalizeSessionHistory([
		{ id: 'valid', startedAt: first.startedAt, completedContracts: -2, totalSeconds: -10 }
	]);
	assert.equal(record.completedContracts, 0);
	assert.equal(record.totalSeconds, 0);
});

test('restores an undo deletion in chronological order', () => {
	const removed = removeSessionById([second, first], 'second');
	assert.equal(removed.removed?.title, 'Second task');
	assert.deepEqual(removed.records.map((record) => record.id), ['first']);

	const restored = restoreSessionRecord(removed.records, removed.removed!);
	assert.deepEqual(restored.map((record) => record.id), ['second', 'first']);
});
