<script lang="ts">
	import { themes, type ThemePreference } from '$lib/app/theme';
	import * as m from '$lib/paraglide/messages.js';

	let {
		value,
		onchange
	}: {
		value: ThemePreference;
		onchange: (theme: ThemePreference) => void;
	} = $props();
</script>

<label class="grid gap-2">
	<span class="text-sm font-bold text-ink-muted">{m.theme()}</span>
	<select
		class="min-h-10 w-full rounded-xl border border-moss/15 bg-surface px-3 text-sm font-bold text-ink outline-none transition focus:border-moss focus:ring-4 focus:ring-sprout/60"
		value={value}
		onchange={(event) => onchange(event.currentTarget.value as ThemePreference)}
	>
		<option value="auto">{m.theme_auto()}</option>
		{#each themes as theme (theme.id)}
			<option value={theme.id}>{theme.label()}</option>
		{/each}
	</select>
</label>
