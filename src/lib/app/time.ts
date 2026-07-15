export function formatClock(totalSeconds: number): string {
	const safeSeconds = Math.max(0, Math.floor(totalSeconds));
	const minutes = Math.floor(safeSeconds / 60);
	const seconds = safeSeconds % 60;

	return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

export function formatTime(value: string): string {
	return new Intl.DateTimeFormat(undefined, {
		hour: 'numeric',
		minute: '2-digit'
	}).format(new Date(value));
}

export function formatMinutes(totalSeconds: number): string {
	const minutes = Math.round(totalSeconds / 60);
	return `${minutes} min`;
}
