import test from 'node:test';
import assert from 'node:assert/strict';
import {
	UNTITLED_TASK_ID,
	moveOpenFocusTask,
	normalizeFocusTasks,
	removeEmptyUntitledTask,
	reorderOpenFocusTasks,
	sortFocusTasks
} from '../src/lib/features/focus-list/focusTask.state.ts';

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

test('preserves the chosen order of open tasks', () => {
	const tasks = normalizeFocusTasks([
		{ id: 'one', title: 'One', createdAt: '2026-07-18T10:00:00.000Z' },
		{ id: 'two', title: 'Two', createdAt: '2026-07-18T11:00:00.000Z' },
		{ id: 'done', title: 'Done', createdAt: '2026-07-18T12:00:00.000Z', completedAt: '2026-07-18T13:00:00.000Z' }
	]);
	assert.deepEqual(moveOpenFocusTask(tasks, 'two', -1).map((task) => task.id), [
		'two',
		'one',
		'done'
	]);
	assert.equal(moveOpenFocusTask(tasks, 'one', -1), tasks);
});

test('preserves an untitled task\'s chosen position when loading', () => {
	const tasks = normalizeFocusTasks([
		{ id: 'one', title: 'One', createdAt: '2026-07-18T10:00:00.000Z' },
		{ id: UNTITLED_TASK_ID, title: 'Untitled', createdAt: '2026-07-18T11:00:00.000Z', accumulatedSeconds: 60 },
		{ id: 'two', title: 'Two', createdAt: '2026-07-18T12:00:00.000Z' }
	]);
	assert.deepEqual(tasks.map((task) => task.id), ['one', UNTITLED_TASK_ID, 'two']);
});

test('persists a complete ordered list from drag and drop', () => {
	const tasks = normalizeFocusTasks([
		{ id: 'one', title: 'One', createdAt: '2026-07-18T10:00:00.000Z' },
		{ id: 'two', title: 'Two', createdAt: '2026-07-18T11:00:00.000Z' },
		{ id: 'three', title: 'Three', createdAt: '2026-07-18T12:00:00.000Z' }
	]);
	assert.deepEqual(
		reorderOpenFocusTasks(tasks, ['two', 'three', 'one']).map((task) => task.id),
		['two', 'three', 'one']
	);
	assert.equal(reorderOpenFocusTasks(tasks, ['two', 'one']), tasks);
	assert.equal(reorderOpenFocusTasks(tasks, ['one', 'one', 'three']), tasks);
});

test('merges untitled tasks into one durable inbox', () => {
	const tasks = normalizeFocusTasks([
		{ id: 'old-one', title: 'Untitled task', createdAt: '2026-07-18T10:00:00.000Z', accumulatedSeconds: 120, sessionCount: 1 },
		{ id: 'old-two', title: 'Untitled', createdAt: '2026-07-18T11:00:00.000Z', accumulatedSeconds: 180, sessionCount: 2 }
	]);
	assert.equal(tasks.length, 1);
	assert.equal(tasks[0].id, UNTITLED_TASK_ID);
	assert.equal(tasks[0].title, 'Untitled');
	assert.equal(tasks[0].accumulatedSeconds, 300);
	assert.equal(tasks[0].sessionCount, 3);
});

test('removes an empty untitled inbox but preserves one with saved focus', () => {
	const empty = normalizeFocusTasks([
		{ id: UNTITLED_TASK_ID, title: 'Untitled', createdAt: '2026-07-18T10:00:00.000Z' }
	]);
	assert.deepEqual(removeEmptyUntitledTask(empty), []);

	const focused = normalizeFocusTasks([
		{ id: UNTITLED_TASK_ID, title: 'Untitled', createdAt: '2026-07-18T10:00:00.000Z', accumulatedSeconds: 60, sessionCount: 1 }
	]);
	assert.equal(removeEmptyUntitledTask(focused).length, 1);
});
