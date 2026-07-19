import { browser } from '$app/environment';
import { storageKey } from './storage';

const INTRODUCTION_SEEN_KEY = storageKey('introduction-seen-v1');

export function hasSeenIntroduction(): boolean {
	return browser && localStorage.getItem(INTRODUCTION_SEEN_KEY) === 'true';
}

export function markIntroductionSeen(): void {
	if (browser) localStorage.setItem(INTRODUCTION_SEEN_KEY, 'true');
}
