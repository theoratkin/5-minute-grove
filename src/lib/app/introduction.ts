import { browser } from '$app/environment';

const INTRODUCTION_SEEN_KEY = 'just-5-more-minutes:introduction-seen-v1';

export function hasSeenIntroduction(): boolean {
	return browser && localStorage.getItem(INTRODUCTION_SEEN_KEY) === 'true';
}

export function markIntroductionSeen(): void {
	if (browser) localStorage.setItem(INTRODUCTION_SEEN_KEY, 'true');
}
