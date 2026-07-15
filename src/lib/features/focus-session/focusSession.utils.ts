export const FIVE_MINUTES_SECONDS = 5 * 60;

export function createSessionId(): string {
	return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function getSessionTitle(intention: string): string {
	const trimmed = intention.trim();
	return trimmed.length > 0 ? trimmed : 'Session';
}
