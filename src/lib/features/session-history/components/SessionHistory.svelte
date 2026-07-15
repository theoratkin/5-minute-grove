<script lang="ts">
	import { formatMinutes, formatTime } from '$lib/app/time';
	import type { FocusSessionRecord } from '$lib/features/focus-session/focusSession.types';
	import { Play, Trash2 } from '@lucide/svelte';

	let {
		records,
		currentSession = null,
		onresume,
		deleteSession
	}: {
		records: FocusSessionRecord[];
		currentSession?: FocusSessionRecord | null;
		onresume: (record: FocusSessionRecord) => void;
		deleteSession: (id: string) => void;
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
		for (const record of records.filter((record) => record.id !== currentSession?.id)) {
			const key = new Date(record.startedAt).toDateString();
			grouped.set(key, [...(grouped.get(key) ?? []), record]);
		}
		return [...grouped.entries()].map(([key, sessions]) => ({ key, label: dayLabel(sessions[0].startedAt), sessions }));
	});

	let sessionCount = $derived(records.filter((record) => record.id !== currentSession?.id).length + Number(currentSession !== null));
</script>

<section class="grid gap-4" aria-label="Recent sessions">
	<div class="flex items-center justify-between gap-4">
		<h2 class="font-display text-2xl font-semibold tracking-[-0.03em] text-moss-dark">Recent sessions</h2>
		<span class="min-w-8 rounded-full bg-sprout px-2 py-0.5 text-center text-sm font-extrabold text-moss">{sessionCount}</span>
	</div>

	{#if currentSession === null && records.length === 0}
		<p class="rounded-2xl border border-dashed border-moss/20 bg-mist/50 p-4 text-sm leading-relaxed text-ink-muted">No sessions yet. Completed five-minute blocks will be saved here.</p>
	{:else}
		<div class="grid gap-5">
			{#if currentSession}
				<section class="grid gap-2.5" aria-label="Current session">
					<h3 class="text-xs font-extrabold tracking-[0.12em] text-moss uppercase">In progress</h3>
					<div class="grid gap-3 rounded-2xl border border-moss/20 bg-sprout/25 p-3">
						<div class="flex items-start justify-between gap-3">
							<strong class="max-w-48 wrap-anywhere text-sm font-extrabold text-ink">{currentSession.title}</strong>
							<div class="grid flex-none justify-items-end">
								<span class="text-sm font-extrabold text-moss">{formatMinutes(currentSession.totalSeconds)}</span>
								<span class="mt-1 text-xs font-bold text-ink-muted">{currentSession.extensionCount} extensions</span>
							</div>
						</div>
						<span class="text-xs font-bold text-moss">Current session</span>
					</div>
				</section>
			{/if}
			{#each groups as group (group.key)}
				<section class="grid gap-2.5" aria-label={group.label}>
					<h3 class="text-xs font-extrabold tracking-[0.12em] text-ink-muted uppercase">{group.label}</h3>
					<ul class="grid gap-2.5 p-0">
						{#each group.sessions as record (record.id)}
							<li class="grid gap-3 rounded-2xl border border-moss/10 bg-surface/75 p-3">
								<div class="flex items-start justify-between gap-3">
									<div class="grid min-w-0 gap-1">
										<strong class="max-w-48 wrap-anywhere text-sm font-extrabold text-ink">{record.title}</strong>
										<span class="text-xs font-bold text-ink-muted">{formatTime(record.startedAt)}</span>
									</div>
									<div class="grid flex-none justify-items-end">
										<span class="text-sm font-extrabold text-moss">{formatMinutes(record.totalSeconds)}</span>
										<span class="mt-1 text-xs font-bold text-ink-muted">{record.extensionCount} extensions</span>
									</div>
								</div>
								<div class="flex justify-end gap-2">
									<button class="grid size-9 place-items-center rounded-xl bg-moss text-on-accent transition hover:bg-moss-dark" type="button" aria-label={`Resume ${record.title}`} title="Resume session" onclick={() => onresume(record)}>
										<Play size={16} fill="currentColor" aria-hidden="true" />
									</button>
									<button class="grid size-9 place-items-center rounded-xl border border-clay/25 text-clay transition hover:bg-clay/10" type="button" aria-label={`Delete ${record.title}`} title="Delete session" onclick={() => deleteSession(record.id)}>
										<Trash2 size={16} strokeWidth={2.25} aria-hidden="true" />
									</button>
								</div>
							</li>
						{/each}
					</ul>
				</section>
			{/each}
		</div>
	{/if}
</section>
