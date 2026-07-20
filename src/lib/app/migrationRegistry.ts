export interface MigrationStep<T> {
	toVersion: number;
	migrate(value: T): T;
}

export class MigrationRegistryError extends Error {
	constructor(message: string) {
		super(message);
		this.name = 'MigrationRegistryError';
	}
}

export function runMigrationRegistry<T>(
	value: T,
	fromVersion: number,
	targetVersion: number,
	steps: readonly MigrationStep<T>[],
	label = 'Schema'
): T {
	assertVersion(fromVersion, `${label} source`);
	assertVersion(targetVersion, `${label} target`);
	if (fromVersion > targetVersion) {
		throw new MigrationRegistryError(
			`${label} version ${fromVersion} is not supported; the current version is ${targetVersion}.`
		);
	}

	const stepsByVersion = new Map<number, MigrationStep<T>>();
	for (const step of steps) {
		assertVersion(step.toVersion, `${label} migration target`);
		if (stepsByVersion.has(step.toVersion)) {
			throw new MigrationRegistryError(
				`${label} has more than one migration registered for version ${step.toVersion}.`
			);
		}
		stepsByVersion.set(step.toVersion, step);
	}

	let migrated = value;
	for (let version = fromVersion + 1; version <= targetVersion; version += 1) {
		const step = stepsByVersion.get(version);
		if (!step) {
			throw new MigrationRegistryError(
				`${label} has no migration registered from version ${version - 1} to version ${version}.`
			);
		}
		migrated = step.migrate(migrated);
	}
	return migrated;
}

function assertVersion(version: number, label: string): void {
	if (!Number.isInteger(version) || version < 0) {
		throw new MigrationRegistryError(`${label} version must be a non-negative integer.`);
	}
}
