import test from 'node:test';
import assert from 'node:assert/strict';
import {
	creditElapsedMinutes,
	deriveGroveProgress,
	normalizeGroveState,
	seedGroveState,
	settleMatureTrees
} from '../src/lib/features/grove/grove.state.ts';

test('derives tree growth at each sixty-leaf boundary', () => {
	assert.deepEqual(deriveGroveProgress(0), {
		matureTreeCount: 0,
		currentTreeNumber: 1,
		currentTreeLeaves: 0
	});
	assert.equal(deriveGroveProgress(1).currentTreeLeaves, 1);
	assert.equal(deriveGroveProgress(59).currentTreeLeaves, 59);
	assert.deepEqual(deriveGroveProgress(60), {
		matureTreeCount: 1,
		currentTreeNumber: 2,
		currentTreeLeaves: 0
	});
	assert.equal(deriveGroveProgress(61).currentTreeLeaves, 1);
	assert.equal(deriveGroveProgress(119).currentTreeLeaves, 59);
	assert.deepEqual(deriveGroveProgress(120), {
		matureTreeCount: 2,
		currentTreeNumber: 3,
		currentTreeLeaves: 0
	});
});

test('backfills whole elapsed minutes without double-counting an active session', () => {
	const state = seedGroveState([
		{ id: 'saved', completedContracts: 2, totalSeconds: 600 },
		{ id: 'active', completedContracts: 1, totalSeconds: 300 },
		{ id: 'active', completedContracts: 3, totalSeconds: 900 },
		{ id: 'legacy', completedContracts: 0, totalSeconds: 750 }
	]);

	assert.equal(state.totalLeaves, 37);
	assert.deepEqual(state.creditedMinutesBySession, {
		saved: 10,
		active: 15,
		legacy: 12
	});
});

test('credits each completed minute exactly once', () => {
	const initial = seedGroveState([{ id: 'session', completedContracts: 1 }]);
	const firstCredit = creditElapsedMinutes(initial, 'session', 6);
	assert.equal(firstCredit.addedLeaves, 1);
	assert.equal(firstCredit.state.totalLeaves, 6);

	const repeatedCredit = creditElapsedMinutes(firstCredit.state, 'session', 6);
	assert.equal(repeatedCredit.addedLeaves, 0);
	assert.equal(repeatedCredit.state.totalLeaves, 6);

	const resumedCredit = creditElapsedMinutes(repeatedCredit.state, 'session', 8);
	assert.equal(resumedCredit.addedLeaves, 2);
	assert.equal(resumedCredit.state.totalLeaves, 8);
});

test('normalizes invalid storage and migrates contract credits to elapsed minutes', () => {
	assert.deepEqual(normalizeGroveState({ version: 3, totalLeaves: 20 }), {
		version: 2,
		totalLeaves: 0,
		creditedMinutesBySession: {},
		settledMatureTreeCount: 0
	});

	const state = normalizeGroveState({
		version: 1,
		totalLeaves: 9,
		creditedContractsBySession: { valid: 3.8, negative: -4, broken: 'many' }
	});
	assert.equal(state.totalLeaves, 15);
	assert.deepEqual(state.creditedMinutesBySession, { valid: 15, negative: 0 });
	assert.equal(state.settledMatureTreeCount, 0);
});

test('holds a full tree in the foreground until a new session settles it', () => {
	const fullTree = {
		version: 2 as const,
		totalLeaves: 60,
		creditedMinutesBySession: { session: 60 },
		settledMatureTreeCount: 0
	};
	assert.equal(normalizeGroveState(fullTree).settledMatureTreeCount, 0);

	assert.deepEqual(deriveGroveProgress(60, fullTree.settledMatureTreeCount), {
		matureTreeCount: 0,
		currentTreeNumber: 1,
		currentTreeLeaves: 60
	});

	const settled = settleMatureTrees(fullTree);
	assert.equal(settled.settledMatureTreeCount, 1);
	assert.deepEqual(deriveGroveProgress(60, settled.settledMatureTreeCount), {
		matureTreeCount: 1,
		currentTreeNumber: 2,
		currentTreeLeaves: 0
	});
});
