import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeFocusTasks, sortFocusTasks } from '../src/lib/features/focus-list/focusTask.state.ts';

test('normalizes durable task fields and rejects empty titles', () => {
	const tasks = normalizeFocusTasks([
		{ id: 'one', title: '  Draft proposal  ', createdAt: '2026-07-18T10:00:00.000Z' },
		{ id: 'two', title: ' ', createdAt: '2026-07-18T11:00:00.000Z' }
	]);
	assert.equal(tasks.length, 1);
	assert.equal(tasks[0].title, 'Draft proposal');
	assert.equal(tasks[0].completedAt, null);
	assert.equal(tasks[0].accumulatedSeconds, 0);
});

test('sorts open tasks before recently completed tasks', () => {
	const [older, newer] = normalizeFocusTasks([
		{ id: 'older', title: 'Older', createdAt: '2026-07-18T10:00:00.000Z' },
		{ id: 'newer', title: 'Newer', createdAt: '2026-07-18T11:00:00.000Z', completedAt: '2026-07-18T12:00:00.000Z' }
	]);
	assert.deepEqual(sortFocusTasks([newer, older]).map((task) => task.id), ['older', 'newer']);
});
