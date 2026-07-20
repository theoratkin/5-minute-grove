import test from 'node:test';
import assert from 'node:assert/strict';
import {
	UNTITLED_TASK_ID,
	assignUntitledTask,
	moveOpenFocusTask,
	normalizeFocusTasks,
	removeEmptyUntitledTask,
	reorderOpenFocusTasks,
	sortFocusTasks
} from '../src/lib/features/focus-list/focusTask.state.ts';
import {
	extractTaskHashtags,
	parseTaskTitle
} from '../src/lib/features/focus-list/focusTask.hashtags.ts';

test('parses hashtags without changing the task title text', () => {
	const title = 'Draft proposal #Foxtery and #deep_work.';
	assert.deepEqual(parseTaskTitle(title), [
		{ type: 'text', value: 'Draft proposal ' },
		{ type: 'hashtag', value: '#Foxtery' },
		{ type: 'text', value: ' and ' },
		{ type: 'hashtag', value: '#deep_work' },
		{ type: 'text', value: '.' }
	]);
});

test('extracts unique normalized hashtags for future filtering', () => {
	assert.deepEqual(extractTaskHashtags('#Work notes #work #café'), ['work', 'café']);
});

test('only treats a hash at a word boundary as a hashtag', () => {
	assert.deepEqual(extractTaskHashtags('Review issue #123, color#fff and #.'), ['123']);
});

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

test('pins the Anything task first when loading', () => {
	const tasks = normalizeFocusTasks([
		{ id: 'one', title: 'One', createdAt: '2026-07-18T10:00:00.000Z' },
		{ id: UNTITLED_TASK_ID, title: 'Anything', createdAt: '2026-07-18T11:00:00.000Z', accumulatedSeconds: 60 },
		{ id: 'two', title: 'Two', createdAt: '2026-07-18T12:00:00.000Z' }
	]);
	assert.deepEqual(tasks.map((task) => task.id), [UNTITLED_TASK_ID, 'one', 'two']);
});

test('does not move the Anything task or move another task above it', () => {
	const tasks = normalizeFocusTasks([
		{ id: 'one', title: 'One', createdAt: '2026-07-18T10:00:00.000Z' },
		{ id: UNTITLED_TASK_ID, title: 'Anything', createdAt: '2026-07-18T11:00:00.000Z' },
		{ id: 'two', title: 'Two', createdAt: '2026-07-18T12:00:00.000Z' }
	]);
	assert.equal(moveOpenFocusTask(tasks, UNTITLED_TASK_ID, 1), tasks);
	assert.equal(moveOpenFocusTask(tasks, 'one', -1), tasks);
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

test('keeps the Anything task pinned when persisting drag and drop', () => {
	const tasks = normalizeFocusTasks([
		{ id: 'one', title: 'One', createdAt: '2026-07-18T10:00:00.000Z' },
		{ id: UNTITLED_TASK_ID, title: 'Anything', createdAt: '2026-07-18T11:00:00.000Z' },
		{ id: 'two', title: 'Two', createdAt: '2026-07-18T12:00:00.000Z' }
	]);
	assert.deepEqual(
		reorderOpenFocusTasks(tasks, ['two', 'one', UNTITLED_TASK_ID]).map((task) => task.id),
		[UNTITLED_TASK_ID, 'two', 'one']
	);
});

test('merges duplicate Anything task records defensively', () => {
	const tasks = normalizeFocusTasks([
		{ id: UNTITLED_TASK_ID, title: 'Anything', createdAt: '2026-07-18T10:00:00.000Z', accumulatedSeconds: 120, sessionCount: 1 },
		{ id: UNTITLED_TASK_ID, title: 'Anything', createdAt: '2026-07-18T11:00:00.000Z', accumulatedSeconds: 180, sessionCount: 2 }
	]);
	assert.equal(tasks.length, 1);
	assert.equal(tasks[0].id, UNTITLED_TASK_ID);
	assert.equal(tasks[0].title, 'Anything');
	assert.equal(tasks[0].accumulatedSeconds, 300);
	assert.equal(tasks[0].sessionCount, 3);
});

test('removes an empty Anything inbox but preserves one with saved focus', () => {
	const empty = normalizeFocusTasks([
		{ id: UNTITLED_TASK_ID, title: 'Anything', createdAt: '2026-07-18T10:00:00.000Z' }
	]);
	assert.deepEqual(removeEmptyUntitledTask(empty), []);

	const focused = normalizeFocusTasks([
		{ id: UNTITLED_TASK_ID, title: 'Anything', createdAt: '2026-07-18T10:00:00.000Z', accumulatedSeconds: 60, sessionCount: 1 }
	]);
	assert.equal(removeEmptyUntitledTask(focused).length, 1);
});

test('assigns saved Anything focus to a named task and removes the shared inbox', () => {
	const tasks = normalizeFocusTasks([
		{
			id: UNTITLED_TASK_ID,
			title: 'Anything',
			createdAt: '2026-07-18T10:00:00.000Z',
			updatedAt: '2026-07-18T12:00:00.000Z',
			accumulatedSeconds: 90,
			sessionCount: 1
		},
		{
			id: 'named',
			title: 'Named task',
			createdAt: '2026-07-18T11:00:00.000Z',
			accumulatedSeconds: 120,
			sessionCount: 2
		}
	]);

	const assigned = assignUntitledTask(tasks, 'named');
	assert.deepEqual(assigned.map((task) => task.id), ['named']);
	assert.equal(assigned[0].accumulatedSeconds, 210);
	assert.equal(assigned[0].sessionCount, 3);
	assert.equal(assigned[0].updatedAt, '2026-07-18T12:00:00.000Z');
});

test('retains more than the former one-hundred-task persistence limit', () => {
	const tasks = normalizeFocusTasks(
		Array.from({ length: 120 }, (_, index) => ({
			id: `task-${index}`,
			title: `Task ${index}`,
			createdAt: new Date(Date.UTC(2026, 6, 18, 10, index)).toISOString()
		}))
	);

	assert.equal(tasks.length, 120);
});
