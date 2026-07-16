<script lang="ts">
	import { onMount } from 'svelte';
	import { themes, type ThemeId } from '$lib/app/theme';

	let {
		theme,
		onThemeChange
	}: {
		theme: ThemeId;
		onThemeChange: (theme: ThemeId) => void;
	} = $props();

	let themeMenu: HTMLDetailsElement;

	onMount(() => {
		function closeThemeMenu(event: PointerEvent) {
			if (themeMenu.open && !themeMenu.contains(event.target as Node)) {
				themeMenu.open = false;
			}
		}

		document.addEventListener('pointerdown', closeThemeMenu);

		return () => document.removeEventListener('pointerdown', closeThemeMenu);
	});

	function selectTheme(nextTheme: ThemeId) {
		onThemeChange(nextTheme);
		themeMenu.open = false;
	}
</script>

<header class="relative z-20 mx-auto mt-4 w-[calc(100%-2rem)] max-w-6xl rounded-2xl border border-surface/90 bg-paper/85 shadow-[0_12px_36px_rgb(0_0_0/10%)] backdrop-blur sm:w-[calc(100%-3rem)] lg:w-[calc(100%-4rem)]">
	<div class="flex min-h-16 w-full items-center justify-between gap-5 px-4 sm:px-6 lg:px-8">
		<a class="font-display text-xl font-semibold tracking-[-0.025em] text-moss-dark transition hover:text-moss" href="/">
			Just 5 More Minutes
		</a>

		<nav class="flex items-center gap-1 sm:gap-2" aria-label="Primary navigation">
			<a class="rounded-xl px-3 py-2 text-sm font-bold text-ink-muted transition hover:bg-mist hover:text-moss" href="/about">About</a>
			<details bind:this={themeMenu} class="group relative">
				<summary
					class="grid size-10 cursor-pointer list-none place-items-center rounded-xl text-ink-muted transition marker:hidden hover:bg-mist hover:text-moss group-open:bg-mist group-open:text-moss"
					aria-label="Choose theme"
				>
					<i class="ph-bold ph-palette text-xl" aria-hidden="true"></i>
				</summary>

				<div class="absolute top-[calc(100%+0.5rem)] right-0 z-30 grid min-w-48 gap-1 rounded-2xl border border-surface/90 bg-paper p-2 shadow-[0_16px_45px_rgb(0_0_0/18%)]">
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
								<span>{option.label}</span>
							</span>
							{#if theme === option.id}
								<i class="ph-bold ph-check text-base" aria-hidden="true"></i>
							{/if}
						</button>
					{/each}
				</div>
			</details>
		</nav>
	</div>
</header>
