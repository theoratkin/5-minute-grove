import { browser } from '$app/environment';
import { readJson, storageKey, writeJson } from '$lib/app/storage';
import { normalizeGroveState, reconcileGroveState, seedGroveState } from './grove.state';
import type { GroveSeedRecord, GroveState } from './grove.types';

const GROVE_KEY = storageKey('grove');

export function loadOrInitializeGrove(records: GroveSeedRecord[]): GroveState {
	if (!browser || localStorage.getItem(GROVE_KEY) === null) {
		const state = seedGroveState(records);
		if (browser) saveGroveState(state);
		return state;
	}

	const state = reconcileGroveState(
		normalizeGroveState(readJson<unknown>(GROVE_KEY, null)),
		records
	);
	if (browser) saveGroveState(state);
	return state;
}

export function saveGroveState(state: GroveState): void {
	writeJson(GROVE_KEY, state);
}
