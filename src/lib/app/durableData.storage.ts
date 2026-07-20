import { browser } from '$app/environment';
import { normalizeDurableData, type DurableData } from './dataArchive';
import { readJson } from './storage';
import {
	HISTORY_STORAGE_KEY,
	loadSessionHistory as loadLegacySessionHistory
} from '../features/session-history/sessionHistory.storage';
import {
	TASKS_STORAGE_KEY,
	loadFocusTasks as loadLegacyFocusTasks
} from '../features/focus-list/focusTask.storage';
import { GROVE_STORAGE_KEY } from '../features/grove/grove.storage';
import { normalizeFocusTasks } from '../features/focus-list/focusTask.state';
import type { FocusTask } from '../features/focus-list/focusTask.types';
import type { FocusSessionRecord } from '../features/focus-session/focusSession.types';
import { normalizeGroveState, seedGroveState } from '../features/grove/grove.state';
import type { GroveState } from '../features/grove/grove.types';
import { normalizeSessionHistory } from '../features/session-history/sessionHistory.state';

const DATABASE_NAME = '5-minute-grove';
const DATABASE_VERSION = 1;
const DATA_STORE = 'app-data';
const MIGRATION_KEY = 'meta:local-storage-migrated';
const TASKS_KEY = 'tasks';
const SESSIONS_KEY = 'sessions';
const GROVE_KEY = 'grove';
const LEGACY_STORAGE_KEYS = [TASKS_STORAGE_KEY, HISTORY_STORAGE_KEY, GROVE_STORAGE_KEY] as const;

type DatabaseRecord = {
	key: string;
	value: unknown;
};

let databasePromise: Promise<IDBDatabase> | undefined;
let migrationPromise: Promise<void> | undefined;
let writeQueue: Promise<void> = Promise.resolve();

export class DurableStorageError extends Error {
	constructor(message: string, options?: ErrorOptions) {
		super(message, options);
		this.name = 'DurableStorageError';
	}
}

export async function loadDurableData(): Promise<DurableData> {
	await writeQueue;
	const database = await readyDatabase();
	const transaction = database.transaction(DATA_STORE, 'readonly');
	const store = transaction.objectStore(DATA_STORE);
	const tasksRequest = store.get(TASKS_KEY);
	const sessionsRequest = store.get(SESSIONS_KEY);
	const groveRequest = store.get(GROVE_KEY);
	const [tasks, sessions, grove] = await Promise.all([
		requestValue(tasksRequest),
		requestValue(sessionsRequest),
		requestValue(groveRequest),
		transactionComplete(transaction)
	]);

	return normalizeDurableData({
		tasks: normalizeFocusTasks(recordValue(tasks)),
		sessions: normalizeSessionHistory(recordValue(sessions)),
		grove: normalizeGroveState(recordValue(grove))
	});
}

export function saveDurableTasks(tasks: FocusTask[]): Promise<void> {
	return enqueueWrite(async () => {
		const database = await readyDatabase();
		await putRecord(database, TASKS_KEY, normalizeFocusTasks(tasks));
	});
}

export function saveDurableSessions(sessions: FocusSessionRecord[]): Promise<void> {
	return enqueueWrite(async () => {
		const database = await readyDatabase();
		await putRecord(database, SESSIONS_KEY, normalizeSessionHistory(sessions));
	});
}

export function saveDurableGrove(grove: GroveState): Promise<void> {
	return enqueueWrite(async () => {
		const database = await readyDatabase();
		await putRecord(database, GROVE_KEY, normalizeGroveState(grove));
	});
}

export function replaceDurableData(data: DurableData): Promise<void> {
	const normalized = normalizeDurableData(data);
	return enqueueWrite(async () => {
		const database = await readyDatabase();
		await writeDataTransaction(database, normalized, false);
	});
}

export function readLegacyDurableData(): DurableData {
	assertBrowser();
	const sessions = loadLegacySessionHistory();
	const grove =
		localStorage.getItem(GROVE_STORAGE_KEY) === null
			? seedGroveState(sessions)
			: normalizeGroveState(readJson<unknown>(GROVE_STORAGE_KEY, null));
	return normalizeDurableData({ tasks: loadLegacyFocusTasks(), sessions, grove });
}

async function readyDatabase(): Promise<IDBDatabase> {
	const database = await openDatabase();
	migrationPromise ??= migrateLocalStorage(database).catch((error) => {
		migrationPromise = undefined;
		throw error;
	});
	await migrationPromise;
	return database;
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
		request.onupgradeneeded = () => {
			const database = request.result;
			if (!database.objectStoreNames.contains(DATA_STORE)) {
				database.createObjectStore(DATA_STORE, { keyPath: 'key' });
			}
		};
		request.onerror = () => {
			settled = true;
			reject(new DurableStorageError('Could not open the local database.', { cause: request.error }));
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

async function migrateLocalStorage(database: IDBDatabase): Promise<void> {
	const migrationRecord = await getRecord(database, MIGRATION_KEY);
	if (recordValue(migrationRecord) === true) return;

	const legacyData = readLegacyDurableData();
	await writeDataTransaction(database, legacyData, true);
	for (const key of LEGACY_STORAGE_KEYS) {
		try {
			localStorage.removeItem(key);
		} catch {
			// The database transaction is already durable; stale migration input is harmless.
		}
	}
}

async function writeDataTransaction(
	database: IDBDatabase,
	data: DurableData,
	markMigrated: boolean
): Promise<void> {
	const transaction = database.transaction(DATA_STORE, 'readwrite');
	const store = transaction.objectStore(DATA_STORE);
	store.put({ key: TASKS_KEY, value: data.tasks } satisfies DatabaseRecord);
	store.put({ key: SESSIONS_KEY, value: data.sessions } satisfies DatabaseRecord);
	store.put({ key: GROVE_KEY, value: data.grove } satisfies DatabaseRecord);
	if (markMigrated) store.put({ key: MIGRATION_KEY, value: true } satisfies DatabaseRecord);
	await transactionComplete(transaction);
}

async function putRecord(database: IDBDatabase, key: string, value: unknown): Promise<void> {
	const transaction = database.transaction(DATA_STORE, 'readwrite');
	transaction.objectStore(DATA_STORE).put({ key, value } satisfies DatabaseRecord);
	await transactionComplete(transaction);
}

async function getRecord(database: IDBDatabase, key: string): Promise<DatabaseRecord | undefined> {
	const transaction = database.transaction(DATA_STORE, 'readonly');
	const request = transaction.objectStore(DATA_STORE).get(key);
	const [record] = await Promise.all([requestValue(request), transactionComplete(transaction)]);
	return record as DatabaseRecord | undefined;
}

function enqueueWrite(operation: () => Promise<void>): Promise<void> {
	const result = writeQueue.then(operation);
	writeQueue = result.catch(() => undefined);
	return result;
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

function assertBrowser(): void {
	if (!browser) throw new DurableStorageError('Durable app data is only available in the browser.');
}
