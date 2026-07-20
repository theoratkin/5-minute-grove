export class DurableStorageConflictError extends Error {
	readonly expectedRevision: number;
	readonly actualRevision: number;

	constructor(expectedRevision: number, actualRevision: number) {
		super('Durable data changed in another tab before this write could be saved.');
		this.name = 'DurableStorageConflictError';
		this.expectedRevision = expectedRevision;
		this.actualRevision = actualRevision;
	}
}

export function nextDurableRevision(expectedRevision: number, actualRevision: number): number {
	if (actualRevision !== expectedRevision) {
		throw new DurableStorageConflictError(expectedRevision, actualRevision);
	}
	return actualRevision + 1;
}
