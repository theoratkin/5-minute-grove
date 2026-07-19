<script lang="ts">
	import { onMount } from 'svelte';
	import { themes, type ThemeId } from '$lib/app/theme';
	import type { AppPreferences } from '$lib/app/preferences.svelte';
	import { prepareTimerNotifications } from '$lib/app/notifications';
	import * as m from '$lib/paraglide/messages.js';
	import { localizeHref } from '$lib/paraglide/runtime.js';

	let {
		theme,
		preferences,
		onThemeChange,
		onResetGrove
	}: {
		theme: ThemeId;
		preferences: AppPreferences;
		onThemeChange: (theme: ThemeId) => void;
		onResetGrove: () => void;
	} = $props();

	let themeMenu: HTMLDetailsElement;
	let notificationNote = $state('');

	onMount(() => {
		function closeThemeMenu(event: PointerEvent) {
			if (themeMenu.open && !themeMenu.contains(event.target as Node)) {
				themeMenu.open = false;
			}
		}

		function closeThemeMenuWithEscape(event: KeyboardEvent) {
			if (event.key === 'Escape' && themeMenu.open) {
				themeMenu.open = false;
				themeMenu.querySelector('summary')?.focus();
			}
		}

		document.addEventListener('pointerdown', closeThemeMenu);
		document.addEventListener('keydown', closeThemeMenuWithEscape);

		return () => {
			document.removeEventListener('pointerdown', closeThemeMenu);
			document.removeEventListener('keydown', closeThemeMenuWithEscape);
		};
	});

	function selectTheme(nextTheme: ThemeId) {
		onThemeChange(nextTheme);
	}

	async function toggleNotifications(enabled: boolean) {
		if (!enabled) {
			preferences.setNotifications(false);
			notificationNote = '';
			return;
		}

		const permission = await prepareTimerNotifications();
		const available = permission === 'granted';
		preferences.setNotifications(available);
		notificationNote = available
			? m.notifications_enabled()
			: permission === 'unsupported'
				? m.notifications_unsupported()
				: m.notifications_denied();
	}

	function confirmGroveReset() {
		const confirmed = window.confirm(
			m.reset_grove_confirmation()
		);
		if (!confirmed) return;

		onResetGrove();
		themeMenu.open = false;
	}
</script>

<header class="relative z-20 mx-auto mt-4 w-[calc(100%-2rem)] max-w-[76rem] rounded-[1.1rem_1.7rem_1.25rem_1.5rem] border border-surface/90 bg-paper/95 shadow-[0_12px_36px_rgb(0_0_0/10%)] sm:w-[calc(100%-3rem)] lg:w-[calc(100%-4rem)]">
	<div class="flex min-h-16 w-full items-center justify-between gap-5 px-4 sm:px-6 lg:px-8">
		<a class="font-display text-xl font-semibold tracking-[-0.025em] text-moss-dark transition hover:text-moss" href={localizeHref('/')}>
			{m.app_name()}
		</a>

		<nav class="flex items-center gap-1 sm:gap-2" aria-label={m.primary_navigation()}>
			<a class="rounded-xl px-3 py-2 text-sm font-bold text-ink-muted transition hover:bg-mist hover:text-moss" href={localizeHref('/about')}>{m.about_link()}</a>
			<details bind:this={themeMenu} class="group relative">
				<summary
					class="grid size-10 cursor-pointer list-none place-items-center rounded-xl text-ink-muted transition marker:hidden hover:bg-mist hover:text-moss group-open:bg-mist group-open:text-moss"
					aria-label={m.open_preferences()}
				>
					<i class="ph-bold ph-sliders-horizontal text-xl" aria-hidden="true"></i>
				</summary>

				<div class="absolute top-[calc(100%+0.5rem)] right-0 z-30 grid w-[min(20rem,calc(100vw-2rem))] gap-4 rounded-2xl border border-surface/90 bg-paper p-4 shadow-[0_16px_45px_rgb(0_0_0/18%)]">
					<div>
						<p class="mb-2 px-1 text-sm font-bold text-ink-muted">{m.theme()}</p>
						<div class="grid gap-1">
					{#each themes as option (option.id)}
						<button
							class={`flex w-full items-center justify-between gap-4 rounded-xl px-3 py-2.5 text-left text-sm font-bold transition hover:bg-mist ${theme === option.id ? 'bg-sprout/50 text-moss' : 'text-ink-muted'}`}
							type="button"
							onclick={() => selectTheme(option.id)}
							aria-pressed={theme === option.id}
						>
							<span class="flex items-center gap-2.5">
								<span class="flex -space-x-1" aria-hidden="true">
									{#each option.swatches as color}
										<span
											class="size-4 rounded-full border border-ink/20 shadow-sm ring-1 ring-paper"
											style:background-color={color}
										></span>
									{/each}
								</span>
								<span>{option.label()}</span>
							</span>
							{#if theme === option.id}
								<i class="ph-bold ph-check text-base" aria-hidden="true"></i>
							{/if}
						</button>
					{/each}
						</div>
					</div>

					<div class="grid gap-2 border-t border-moss/10 pt-4">
						<p class="px-1 text-sm font-bold text-ink-muted">{m.timer_feedback()}</p>
						<label class="flex min-h-11 cursor-pointer items-center justify-between gap-4 rounded-xl px-3 py-2 text-sm font-bold text-ink transition hover:bg-mist">
							<span class="flex items-center gap-2"><i class="ph-bold ph-speaker-high text-lg text-moss" aria-hidden="true"></i> {m.sounds()}</span>
							<input class="size-5 accent-moss" type="checkbox" checked={preferences.soundEnabled} onchange={(event) => preferences.setSound(event.currentTarget.checked)} />
						</label>
						<label class="flex min-h-11 cursor-pointer items-center justify-between gap-4 rounded-xl px-3 py-2 text-sm font-bold text-ink transition hover:bg-mist">
							<span class="flex items-center gap-2"><i class="ph-bold ph-bell text-lg text-moss" aria-hidden="true"></i> {m.notifications()}</span>
							<input class="size-5 accent-moss" type="checkbox" checked={preferences.notificationsEnabled} onchange={(event) => void toggleNotifications(event.currentTarget.checked)} />
						</label>
						{#if notificationNote}<p class="px-3 text-xs leading-relaxed text-ink-muted" aria-live="polite">{notificationNote}</p>{/if}
					</div>

					<div class="grid gap-2 border-t border-moss/10 pt-4">
						<div class="px-1">
							<p class="text-sm font-bold text-ink-muted">{m.wellbeing()}</p>
							<p class="mt-1 text-xs leading-relaxed text-ink-muted">{m.wellbeing_description()}</p>
						</div>
						<label class="flex min-h-11 cursor-pointer items-center justify-between gap-4 rounded-xl px-3 py-2 text-sm font-bold text-ink transition hover:bg-mist">
							<span class="flex items-center gap-2"><i class="ph-bold ph-moon-stars text-lg text-moss" aria-hidden="true"></i> {m.sleep_reminder_setting()}</span>
							<input class="size-5 accent-moss" type="checkbox" checked={preferences.sleepReminderEnabled} onchange={(event) => preferences.setSleepReminder(event.currentTarget.checked)} />
						</label>
					</div>

					<div class="grid gap-2 border-t border-moss/10 pt-4">
						<div class="px-1">
							<p class="text-sm font-bold text-ink-muted">{m.grove()}</p>
							<p class="mt-1 text-xs leading-relaxed text-ink-muted">
								{m.grove_reset_description()}
							</p>
						</div>
						<button
							class="min-h-11 rounded-xl border border-ink/15 px-3 py-2 text-left text-sm font-bold text-ink-muted transition hover:border-ink/25 hover:bg-mist hover:text-ink"
							type="button"
							onclick={confirmGroveReset}
						>
							<span class="flex items-center gap-2"
								><i
									class="ph-bold ph-arrow-counter-clockwise text-lg"
									aria-hidden="true"
								></i> {m.reset_grove()}</span
							>
						</button>
					</div>
				</div>
			</details>
		</nav>
	</div>
</header>
