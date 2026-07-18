import { FIVE_MINUTES_SECONDS } from './focusSession.utils.ts';
import type { ActiveFocusSession } from './focusSession.types.ts';

export type RestoredFocusSession = ActiveFocusSession & { completedWhileAway: boolean };

export function restoreFocusSession(
	session: ActiveFocusSession,
	now = Date.now()
): RestoredFocusSession {
	if (session.phase !== 'running' || session.segmentEndsAt === null) {
		return { ...session, completedWhileAway: false };
	}

	const remainingSeconds = Math.max(0, Math.ceil((session.segmentEndsAt - now) / 1000));
	if (remainingSeconds > 0) {
		return { ...session, remainingSeconds, completedWhileAway: false };
	}

	return {
		...session,
		phase: 'contract-complete',
		remainingSeconds: 0,
		completedContracts: session.completedContracts + 1,
		elapsedSessionSeconds: session.elapsedSessionSeconds + session.segmentDurationSeconds,
		segmentEndsAt: null,
		completedWhileAway: true
	};
}

export function elapsedInCurrentContract(
	remainingSeconds: number,
	segmentDurationSeconds = FIVE_MINUTES_SECONDS
): number {
	return Math.max(0, Math.min(segmentDurationSeconds, segmentDurationSeconds - remainingSeconds));
}
