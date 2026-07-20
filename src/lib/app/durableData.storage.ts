import { browser } from '$app/environment';
import { normalizeDurableData, type DurableData } from './dataArchive';
import { DurableStorageConflictError, nextDurableRevision } from './durableRevision';
import { runMigrationRegistry, type MigrationStep } from './migrationRegistry';
import { normalizeFocusTasks } from '../features/focus-list/focusTask.state';
import type { FocusTask } from '../features/focus-list/focusTask.types';
import type { FocusSessionRecord } from '../features/focus-session/focusSession.types';
import { normalizeGroveState } from '../features/grove/grove.state';
import type { GroveState } from '../features/grove/grove.types';
import { normalizeSessionHistory } from '../features/session-history/sessionHistory.state';

const DATABASE_NAME = '5-minute-grove';
const DATABASE_VERSION = 1;
const DATA_STORE = 'app-data';
const REVISION_KEY = 'meta:revision';
const TASKS_KEY = 'tasks';
const SESSIONS_KEY = 'sessions';
const GROVE_KEY = 'grove';
const SYNC_CHANNEL_NAME = '5-minute-grove:durable-data';
const SYNC_STORAGE_KEY = '5-minute-grove:durable-sync';

type DatabaseRecord = {
	key: string;
	value: unknown;
};

type DatabaseMigrationContext = {
	database: IDBDatabase;
	transaction: IDBTransaction;
};

const DATABASE_MIGRATIONS: readonly MigrationStep<DatabaseMigrationContext>[] = [
	{
		toVersion: 1,
		migrate(context) {
			if (!context.database.objectStoreNames.contains(DATA_STORE)) {
				context.database.createObjectStore(DATA_STORE, { keyPath: 'key' });
			}
			return context;
		}
	}
];

let databasePromise: Promise<IDBDatabase> | undefined;
let writeQueue: Promise<void> = Promise.resolve();
let knownRevision = 0;
let syncChannel: BroadcastChannel | undefined;
let storageListenerInstalled = false;
let lastExternalRevision = 0;
const changeListeners = new Set<(change: DurableDataChange) => void>();
const instanceId = globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2);

export type DurableDataChange = {
	revision: number;
};

export class DurableStorageError extends Error {
	constructor(message: string, options?: ErrorOptions) {
		super(message, options);
		this.name = 'DurableStorageError';
	}
}

export { DurableStorageConflictError } from './durableRevision';

export function subscribeDurableDataChanges(
	listener: (change: DurableDataChange) => void
): () => void {
	ensureSyncListeners();
	changeListeners.add(listener);
	return () => changeListeners.delete(listener);
}

export async function loadDurableData(): Promise<DurableData> {
	await writeQueue;
	const database = await readyDatabase();
	const transaction = database.transaction(DATA_STORE, 'readonly');
	const store = transaction.objectStore(DATA_STORE);
	const tasksRequest = store.get(TASKS_KEY);
	const sessionsRequest = store.get(SESSIONS_KEY);
	const groveRequest = store.get(GROVE_KEY);
	const revisionRequest = store.get(REVISION_KEY);
	const [tasks, sessions, grove, revision] = await Promise.all([
		requestValue(tasksRequest),
		requestValue(sessionsRequest),
		requestValue(groveRequest),
		requestValue(revisionRequest),
		transactionComplete(transaction)
	]);
	knownRevision = finiteRevision(recordValue(revision));

	return normalizeDurableData({
		tasks: normalizeFocusTasks(recordValue(tasks)),
		sessions: normalizeSessionHistory(recordValue(sessions)),
		grove: normalizeGroveState(recordValue(grove))
	});
}

export function saveDurableTasks(tasks: FocusTask[]): Promise<void> {
	return enqueueWrite(async () => {
		const database = await readyDatabase();
		const revision = await writeRecords(database, [
			{ key: TASKS_KEY, value: normalizeFocusTasks(tasks) }
		]);
		publishChange(revision);
	});
}

export function saveDurableSessions(sessions: FocusSessionRecord[]): Promise<void> {
	return enqueueWrite(async () => {
		const database = await readyDatabase();
		const revision = await writeRecords(database, [
			{ key: SESSIONS_KEY, value: normalizeSessionHistory(sessions) }
		]);
		publishChange(revision);
	});
}

export function saveDurableGrove(grove: GroveState): Promise<void> {
	return enqueueWrite(async () => {
		const database = await readyDatabase();
		const revision = await writeRecords(database, [
			{ key: GROVE_KEY, value: normalizeGroveState(grove) }
		]);
		publishChange(revision);
	});
}

export function replaceDurableData(data: DurableData): Promise<void> {
	const normalized = normalizeDurableData(data);
	return enqueueWrite(async () => {
		const database = await readyDatabase();
		const revision = await writeRecords(database, dataRecords(normalized));
		publishChange(revision);
	});
}

async function readyDatabase(): Promise<IDBDatabase> {
	return openDatabase();
}

function openDatabase(): Promise<IDBDatabase> {
	assertBrowser();
	if (!('indexedDB' in globalThis)) {
		return Promise.reject(new DurableStorageError('IndexedDB is not available in this browser.'));
	}
	if (databasePromise) return databasePromise;

	const opening = new Promise<IDBDatabase>((resolve, reject) => {
		const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);
		let settled = false;
		let upgradeError: unknown;
		request.onupgradeneeded = (event) => {
			try {
				runMigrationRegistry(
					{ database: request.result, transaction: request.transaction! },
					event.oldVersion,
					event.newVersion ?? DATABASE_VERSION,
					DATABASE_MIGRATIONS,
					'IndexedDB schema'
				);
			} catch (error) {
				upgradeError = error;
				request.transaction?.abort();
			}
		};
		request.onerror = () => {
			settled = true;
			reject(
				new DurableStorageError(
					upgradeError ? 'Could not migrate the local database.' : 'Could not open the local database.',
					{ cause: upgradeError ?? request.error }
				)
			);
		};
		request.onblocked = () => {
			settled = true;
			reject(new DurableStorageError('A previous app version is blocking the local database.'));
		};
		request.onsuccess = () => {
			const database = request.result;
			if (settled) {
				database.close();
				return;
			}
			settled = true;
			database.onversionchange = () => database.close();
			resolve(database);
		};
	});
	databasePromise = opening.catch((error) => {
		databasePromise = undefined;
		throw error;
	});

	return databasePromise;
}

function writeRecords(database: IDBDatabase, records: DatabaseRecord[]): Promise<number> {
	return new Promise((resolve, reject) => {
		const transaction = database.transaction(DATA_STORE, 'readwrite');
		const store = transaction.objectStore(DATA_STORE);
		const expectedRevision = knownRevision;
		let nextRevision = expectedRevision;
		let failure: Error | undefined;
		const revisionRequest = store.get(REVISION_KEY);

		revisionRequest.onsuccess = () => {
			const actualRevision = finiteRevision(recordValue(revisionRequest.result));
			try {
				nextRevision = nextDurableRevision(expectedRevision, actualRevision);
			} catch (error) {
				failure = error as DurableStorageConflictError;
				transaction.abort();
				return;
			}

			for (const record of records) store.put(record);
			store.put({ key: REVISION_KEY, value: nextRevision } satisfies DatabaseRecord);
		};
		revisionRequest.onerror = () => {
			failure = new DurableStorageError('Could not read the database revision.', {
				cause: revisionRequest.error
			});
		};
		transaction.oncomplete = () => {
			knownRevision = nextRevision;
			resolve(nextRevision);
		};
		transaction.onerror = () =>
			reject(failure ?? new DurableStorageError('A local database transaction failed.', { cause: transaction.error }));
		transaction.onabort = () =>
			reject(failure ?? new DurableStorageError('A local database transaction was aborted.', { cause: transaction.error }));
	});
}

function dataRecords(data: DurableData): DatabaseRecord[] {
	return [
		{ key: TASKS_KEY, value: data.tasks },
		{ key: SESSIONS_KEY, value: data.sessions },
		{ key: GROVE_KEY, value: data.grove }
	];
}

function enqueueWrite(operation: () => Promise<void>): Promise<void> {
	const result = writeQueue.then(operation);
	writeQueue = result.catch(() => undefined);
	return result;
}

function publishChange(revision: number): void {
	ensureSyncListeners();
	const message = { source: instanceId, revision };
	syncChannel?.postMessage(message);
	try {
		localStorage.setItem(SYNC_STORAGE_KEY, JSON.stringify({ ...message, nonce: Date.now() }));
	} catch {
		// BroadcastChannel remains the primary path when localStorage is unavailable.
	}
}

function ensureSyncListeners(): void {
	if (!browser) return;
	if (!syncChannel && 'BroadcastChannel' in globalThis) {
		syncChannel = new BroadcastChannel(SYNC_CHANNEL_NAME);
		syncChannel.onmessage = (event: MessageEvent<unknown>) => receiveChange(event.data);
	}
	if (!storageListenerInstalled) {
		window.addEventListener('storage', (event) => {
			if (event.key !== SYNC_STORAGE_KEY || !event.newValue) return;
			try {
				receiveChange(JSON.parse(event.newValue) as unknown);
			} catch {
				// Ignore malformed synchronization messages from unrelated scripts.
			}
		});
		storageListenerInstalled = true;
	}
}

function receiveChange(value: unknown): void {
	if (!value || typeof value !== 'object') return;
	const message = value as { source?: unknown; revision?: unknown };
	if (
		message.source === instanceId ||
		typeof message.revision !== 'number' ||
		!Number.isInteger(message.revision) ||
		message.revision <= lastExternalRevision
	) {
		return;
	}
	lastExternalRevision = message.revision;
	for (const listener of changeListeners) listener({ revision: message.revision });
}

function requestValue<T = unknown>(request: IDBRequest<T>): Promise<T> {
	return new Promise((resolve, reject) => {
		request.onsuccess = () => resolve(request.result);
		request.onerror = () =>
			reject(new DurableStorageError('A local database request failed.', { cause: request.error }));
	});
}

function transactionComplete(transaction: IDBTransaction): Promise<void> {
	return new Promise((resolve, reject) => {
		transaction.oncomplete = () => resolve();
		transaction.onerror = () =>
			reject(
				new DurableStorageError('A local database transaction failed.', {
					cause: transaction.error
				})
			);
		transaction.onabort = () =>
			reject(
				new DurableStorageError('A local database transaction was aborted.', {
					cause: transaction.error
				})
			);
	});
}

function recordValue(record: unknown): unknown {
	return record && typeof record === 'object' && 'value' in record
		? (record as DatabaseRecord).value
		: undefined;
}

function finiteRevision(value: unknown): number {
	return typeof value === 'number' && Number.isInteger(value) && value >= 0 ? value : 0;
}

function assertBrowser(): void {
	if (!browser) throw new DurableStorageError('Durable app data is only available in the browser.');
}
