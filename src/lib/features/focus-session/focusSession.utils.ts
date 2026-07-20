import type { FocusPhase } from './focusSession.types';

export const FIVE_MINUTES_SECONDS = 5 * 60;
export const MAX_START_DURATION_SECONDS = 999 * 60 + 59;

export type FocusListStartAction = 'start' | 'keep-current' | 'switch';

export function resolveFocusListStartAction(
	phase: FocusPhase,
	activeTaskId: string | null,
	selectedTaskId: string
): FocusListStartAction {
	if (phase === 'idle') return 'start';
	return selectedTaskId === activeTaskId ? 'keep-current' : 'switch';
}

export function normalizeStartDuration(seconds: number): number {
	if (!Number.isFinite(seconds)) return FIVE_MINUTES_SECONDS;
	return Math.max(1, Math.min(MAX_START_DURATION_SECONDS, Math.round(seconds)));
}

export function createSessionId(): string {
	return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function getSessionTitle(intention: string, fallback = 'Session'): string {
	const trimmed = intention.trim();
	return trimmed.length > 0 ? trimmed : fallback;
}
