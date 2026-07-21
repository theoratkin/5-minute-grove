<script lang="ts">
	import { onMount } from 'svelte';
	import { themes, type ThemePreference } from '$lib/app/theme';
	import type { AppPreferences } from '$lib/app/preferences.svelte';
	import { prepareTimerNotifications } from '$lib/app/notifications';
	import { languageOptions } from '$lib/app/language';
	import GroveLogo from '$lib/app/GroveLogo.svelte';
	import * as m from '$lib/paraglide/messages.js';
	import { getLocale, localizeHref, setLocale, type Locale } from '$lib/paraglide/runtime.js';

	let {
		theme,
		preferences,
		onThemeChange,
		onResetGrove,
		onPreviewSound
	}: {
		theme: ThemePreference;
		preferences: AppPreferences;
		onThemeChange: (theme: ThemePreference) => void;
		onResetGrove: () => void;
		onPreviewSound: () => void;
	} = $props();

	let themeMenu: HTMLDetailsElement;
	let preferencesMenu: HTMLDetailsElement;
	let mobileMenu: HTMLDetailsElement;
	let mobileThemeMenu: HTMLDetailsElement;
	let mobilePreferencesMenu: HTMLDetailsElement;
	let moreSettingsDialog: HTMLDialogElement;
	let notificationNote = $state('');
	let soundPreviewTimeout: ReturnType<typeof setTimeout> | undefined;
	let lastSoundPreviewAt = 0;
	const soundPreviewIntervalMs = 350;

	onMount(() => {
		function closeHeaderMenus(event: PointerEvent) {
			const target = event.target as Node;
			if (themeMenu.open && !themeMenu.contains(target)) themeMenu.open = false;
			if (preferencesMenu.open && !preferencesMenu.contains(target)) {
				preferencesMenu.open = false;
			}
			if (mobileMenu.open && !mobileMenu.contains(target)) mobileMenu.open = false;
		}

		function closeHeaderMenuWithEscape(event: KeyboardEvent) {
			if (event.key !== 'Escape') return;

			const openMenu = mobileThemeMenu.open
				? mobileThemeMenu
				: mobilePreferencesMenu.open
					? mobilePreferencesMenu
					: mobileMenu.open
						? mobileMenu
						: themeMenu.open
							? themeMenu
							: preferencesMenu.open
								? preferencesMenu
								: null;
			if (!openMenu) return;

			openMenu.open = false;
			openMenu.querySelector('summary')?.focus();
		}

		document.addEventListener('pointerdown', closeHeaderMenus);
		document.addEventListener('keydown', closeHeaderMenuWithEscape);

		return () => {
			document.removeEventListener('pointerdown', closeHeaderMenus);
			document.removeEventListener('keydown', closeHeaderMenuWithEscape);
			clearTimeout(soundPreviewTimeout);
		};
	});

	function selectTheme(nextTheme: ThemePreference) {
		onThemeChange(nextTheme);
	}

	function selectMobileTheme(nextTheme: ThemePreference) {
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
		const confirmed = window.confirm(m.reset_grove_confirmation());
		if (!confirmed) return;

		onResetGrove();
		preferencesMenu.open = false;
		moreSettingsDialog.close();
	}

	function openMoreSettings() {
		preferencesMenu.open = false;
		mobilePreferencesMenu.open = false;
		mobileMenu.open = false;
		moreSettingsDialog.showModal();
	}

	function handleSettingsBackdropClick(event: MouseEvent) {
		if (event.target === moreSettingsDialog) moreSettingsDialog.close();
	}

	function setSoundVolume(percent: number) {
		preferences.setSoundVolume(percent / 100);
		clearTimeout(soundPreviewTimeout);

		const elapsedSincePreview = Date.now() - lastSoundPreviewAt;
		if (elapsedSincePreview >= soundPreviewIntervalMs) {
			onPreviewSound();
			lastSoundPreviewAt = Date.now();
			return;
		}

		soundPreviewTimeout = setTimeout(() => {
			onPreviewSound();
			lastSoundPreviewAt = Date.now();
		}, soundPreviewIntervalMs - elapsedSincePreview);
	}
</script>

{#snippet languageSetting()}
	<label class="grid gap-2">
		<span class="px-1 text-sm font-bold text-ink-muted">{m.language()}</span>
		<span class="relative">
			<i class="ph-bold ph-translate pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-lg text-moss" aria-hidden="true"></i>
			<select
				class="min-h-11 w-full cursor-pointer appearance-none rounded-xl border border-ink/15 bg-paper py-2 pr-10 pl-10 text-sm font-bold text-ink transition hover:border-ink/25 focus:border-moss focus:outline-none"
				value={getLocale()}
				onchange={(event) => void setLocale(event.currentTarget.value as Locale)}
			>
				{#each languageOptions as option (option.code)}
					<option value={option.code}>{option.label}</option>
				{/each}
			</select>
			<i class="ph-bold ph-caret-down pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-sm text-ink-muted" aria-hidden="true"></i>
		</span>
	</label>
{/snippet}

{#snippet timerFeedbackSetting(withTopBorder = true)}
	<div class={`grid gap-2 ${withTopBorder ? 'border-t border-moss/10 pt-4' : ''}`}>
		<p class="px-1 text-sm font-bold text-ink-muted">{m.timer_feedback()}</p>
		<label class="flex min-h-11 cursor-pointer items-center justify-between gap-4 rounded-xl px-3 py-2 text-sm font-bold text-ink transition hover:bg-mist">
			<span class="flex items-center gap-2"><i class="ph-bold ph-speaker-high text-lg text-moss" aria-hidden="true"></i> {m.sounds()}</span>
			<input class="size-5 accent-moss" type="checkbox" checked={preferences.soundEnabled} onchange={(event) => preferences.setSound(event.currentTarget.checked)} />
		</label>
		<label class={`grid gap-2 rounded-xl px-3 py-2 transition ${preferences.soundEnabled ? 'text-ink' : 'text-ink-muted opacity-60'}`}>
			<span class="flex items-center justify-between gap-4 text-sm font-bold">
				<span>{m.sound_volume()}</span>
				<output>{Math.round(preferences.soundVolume * 100)}%</output>
			</span>
			<input
				class="h-5 w-full cursor-pointer accent-moss disabled:cursor-not-allowed"
				type="range"
				min="0"
				max="100"
				step="5"
				value={Math.round(preferences.soundVolume * 100)}
				disabled={!preferences.soundEnabled}
				oninput={(event) => setSoundVolume(event.currentTarget.valueAsNumber)}
			/>
		</label>
		<label class="flex min-h-11 cursor-pointer items-center justify-between gap-4 rounded-xl px-3 py-2 text-sm font-bold text-ink transition hover:bg-mist">
			<span class="flex items-center gap-2"><i class="ph-bold ph-bell text-lg text-moss" aria-hidden="true"></i> {m.notifications()}</span>
			<input class="size-5 accent-moss" type="checkbox" checked={preferences.notificationsEnabled} onchange={(event) => void toggleNotifications(event.currentTarget.checked)} />
		</label>
		{#if notificationNote}<p class="px-3 text-xs leading-relaxed text-ink-muted" aria-live="polite">{notificationNote}</p>{/if}
	</div>
{/snippet}

{#snippet themeOptions(onselect: (theme: ThemePreference) => void)}
	<button
		class={`flex w-full items-center justify-between gap-4 rounded-xl px-3 py-2.5 text-left text-sm font-bold transition hover:bg-mist ${theme === 'auto' ? 'bg-sprout/50 text-moss' : 'text-ink-muted'}`}
		type="button"
		onclick={() => onselect('auto')}
		aria-pressed={theme === 'auto'}
	>
		<span class="flex items-center gap-2.5">
			<span class="flex -space-x-1" aria-hidden="true">
				<span class="size-4 rounded-full border border-ink/20 bg-[#fbfaf5] shadow-sm ring-1 ring-paper"></span>
				<span class="size-4 rounded-full border border-ink/20 bg-[#202725] shadow-sm ring-1 ring-paper"></span>
			</span>
			<span>{m.theme_auto()}</span>
		</span>
		{#if theme === 'auto'}
			<i class="ph-bold ph-check text-base" aria-hidden="true"></i>
		{/if}
	</button>
	{#each themes as option (option.id)}
		<button
			class={`flex w-full items-center justify-between gap-4 rounded-xl px-3 py-2.5 text-left text-sm font-bold transition hover:bg-mist ${theme === option.id ? 'bg-sprout/50 text-moss' : 'text-ink-muted'}`}
			type="button"
			onclick={() => onselect(option.id)}
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
{/snippet}

<header class="relative z-20 mx-auto mt-4 w-[calc(100%-2rem)] max-w-[76rem] rounded-[1.1rem_1.7rem_1.25rem_1.5rem] border border-surface/90 bg-paper/95 shadow-[0_12px_36px_rgb(0_0_0/10%)] sm:w-[calc(100%-3rem)] lg:w-[calc(100%-4rem)]">
	<div class="flex min-h-16 w-full items-center justify-between gap-3 px-4 sm:gap-5 sm:px-6">
		<a class="flex min-w-0 items-center gap-2.5 whitespace-nowrap font-display text-xl font-semibold tracking-[-0.025em] text-moss-dark transition hover:text-moss" href={localizeHref('/')}>
			<span class="h-10 w-8 shrink-0" aria-hidden="true"><GroveLogo /></span>
			<span class="truncate">{m.app_name()}</span>
		</a>

		<nav class="hidden items-center gap-2 sm:flex" aria-label={m.primary_navigation()}>
			<a class="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-bold text-ink-muted transition hover:bg-mist hover:text-moss" href={localizeHref('/about')}>
				<i class="ph-bold ph-info text-lg text-moss" aria-hidden="true"></i>
				{m.about_link()}
			</a>
			<details
				bind:this={themeMenu}
				class="group relative"
				ontoggle={() => {
					if (themeMenu.open) preferencesMenu.open = false;
				}}
			>
				<summary
					class="grid size-10 cursor-pointer list-none place-items-center rounded-xl text-ink-muted transition marker:hidden hover:bg-mist hover:text-moss group-open:bg-mist group-open:text-moss"
					aria-label={m.theme()}
				>
					<i class="ph-bold ph-palette text-xl" aria-hidden="true"></i>
				</summary>

				<div class="absolute top-[calc(100%+0.5rem)] right-0 z-30 w-[min(18rem,calc(100vw-2rem))] rounded-2xl border border-surface/90 bg-paper p-3 shadow-[0_16px_45px_rgb(0_0_0/18%)]">
					<p class="mb-2 px-1 text-sm font-bold text-ink-muted">{m.theme()}</p>
					<div class="grid max-h-[calc(100vh-8rem)] gap-1 overflow-y-auto">
						{@render themeOptions(selectTheme)}
					</div>
				</div>
			</details>

			<details
				bind:this={preferencesMenu}
				class="group relative"
				ontoggle={() => {
					if (preferencesMenu.open) themeMenu.open = false;
				}}
			>
				<summary
					class="grid size-10 cursor-pointer list-none place-items-center rounded-xl text-ink-muted transition marker:hidden hover:bg-mist hover:text-moss group-open:bg-mist group-open:text-moss"
					aria-label={m.open_preferences()}
				>
					<i class="ph-bold ph-sliders-horizontal text-xl" aria-hidden="true"></i>
				</summary>

				<div class="absolute top-[calc(100%+0.5rem)] right-0 z-30 grid max-h-[calc(100vh-6rem)] w-[min(20rem,calc(100vw-2rem))] gap-4 overflow-y-auto rounded-2xl border border-surface/90 bg-paper p-4 shadow-[0_16px_45px_rgb(0_0_0/18%)]">
					{@render languageSetting()}
					{@render timerFeedbackSetting()}

					<button
						class="flex min-h-11 items-center justify-between gap-4 border-t border-moss/10 px-1 pt-4 text-left text-sm font-bold text-moss transition hover:text-moss-dark"
						type="button"
						onclick={openMoreSettings}
					>
						<span>{m.more_settings()}</span>
						<i class="ph-bold ph-arrow-right text-lg" aria-hidden="true"></i>
					</button>
				</div>
			</details>
		</nav>

		<nav class="sm:hidden" aria-label={m.primary_navigation()}>
			<details bind:this={mobileMenu} class="group relative">
				<summary
					class="grid size-11 cursor-pointer list-none place-items-center rounded-xl text-ink-muted transition marker:hidden hover:bg-mist hover:text-moss group-open:bg-mist group-open:text-moss"
					aria-label={m.primary_navigation()}
				>
					<i class="ph-bold ph-list text-2xl group-open:hidden" aria-hidden="true"></i>
					<i class="ph-bold ph-x hidden text-xl group-open:block" aria-hidden="true"></i>
				</summary>

				<div class="absolute top-[calc(100%+0.5rem)] right-0 z-30 grid max-h-[calc(100vh-6rem)] w-[min(22rem,calc(100vw-2rem))] gap-1 overflow-y-auto rounded-2xl border border-surface/90 bg-paper p-3 shadow-[0_16px_45px_rgb(0_0_0/18%)]">
					<a
						class="flex min-h-11 items-center gap-3 rounded-xl px-3 py-2 text-sm font-bold text-ink-muted transition hover:bg-mist hover:text-moss"
						href={localizeHref('/about')}
						onclick={() => (mobileMenu.open = false)}
					>
						<i class="ph-bold ph-info text-lg text-moss" aria-hidden="true"></i>
						{m.about_link()}
					</a>

					<details
						bind:this={mobileThemeMenu}
						class="group/theme"
						ontoggle={() => {
							if (mobileThemeMenu.open) mobilePreferencesMenu.open = false;
						}}
					>
						<summary class="flex min-h-11 cursor-pointer list-none items-center gap-3 rounded-xl px-3 py-2 text-sm font-bold text-ink-muted transition marker:hidden hover:bg-mist hover:text-moss group-open/theme:bg-mist group-open/theme:text-moss">
							<i class="ph-bold ph-palette text-lg text-moss" aria-hidden="true"></i>
							<span class="grow">{m.theme()}</span>
							<i class="ph-bold ph-caret-down transition group-open/theme:rotate-180" aria-hidden="true"></i>
						</summary>
						<div class="mt-1 grid gap-1 border-t border-moss/10 pt-2">
							{@render themeOptions(selectMobileTheme)}
						</div>
					</details>

					<details
						bind:this={mobilePreferencesMenu}
						class="group/settings"
						ontoggle={() => {
							if (mobilePreferencesMenu.open) mobileThemeMenu.open = false;
						}}
					>
						<summary class="flex min-h-11 cursor-pointer list-none items-center gap-3 rounded-xl px-3 py-2 text-sm font-bold text-ink-muted transition marker:hidden hover:bg-mist hover:text-moss group-open/settings:bg-mist group-open/settings:text-moss">
							<i class="ph-bold ph-sliders-horizontal text-lg text-moss" aria-hidden="true"></i>
							<span class="grow">{m.all_settings()}</span>
							<i class="ph-bold ph-caret-down transition group-open/settings:rotate-180" aria-hidden="true"></i>
						</summary>
						<div class="mt-1 grid gap-4 border-t border-moss/10 px-1 pt-3">
							{@render languageSetting()}
							{@render timerFeedbackSetting()}
							<button
								class="flex min-h-11 items-center justify-between gap-4 border-t border-moss/10 px-1 pt-4 text-left text-sm font-bold text-moss transition hover:text-moss-dark"
								type="button"
								onclick={openMoreSettings}
							>
								<span>{m.more_settings()}</span>
								<i class="ph-bold ph-arrow-right text-lg" aria-hidden="true"></i>
							</button>
						</div>
					</details>
				</div>
			</details>
		</nav>
	</div>
</header>

<dialog
	bind:this={moreSettingsDialog}
	class="m-auto max-h-[calc(100%-2rem)] w-[min(34rem,calc(100%-2rem))] overflow-hidden rounded-[2rem_1.5rem_1.85rem_1.35rem] border border-surface/90 bg-paper p-0 text-ink shadow-[0_28px_90px_rgb(0_0_0/30%)] backdrop:bg-ink/45 backdrop:backdrop-blur-[2px]"
	aria-labelledby="settings-title"
	onclick={handleSettingsBackdropClick}
>
	<div class="relative grid max-h-[calc(100vh-2rem)] gap-5 overflow-y-auto p-6 sm:p-8">
		<div class="pr-12">
			<h2 id="settings-title" class="font-display text-2xl font-semibold tracking-[-0.03em] text-moss-dark sm:text-3xl">
				{m.all_settings()}
			</h2>
		</div>
		<button
			class="absolute top-4 right-4 grid size-11 place-items-center rounded-xl text-ink-muted transition hover:bg-mist hover:text-moss"
			type="button"
			aria-label={m.close_settings()}
			onclick={() => moreSettingsDialog.close()}
		>
			<i class="ph-bold ph-x text-lg" aria-hidden="true"></i>
		</button>

		{@render languageSetting()}
		{@render timerFeedbackSetting()}

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
				<p class="mt-1 text-xs leading-relaxed text-ink-muted">{m.grove_reset_description()}</p>
			</div>
			<button
				class="min-h-11 rounded-xl border border-red-700 bg-red-600 px-3 py-2 text-left text-sm font-bold text-white transition hover:border-red-800 hover:bg-red-700"
				type="button"
				onclick={confirmGroveReset}
			>
				<span class="flex items-center gap-2"><i class="ph-bold ph-arrow-counter-clockwise text-lg" aria-hidden="true"></i> {m.reset_grove()}</span>
			</button>
		</div>
	</div>
</dialog>
