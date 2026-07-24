<script lang="ts">
	import type { AppPreferences } from '$lib/app/preferences.svelte';
	import * as m from '$lib/paraglide/messages.js';

	let { preferences }: { preferences: AppPreferences } = $props();

	let positionLabel = $derived(
		preferences.focusListPosition === 'left' ? m.position_left() : m.position_right()
	);

	function togglePosition() {
		preferences.setFocusListPosition(
			preferences.focusListPosition === 'left' ? 'right' : 'left'
		);
	}
</script>

<div class="flex min-h-11 items-center justify-between gap-4 px-1">
	<span class="flex items-center gap-2 text-sm font-bold text-ink">
		<i class="ph-bold ph-sidebar text-lg text-moss" aria-hidden="true"></i>
		{m.focus_list_position()}
	</span>
	<button
		class="min-h-9 shrink-0 rounded-lg bg-mist px-2.5 text-sm font-extrabold text-moss transition hover:text-moss-dark"
		type="button"
		aria-label={`${m.focus_list_position()}: ${positionLabel}`}
		onclick={togglePosition}
	>
		{positionLabel}
	</button>
</div>
