import test from 'node:test';
import assert from 'node:assert/strict';
import { elapsedInCurrentContract, restoreFocusSession } from '../src/lib/features/focus-session/focusSession.state.ts';
import type { ActiveFocusSession } from '../src/lib/features/focus-session/focusSession.types.ts';
import { normalizeStartDuration } from '../src/lib/features/focus-session/focusSession.utils.ts';

const baseSession: ActiveFocusSession = {
	version: 1,
	intention: 'Write the opening',
	phase: 'running',
	remainingSeconds: 300,
	segmentDurationSeconds: 300,
	completedContracts: 1,
	extensionCount: 1,
	elapsedSessionSeconds: 300,
	sessionStartedAt: '2026-07-16T12:00:00.000Z',
	activeSessionId: 'session-1',
	segmentEndsAt: 1_000_000
};

test('restores a running timer from its absolute end time', () => {
	const restored = restoreFocusSession(baseSession, 880_001);
	assert.equal(restored.phase, 'running');
	assert.equal(restored.remainingSeconds, 120);
	assert.equal(restored.completedWhileAway, false);
});

test('completes exactly one contract when its end time passed in the background', () => {
	const restored = restoreFocusSession(baseSession, 1_050_000);
	assert.equal(restored.phase, 'contract-complete');
	assert.equal(restored.completedContracts, 2);
	assert.equal(restored.elapsedSessionSeconds, 600);
	assert.equal(restored.segmentEndsAt, null);
	assert.equal(restored.completedWhileAway, true);
});

test('does not alter a paused timer while restoring it', () => {
	const restored = restoreFocusSession(
		{ ...baseSession, phase: 'paused', remainingSeconds: 173, segmentEndsAt: null },
		2_000_000
	);
	assert.equal(restored.phase, 'paused');
	assert.equal(restored.remainingSeconds, 173);
	assert.equal(restored.completedContracts, 1);
});

test('counts partial work honestly without exceeding one contract', () => {
	assert.equal(elapsedInCurrentContract(300), 0);
	assert.equal(elapsedInCurrentContract(173), 127);
	assert.equal(elapsedInCurrentContract(0), 300);
	assert.equal(elapsedInCurrentContract(-10), 300);
});

test('counts partial work against an extended segment duration', () => {
	assert.equal(elapsedInCurrentContract(360, 360), 0);
	assert.equal(elapsedInCurrentContract(240, 360), 120);
	assert.equal(elapsedInCurrentContract(0, 360), 360);
});

test('credits the full extended segment when it finishes while away', () => {
	const restored = restoreFocusSession(
		{ ...baseSession, remainingSeconds: 360, segmentDurationSeconds: 360 },
		1_050_000
	);
	assert.equal(restored.elapsedSessionSeconds, 660);
});

test('normalizes a custom starting duration without forcing five minutes', () => {
	assert.equal(normalizeStartDuration(30), 30);
	assert.equal(normalizeStartDuration(0), 1);
	assert.equal(normalizeStartDuration(Number.NaN), 300);
	assert.equal(normalizeStartDuration(1000 * 60), 999 * 60 + 59);
});
