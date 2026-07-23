<script lang="ts">
	import { languageOptions } from '$lib/app/language';
	import { getLocale, setLocale, type Locale } from '$lib/paraglide/runtime.js';
	import * as m from '$lib/paraglide/messages.js';
</script>

<label class="grid gap-2">
	<span class="px-1 text-sm font-bold text-ink-muted">{m.language()}</span>
	<span class="relative">
		<i class="ph-bold ph-translate pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-lg text-moss" aria-hidden="true"></i>
		<select class="min-h-11 w-full cursor-pointer appearance-none rounded-xl border border-ink/15 bg-paper py-2 pr-10 pl-10 text-sm font-bold text-ink transition hover:border-ink/25 focus:border-moss focus:outline-none" value={getLocale()} onchange={(event) => void setLocale(event.currentTarget.value as Locale)}>
			{#each languageOptions as option (option.code)}<option value={option.code}>{option.label}</option>{/each}
		</select>
		<i class="ph-bold ph-caret-down pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-sm text-ink-muted" aria-hidden="true"></i>
	</span>
</label>
