import { browser } from '$app/environment';
import { getContext, setContext } from 'svelte';

const PREFERENCES_KEY = 'just-5-more-minutes:preferences';
const PREFERENCES_CONTEXT = Symbol('app-preferences');

type StoredPreferences = {
	soundEnabled?: boolean;
	notificationsEnabled?: boolean;
};

export class AppPreferences {
	soundEnabled = $state(true);
	notificationsEnabled = $state(false);

	load() {
		if (!browser) return;
		try {
			const stored = JSON.parse(localStorage.getItem(PREFERENCES_KEY) ?? '{}') as StoredPreferences;
			this.soundEnabled = stored.soundEnabled ?? true;
			this.notificationsEnabled =
				(stored.notificationsEnabled ?? false) &&
				'Notification' in window &&
				Notification.permission === 'granted';
		} catch {
			// Keep the calm defaults if stored preferences are invalid.
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

	private save() {
		if (!browser) return;
		localStorage.setItem(
			PREFERENCES_KEY,
			JSON.stringify({
				soundEnabled: this.soundEnabled,
				notificationsEnabled: this.notificationsEnabled
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
