import { browser } from '$app/environment';

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

	const blockLabel = completedContracts === 1 ? 'one focus block' : `${completedContracts} focus blocks`;
	const notification = new Notification('Another five minutes?', {
		body: `${intention || 'This session'} has reached ${blockLabel}. Add five minutes to continue.`,
		tag: 'just-5-more-minutes:contract-complete'
	});

	notification.onclick = () => {
		window.focus();
		notification.close();
	};
}
