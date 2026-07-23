<script lang="ts">
	import { themes, type ThemePreference } from '$lib/app/theme';
	import * as m from '$lib/paraglide/messages.js';

	let { theme, onselect }: { theme: ThemePreference; onselect: (theme: ThemePreference) => void } = $props();
</script>

<button class={`flex w-full items-center justify-between gap-4 rounded-xl px-3 py-2.5 text-left text-sm font-bold transition hover:bg-mist ${theme === 'auto' ? 'bg-sprout/50 text-moss' : 'text-ink-muted'}`} type="button" onclick={() => onselect('auto')} aria-pressed={theme === 'auto'}>
	<span class="flex items-center gap-2.5"><span class="flex -space-x-1" aria-hidden="true"><span class="size-4 rounded-full border border-ink/20 bg-[#fbfaf5] shadow-sm ring-1 ring-paper"></span><span class="size-4 rounded-full border border-ink/20 bg-[#202725] shadow-sm ring-1 ring-paper"></span></span><span>{m.theme_auto()}</span></span>
	{#if theme === 'auto'}<i class="ph-bold ph-check text-base" aria-hidden="true"></i>{/if}
</button>
{#each themes as option (option.id)}
	<button class={`flex w-full items-center justify-between gap-4 rounded-xl px-3 py-2.5 text-left text-sm font-bold transition hover:bg-mist ${theme === option.id ? 'bg-sprout/50 text-moss' : 'text-ink-muted'}`} type="button" onclick={() => onselect(option.id)} aria-pressed={theme === option.id}>
		<span class="flex items-center gap-2.5"><span class="flex -space-x-1" aria-hidden="true">{#each option.swatches as color}<span class="size-4 rounded-full border border-ink/20 shadow-sm ring-1 ring-paper" style:background-color={color}></span>{/each}</span><span>{option.label()}</span></span>
		{#if theme === option.id}<i class="ph-bold ph-check text-base" aria-hidden="true"></i>{/if}
	</button>
{/each}
