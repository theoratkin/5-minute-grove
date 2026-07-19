export function formatClock(totalSeconds: number): string {
	const safeSeconds = Math.max(0, Math.floor(totalSeconds));
	const hours = Math.floor(safeSeconds / 3600);
	const minutes = Math.floor((safeSeconds % 3600) / 60);
	const seconds = safeSeconds % 60;
	const clock = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

	return hours > 0 ? `${hours.toString().padStart(2, '0')}:${clock}` : clock;
}

export function formatTime(value: string): string {
	return new Intl.DateTimeFormat(getLocale(), {
		hour: 'numeric',
		minute: '2-digit'
	}).format(new Date(value));
}

export function formatMinutes(totalSeconds: number): string {
	const minutes = Math.round(totalSeconds / 60);
	return m.minutes_short({ minutes });
}
import * as m from '$lib/paraglide/messages.js';
import { getLocale } from '$lib/paraglide/runtime.js';
