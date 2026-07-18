const SLEEP_REMINDER_END_HOUR = 6;

export function localDateKey(date: Date): string {
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, '0');
	const day = String(date.getDate()).padStart(2, '0');
	return `${year}-${month}-${day}`;
}

export function shouldShowSleepReminder(
	now: Date,
	enabled: boolean,
	lastSeenDate?: string
): boolean {
	if (!enabled || now.getHours() >= SLEEP_REMINDER_END_HOUR) return false;
	return lastSeenDate !== localDateKey(now);
}
