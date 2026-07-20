import assert from 'node:assert/strict';
import test from 'node:test';
import {
	MigrationRegistryError,
	runMigrationRegistry,
	type MigrationStep
} from '../src/lib/app/migrationRegistry.ts';

type Example = { changes: string[] };

const migrations: readonly MigrationStep<Example>[] = [
	{
		toVersion: 1,
		migrate: (value) => ({ changes: [...value.changes, '0-to-1'] })
	},
	{
		toVersion: 2,
		migrate: (value) => ({ changes: [...value.changes, '1-to-2'] })
	},
	{
		toVersion: 3,
		migrate: (value) => ({ changes: [...value.changes, '2-to-3'] })
	}
];

test('runs every sequential migration in order', () => {
	const migrated = runMigrationRegistry({ changes: [] }, 0, 3, migrations, 'Example');
	assert.deepEqual(migrated.changes, ['0-to-1', '1-to-2', '2-to-3']);
});

test('runs only migrations newer than the stored version', () => {
	const migrated = runMigrationRegistry({ changes: [] }, 1, 3, migrations, 'Example');
	assert.deepEqual(migrated.changes, ['1-to-2', '2-to-3']);
});

test('rejects newer data, migration gaps, and duplicate targets', () => {
	assert.throws(
		() => runMigrationRegistry({ changes: [] }, 4, 3, migrations, 'Example'),
		MigrationRegistryError
	);
	assert.throws(
		() => runMigrationRegistry({ changes: [] }, 0, 2, [migrations[0]], 'Example'),
		/no migration registered from version 1 to version 2/
	);
	assert.throws(
		() => runMigrationRegistry({ changes: [] }, 0, 1, [migrations[0], migrations[0]], 'Example'),
		/more than one migration registered for version 1/
	);
});

test('returns the original value when no migration is needed', () => {
	const value = { changes: [] };
	assert.equal(runMigrationRegistry(value, 2, 2, migrations, 'Example'), value);
});
