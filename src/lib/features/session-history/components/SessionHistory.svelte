<script lang="ts">
	import { formatMinutes, formatShortDateTime } from '$lib/app/time';
	import type { FocusSessionRecord } from '$lib/features/focus-session/focusSession.types';

	let { records }: { records: FocusSessionRecord[] } = $props();

	function reasonLabel(reason: FocusSessionRecord['reason']): string {
		if (reason === 'break') return 'Break';
		if (reason === 'switch') return 'Switched';
		return 'Done';
	}
</script>

<section class="grid gap-4" aria-label="Recent sessions">
	<div class="flex items-center justify-between gap-4">
		<h2 class="font-display text-2xl font-semibold tracking-[-0.03em] text-moss-dark">Recent starts</h2>
		<span class="min-w-8 rounded-full bg-sprout px-2 py-0.5 text-center text-sm font-extrabold text-moss">{records.length}</span>
	</div>

	{#if records.length === 0}
		<p class="rounded-2xl border border-dashed border-moss/20 bg-mist/50 p-4 text-sm leading-relaxed text-ink-muted">No starts logged yet. Your completed five-minute contracts will live here.</p>
	{:else}
		<ul class="grid gap-2.5 p-0">
			{#each records as record (record.id)}
				<li class="flex items-center justify-between gap-3 rounded-2xl border border-moss/10 bg-white/75 p-3">
					<div>
						<strong class="block max-w-48 wrap-anywhere text-sm font-extrabold text-ink">{record.intention}</strong>
						<span class="mt-1 block text-xs font-medium text-ink-muted">{formatShortDateTime(record.startedAt)} · {reasonLabel(record.reason)}</span>
					</div>
					<div class="grid flex-none justify-items-end">
						<span class="text-sm font-extrabold text-moss">{formatMinutes(record.totalSeconds)}</span>
						<span class="mt-1 text-xs font-bold text-ink-muted">{record.extensionCount} +5</span>
					</div>
				</li>
			{/each}
		</ul>
	{/if}
</section>
