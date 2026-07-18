import assert from 'node:assert/strict';
import test from 'node:test';
import { localDateKey, shouldShowSleepReminder } from '../src/lib/app/sleepReminder.ts';

test('uses the visitor local calendar date as the reminder key', () => {
	const date = new Date(2026, 6, 18, 0, 30);
	assert.equal(localDateKey(date), '2026-07-18');
});

test('shows once during the after-midnight window', () => {
	const afterMidnight = new Date(2026, 6, 18, 0, 1);
	assert.equal(shouldShowSleepReminder(afterMidnight, true), true);
	assert.equal(shouldShowSleepReminder(afterMidnight, true, '2026-07-18'), false);
});

test('does not show when disabled or after the late-night window', () => {
	assert.equal(shouldShowSleepReminder(new Date(2026, 6, 18, 2), false), false);
	assert.equal(shouldShowSleepReminder(new Date(2026, 6, 18, 6), true), false);
});
