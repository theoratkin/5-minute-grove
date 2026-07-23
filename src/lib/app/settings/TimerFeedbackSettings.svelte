<script lang="ts">
	import { onDestroy } from 'svelte';
	import type { AppPreferences } from '$lib/app/preferences.svelte';
	import { prepareTimerNotifications } from '$lib/app/notifications';
	import * as m from '$lib/paraglide/messages.js';

	let { preferences, onPreviewSound, withTopBorder = true }: { preferences: AppPreferences; onPreviewSound: () => void; withTopBorder?: boolean } = $props();
	let notificationNote = $state('');
	let soundPreviewTimeout: ReturnType<typeof setTimeout> | undefined;
	let lastSoundPreviewAt = 0;
	const soundPreviewIntervalMs = 350;

	async function toggleNotifications(enabled: boolean) {
		if (!enabled) { preferences.setNotifications(false); notificationNote = ''; return; }
		const permission = await prepareTimerNotifications();
		const available = permission === 'granted';
		preferences.setNotifications(available);
		notificationNote = available ? m.notifications_enabled() : permission === 'unsupported' ? m.notifications_unsupported() : m.notifications_denied();
	}

	function setSoundVolume(percent: number) {
		preferences.setSoundVolume(percent / 100);
		clearTimeout(soundPreviewTimeout);
		const wait = soundPreviewIntervalMs - (Date.now() - lastSoundPreviewAt);
		if (wait <= 0) { onPreviewSound(); lastSoundPreviewAt = Date.now(); return; }
		soundPreviewTimeout = setTimeout(() => { onPreviewSound(); lastSoundPreviewAt = Date.now(); }, wait);
	}

	onDestroy(() => clearTimeout(soundPreviewTimeout));
</script>

<div class={`grid gap-2 ${withTopBorder ? 'border-t border-moss/10 pt-4' : ''}`}>
	<p class="px-1 text-sm font-bold text-ink-muted">{m.timer_feedback()}</p>
	<label class="flex min-h-11 cursor-pointer items-center justify-between gap-4 rounded-xl px-3 py-2 text-sm font-bold text-ink transition hover:bg-mist"><span class="flex items-center gap-2"><i class="ph-bold ph-speaker-high text-lg text-moss" aria-hidden="true"></i> {m.sounds()}</span><input class="size-5 accent-moss" type="checkbox" checked={preferences.soundEnabled} onchange={(event) => preferences.setSound(event.currentTarget.checked)} /></label>
	<label class={`grid gap-2 rounded-xl px-3 py-2 transition ${preferences.soundEnabled ? 'text-ink' : 'text-ink-muted opacity-60'}`}>
		<span class="flex items-center justify-between gap-4 text-sm font-bold"><span>{m.sound_volume()}</span><output>{Math.round(preferences.soundVolume * 100)}%</output></span>
		<input class="h-5 w-full cursor-pointer accent-moss disabled:cursor-not-allowed" type="range" min="0" max="100" step="5" value={Math.round(preferences.soundVolume * 100)} disabled={!preferences.soundEnabled} oninput={(event) => setSoundVolume(event.currentTarget.valueAsNumber)} />
	</label>
	<label class="flex min-h-11 cursor-pointer items-center justify-between gap-4 rounded-xl px-3 py-2 text-sm font-bold text-ink transition hover:bg-mist"><span class="flex items-center gap-2"><i class="ph-bold ph-bell text-lg text-moss" aria-hidden="true"></i> {m.notifications()}</span><input class="size-5 accent-moss" type="checkbox" checked={preferences.notificationsEnabled} onchange={(event) => void toggleNotifications(event.currentTarget.checked)} /></label>
	{#if notificationNote}<p class="px-3 text-xs leading-relaxed text-ink-muted" aria-live="polite">{notificationNote}</p>{/if}
</div>
