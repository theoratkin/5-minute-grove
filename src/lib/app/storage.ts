import { browser } from '$app/environment';

const STORAGE_PREFIX = '5-minute-grove';

type StoredValueName =
	| 'active-session'
	| 'introduction-seen-v1'
	| 'preferences'
	| 'clock-mode'
	| 'start-duration'
	| 'theme';

export function storageKey(name: StoredValueName): string {
	return `${STORAGE_PREFIX}:${name}`;
}

export function readJson<T>(key: string, fallback: T): T {
	if (!browser) return fallback;

	const raw = localStorage.getItem(key);
	if (!raw) return fallback;

	try {
		return JSON.parse(raw) as T;
	} catch {
		return fallback;
	}
}

export function writeJson<T>(key: string, value: T): void {
	if (!browser) return;
	localStorage.setItem(key, JSON.stringify(value));
}
