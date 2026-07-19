import { browser } from '$app/environment';
import { readJson, storageKey, writeJson } from '$lib/app/storage';
import type { ActiveFocusSession, FocusPhase } from './focusSession.types';
import { FIVE_MINUTES_SECONDS, normalizeStartDuration } from './focusSession.utils';

const ACTIVE_SESSION_KEY = storageKey('active-session');
const START_DURATION_KEY = storageKey('start-duration');
const activePhases: FocusPhase[] = ['running', 'paused', 'contract-complete'];

export function loadActiveSession(): ActiveFocusSession | null {
	const value = readJson<Partial<ActiveFocusSession> | null>(ACTIVE_SESSION_KEY, null);
	if (
		!value ||
		value.version !== 1 ||
		typeof value.activeSessionId !== 'string' ||
		typeof value.sessionStartedAt !== 'string' ||
		typeof value.phase !== 'string' ||
		!activePhases.includes(value.phase as FocusPhase)
	) {
		return null;
	}

	return {
		version: 1,
		intention: typeof value.intention === 'string' ? value.intention : '',
		phase: value.phase as ActiveFocusSession['phase'],
		remainingSeconds: finiteNonNegative(value.remainingSeconds, 300),
		segmentDurationSeconds: Math.max(1, finiteNonNegative(value.segmentDurationSeconds, 300)),
		completedContracts: finiteNonNegative(value.completedContracts, 0),
		extensionCount: finiteNonNegative(value.extensionCount, 0),
		elapsedSessionSeconds: finiteNonNegative(value.elapsedSessionSeconds, 0),
		sessionStartedAt: value.sessionStartedAt,
		activeSessionId: value.activeSessionId,
		segmentEndsAt: typeof value.segmentEndsAt === 'number' ? value.segmentEndsAt : null
	};
}

export function saveActiveSession(session: ActiveFocusSession): void {
	writeJson(ACTIVE_SESSION_KEY, session);
}

export function clearActiveSession(): void {
	if (browser) localStorage.removeItem(ACTIVE_SESSION_KEY);
}

export function loadStartDuration(): number {
	return normalizeStartDuration(readJson(START_DURATION_KEY, FIVE_MINUTES_SECONDS));
}

export function saveStartDuration(seconds: number): void {
	writeJson(START_DURATION_KEY, normalizeStartDuration(seconds));
}

function finiteNonNegative(value: unknown, fallback: number): number {
	return typeof value === 'number' && Number.isFinite(value) ? Math.max(0, value) : fallback;
}
