import assert from 'node:assert/strict';
import test from 'node:test';
import {
	DurableStorageConflictError,
	nextDurableRevision
} from '../src/lib/app/durableRevision.ts';

test('advances a matching durable-data revision', () => {
	assert.equal(nextDurableRevision(7, 7), 8);
});

test('rejects a stale durable-data revision without advancing it', () => {
	assert.throws(
		() => nextDurableRevision(7, 8),
		(error: unknown) =>
			error instanceof DurableStorageConflictError &&
			error.expectedRevision === 7 &&
			error.actualRevision === 8
	);
});
