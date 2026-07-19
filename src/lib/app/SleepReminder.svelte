<script lang="ts">
	import { onMount } from 'svelte';
	import type { AppPreferences } from './preferences.svelte';
	import { localDateKey, shouldShowSleepReminder } from './sleepReminder';
	import * as m from '$lib/paraglide/messages.js';

	let { preferences }: { preferences: AppPreferences } = $props();
	let visible = $state(false);

	function checkReminder() {
		if (!preferences.loaded) return;
		const now = new Date();
		if (
			shouldShowSleepReminder(
				now,
				preferences.sleepReminderEnabled,
				preferences.lastSleepReminderDate
			)
		) {
			visible = true;
			preferences.markSleepReminderSeen(localDateKey(now));
		}
	}

	onMount(() => {
		const interval = window.setInterval(checkReminder, 60_000);
		return () => window.clearInterval(interval);
	});

	$effect(() => {
		if (preferences.loaded && preferences.sleepReminderEnabled) checkReminder();
		else visible = false;
	});
</script>

{#if visible}
	<aside
		class="fixed bottom-4 left-4 z-40 flex w-[min(24rem,calc(100vw-2rem))] items-start gap-3 rounded-[1.4rem_1.8rem_1.3rem_1.65rem] border border-surface/90 bg-paper/95 p-4 text-ink shadow-[0_16px_45px_rgb(0_0_0/16%)] backdrop-blur"
		aria-label={m.sleep_reminder_label()}
		role="status"
	>
		<span class="grid size-10 shrink-0 place-items-center rounded-full bg-mist text-xl text-moss" aria-hidden="true">
			<i class="ph-fill ph-moon-stars"></i>
		</span>
		<div class="min-w-0 flex-1 pt-0.5">
			<p class="font-display text-base font-semibold text-moss-dark">{m.sleep_reminder_title()}</p>
			<p class="mt-1 text-sm leading-relaxed text-ink-muted">
				{m.sleep_reminder_body()}
			</p>
		</div>
		<button
			class="grid size-10 shrink-0 place-items-center rounded-xl text-ink-muted transition hover:bg-mist hover:text-moss"
			type="button"
			aria-label={m.sleep_reminder_dismiss()}
			onclick={() => (visible = false)}
		>
			<i class="ph-bold ph-x" aria-hidden="true"></i>
		</button>
	</aside>
{/if}
