import { browser } from '$app/environment';
import * as m from '$lib/paraglide/messages.js';

type ContractCompleteNotification = {
	intention: string;
	completedContracts: number;
};

function canUseNotifications() {
	return browser && 'Notification' in window;
}

export async function prepareTimerNotifications(): Promise<NotificationPermission | 'unsupported'> {
	if (!canUseNotifications()) return 'unsupported';
	if (Notification.permission !== 'default') return Notification.permission;

	try {
		return await Notification.requestPermission();
	} catch {
		// Notification permission is optional; the timer still works without it.
		return Notification.permission;
	}
}

export function notifyContractComplete({
	intention,
	completedContracts
}: ContractCompleteNotification) {
	if (!canUseNotifications() || Notification.permission !== 'granted') return;

	const blockLabel = completedContracts === 1
		? m.notification_block_one()
		: m.notification_block_other({ count: completedContracts });
	const notification = new Notification(m.notification_title(), {
		body: m.notification_body({
			intention: intention || m.notification_focus_fallback(),
			blockLabel
		}),
		tag: '5-minute-grove:contract-complete'
	});

	notification.onclick = () => {
		window.focus();
		notification.close();
	};
}
