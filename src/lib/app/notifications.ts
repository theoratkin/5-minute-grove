import { browser } from '$app/environment';

type ContractCompleteNotification = {
	intention: string;
	completedContracts: number;
};

function canUseNotifications() {
	return browser && 'Notification' in window;
}

export async function prepareTimerNotifications() {
	if (!canUseNotifications()) return;
	if (Notification.permission !== 'default') return;

	try {
		await Notification.requestPermission();
	} catch {
		// Notification permission is optional; the timer still works without it.
	}
}

export function notifyContractComplete({
	intention,
	completedContracts
}: ContractCompleteNotification) {
	if (!canUseNotifications() || Notification.permission !== 'granted') return;

	const blockLabel = completedContracts === 1 ? 'one finished block' : `${completedContracts} finished blocks`;
	const notification = new Notification('Five minutes counts.', {
		body: `${intention || 'This start'} has ${blockLabel}. Stop here or add 5 minutes.`,
		tag: 'just-5-more-minutes:contract-complete'
	});

	notification.onclick = () => {
		window.focus();
		notification.close();
	};
}
