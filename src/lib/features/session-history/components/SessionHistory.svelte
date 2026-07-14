<script lang="ts">
	import { formatMinutes } from '$lib/app/time';
	import type { FocusSessionRecord } from '$lib/features/focus-session/focusSession.types';

	let {
		records,
		onresume,
		deleteSprint
	}: {
		records: FocusSessionRecord[];
		onresume: (record: FocusSessionRecord) => void;
		deleteSprint: (id: string) => void;
	} = $props();

	function dayLabel(value: string): string {
		const date = new Date(value);
		const today = new Date();
		const yesterday = new Date();
		yesterday.setDate(today.getDate() - 1);

		if (date.toDateString() === today.toDateString()) return 'Today';
		if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
		return new Intl.DateTimeFormat(undefined, { month: 'long', day: 'numeric', year: 'numeric' }).format(date);
	}

	let groups = $derived.by(() => {
		const grouped = new Map<string, FocusSessionRecord[]>();
		for (const record of records) {
			const key = new Date(record.startedAt).toDateString();
			grouped.set(key, [...(grouped.get(key) ?? []), record]);
		}
		return [...grouped.entries()].map(([key, sprints]) => ({ key, label: dayLabel(sprints[0].startedAt), sprints }));
	});
</script>

<section class="grid gap-4" aria-label="Recent sprints">
	<div class="flex items-center justify-between gap-4">
		<h2 class="font-display text-2xl font-semibold tracking-[-0.03em] text-moss-dark">Recent sprints</h2>
		<span class="min-w-8 rounded-full bg-sprout px-2 py-0.5 text-center text-sm font-extrabold text-moss">{records.length}</span>
	</div>

	{#if records.length === 0}
		<p class="rounded-2xl border border-dashed border-moss/20 bg-mist/50 p-4 text-sm leading-relaxed text-ink-muted">No sprints yet. Completed five-minute contracts will be saved here.</p>
	{:else}
		<div class="grid gap-5">
			{#each groups as group (group.key)}
				<section class="grid gap-2.5" aria-label={group.label}>
					<h3 class="text-xs font-extrabold tracking-[0.12em] text-ink-muted uppercase">{group.label}</h3>
					<ul class="grid gap-2.5 p-0">
						{#each group.sprints as record (record.id)}
							<li class="grid gap-3 rounded-2xl border border-moss/10 bg-white/75 p-3">
								<div class="flex items-start justify-between gap-3">
									<strong class="max-w-48 wrap-anywhere text-sm font-extrabold text-ink">{record.title}</strong>
									<div class="grid flex-none justify-items-end">
										<span class="text-sm font-extrabold text-moss">{formatMinutes(record.totalSeconds)}</span>
										<span class="mt-1 text-xs font-bold text-ink-muted">{record.extensionCount} extensions</span>
									</div>
								</div>
								<div class="grid grid-cols-2 gap-2">
									<button class="min-h-9 rounded-xl bg-moss px-3 text-xs font-extrabold text-white transition hover:bg-moss-dark" type="button" onclick={() => onresume(record)}>Resume</button>
									<button class="min-h-9 rounded-xl border border-clay/25 px-3 text-xs font-bold text-clay transition hover:bg-clay/10" type="button" onclick={() => deleteSprint(record.id)}>Delete</button>
								</div>
							</li>
						{/each}
					</ul>
				</section>
			{/each}
		</div>
	{/if}
</section>
