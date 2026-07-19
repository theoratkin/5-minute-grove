import { browser } from '$app/environment';
import { getContext, setContext } from 'svelte';
import { storageKey } from './storage';

const PREFERENCES_KEY = storageKey('preferences');
const PREFERENCES_CONTEXT = Symbol('app-preferences');

type StoredPreferences = {
	soundEnabled?: boolean;
	notificationsEnabled?: boolean;
	sleepReminderEnabled?: boolean;
	lastSleepReminderDate?: string;
};

export class AppPreferences {
	loaded = $state(false);
	soundEnabled = $state(true);
	notificationsEnabled = $state(false);
	sleepReminderEnabled = $state(true);
	lastSleepReminderDate = $state<string | undefined>();

	load() {
		if (!browser) return;
		try {
			const stored = JSON.parse(localStorage.getItem(PREFERENCES_KEY) ?? '{}') as StoredPreferences;
			this.soundEnabled = stored.soundEnabled ?? true;
			this.notificationsEnabled =
				(stored.notificationsEnabled ?? false) &&
				'Notification' in window &&
				Notification.permission === 'granted';
			this.sleepReminderEnabled = stored.sleepReminderEnabled ?? true;
			this.lastSleepReminderDate = stored.lastSleepReminderDate;
		} catch {
			// Keep the calm defaults if stored preferences are invalid.
		} finally {
			this.loaded = true;
		}
	}

	setSound(enabled: boolean) {
		this.soundEnabled = enabled;
		this.save();
	}

	setNotifications(enabled: boolean) {
		this.notificationsEnabled = enabled;
		this.save();
	}

	setSleepReminder(enabled: boolean) {
		this.sleepReminderEnabled = enabled;
		this.save();
	}

	markSleepReminderSeen(localDate: string) {
		this.lastSleepReminderDate = localDate;
		this.save();
	}

	private save() {
		if (!browser) return;
		localStorage.setItem(
			PREFERENCES_KEY,
			JSON.stringify({
				soundEnabled: this.soundEnabled,
				notificationsEnabled: this.notificationsEnabled,
				sleepReminderEnabled: this.sleepReminderEnabled,
				lastSleepReminderDate: this.lastSleepReminderDate
			})
		);
	}
}

export function providePreferences(preferences: AppPreferences) {
	setContext(PREFERENCES_CONTEXT, preferences);
}

export function usePreferences(): AppPreferences {
	return getContext<AppPreferences>(PREFERENCES_CONTEXT);
}
