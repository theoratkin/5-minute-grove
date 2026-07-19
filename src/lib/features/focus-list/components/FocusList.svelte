<script lang="ts">
	import { formatMinutes, formatTime } from '$lib/app/time';
	import type { FocusSessionRecord } from '$lib/features/focus-session/focusSession.types';
	import type { FocusTask } from '../focusTask.types';

	let {
		tasks,
		records,
		currentSession = null,
		activeTaskId = null,
		onadd,
		onstart,
		ontoggle,
		onresume,
		ondelete
	}: {
		tasks: FocusTask[];
		records: FocusSessionRecord[];
		currentSession?: FocusSessionRecord | null;
		activeTaskId?: string | null;
		onadd: (title: string) => void;
		onstart: (task: FocusTask) => void;
		ontoggle: (id: string) => void;
		onresume: (record: FocusSessionRecord) => void;
		ondelete: (id: string) => void;
	} = $props();

	let draft = $state('');
	let openTasks = $derived(tasks.filter((task) => !task.completedAt));
	let completedTasks = $derived(tasks.filter((task) => task.completedAt));

	function addTask(event: SubmitEvent) {
		event.preventDefault();
		if (!draft.trim()) return;
		onadd(draft);
		draft = '';
	}

	function taskSeconds(task: FocusTask) {
		return task.accumulatedSeconds +
			(task.id === activeTaskId ? (currentSession?.totalSeconds ?? 0) : 0);
	}
</script>

<section class="grid gap-4" aria-label="Focus list">
	<div class="flex items-center justify-between gap-4">
		<h2 class="font-display text-2xl font-semibold tracking-[-0.03em] text-moss-dark">Focus list</h2>
		<span class="min-w-8 rounded-full bg-sprout/65 px-2 py-0.5 text-center text-sm font-bold text-moss">{openTasks.length}</span>
	</div>

	<form class="flex gap-2" onsubmit={addTask}>
		<label class="min-w-0 flex-1">
			<span class="sr-only">Add a task</span>
			<input class="min-h-11 w-full rounded-xl border border-moss/15 bg-surface/70 px-3 text-sm font-semibold text-ink outline-none placeholder:text-ink-muted/70 focus:border-moss/40" maxlength="80" autocomplete="off" placeholder="Plan a small next step" bind:value={draft} />
		</label>
		<button class="grid size-11 shrink-0 place-items-center rounded-xl bg-moss text-on-accent transition hover:bg-moss-dark" type="submit" aria-label="Add task" title="Add task">
			<i class="ph-bold ph-plus" aria-hidden="true"></i>
		</button>
	</form>

	{#if openTasks.length === 0}
		<p class="rounded-[1.25rem_1.7rem_1.2rem_1.5rem] border border-dashed border-moss/20 bg-mist/50 p-4 text-sm leading-relaxed text-ink-muted">Nothing planned. Add one small thing, or begin directly from the timer.</p>
	{:else}
		<ul class="grid gap-2.5 p-0" aria-label="Open tasks">
			{#each openTasks as task (task.id)}
				<li class:active-task={task.id === activeTaskId} class="task-row grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 border border-moss/10 bg-surface/60 p-2.5">
					<button class="grid size-10 place-items-center rounded-xl text-moss transition hover:bg-sprout/40" type="button" onclick={() => ontoggle(task.id)} aria-label={`Mark ${task.title} done`} title="Mark task done">
						<i class="ph-bold ph-circle text-lg" aria-hidden="true"></i>
					</button>
					<button class="min-w-0 text-left" type="button" onclick={() => onstart(task)} aria-label={`Focus on ${task.title}`}>
						<strong class="block truncate text-sm text-ink">{task.title}</strong>
						<span class="mt-0.5 block text-xs font-semibold text-ink-muted">{formatMinutes(taskSeconds(task))} · {task.sessionCount} {task.sessionCount === 1 ? 'session' : 'sessions'}{task.id === activeTaskId && currentSession ? ' · in progress' : ''}</span>
					</button>
					<button class="grid size-10 place-items-center rounded-xl border border-moss/15 bg-paper/60 text-moss transition hover:bg-sprout/35" type="button" onclick={() => onstart(task)} aria-label={`Start ${task.title}`} title="Start task">
						<i class="ph-fill ph-play" aria-hidden="true"></i>
					</button>
				</li>
			{/each}
		</ul>
	{/if}

	{#if completedTasks.length > 0}
		<details class="group">
			<summary class="flex min-h-11 cursor-pointer list-none items-center justify-between rounded-xl px-2 text-sm font-bold text-ink-muted hover:bg-mist">
				<span>Done recently ({completedTasks.length})</span>
				<i class="ph-bold ph-caret-down transition group-open:rotate-180" aria-hidden="true"></i>
			</summary>
			<ul class="mt-2 grid gap-2 p-0">
				{#each completedTasks.slice(0, 12) as task (task.id)}
					<li class="flex items-center gap-2 rounded-xl bg-mist/45 p-2">
						<button class="grid size-10 shrink-0 place-items-center rounded-xl text-moss hover:bg-sprout/40" type="button" onclick={() => ontoggle(task.id)} aria-label={`Move ${task.title} back to open tasks`} title="Reopen task"><i class="ph-fill ph-check-circle text-lg" aria-hidden="true"></i></button>
						<div class="min-w-0"><span class="block truncate text-sm font-semibold text-ink-muted line-through">{task.title}</span><span class="text-xs text-ink-muted">{formatMinutes(task.accumulatedSeconds)} · {task.sessionCount} {task.sessionCount === 1 ? 'session' : 'sessions'}</span></div>
					</li>
				{/each}
			</ul>
		</details>
	{/if}

	{#if records.length > 0}
		<details class="group border-t border-moss/10 pt-2">
			<summary class="flex min-h-11 cursor-pointer list-none items-center justify-between rounded-xl px-2 text-sm font-bold text-ink-muted hover:bg-mist">
				<span>Session archive ({records.length})</span>
				<i class="ph-bold ph-caret-down transition group-open:rotate-180" aria-hidden="true"></i>
			</summary>
			<ul class="mt-2 grid gap-2 p-0">
				{#each records as record (record.id)}
					<li class="grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-1 rounded-xl bg-surface/45 p-2">
						<div class="min-w-0 px-1"><span class="block truncate text-sm font-semibold text-ink">{record.title}</span><span class="text-xs text-ink-muted">{formatTime(record.startedAt)} · {formatMinutes(record.totalSeconds)}</span></div>
						<button class="grid size-10 place-items-center rounded-xl text-moss hover:bg-sprout/35" type="button" onclick={() => onresume(record)} aria-label={`Start ${record.title} again`} title="Start again"><i class="ph-fill ph-play" aria-hidden="true"></i></button>
						<button class="grid size-10 place-items-center rounded-xl text-clay hover:bg-clay/10" type="button" onclick={() => ondelete(record.id)} aria-label={`Remove ${record.title} session`} title="Remove session"><i class="ph-fill ph-trash" aria-hidden="true"></i></button>
					</li>
				{/each}
			</ul>
		</details>
	{/if}
</section>

<style>
	.task-row { border-radius: 0.85rem 1.35rem 1rem 0.75rem; }
	.active-task { border-color: color-mix(in srgb, var(--color-moss) 30%, transparent); background: color-mix(in srgb, var(--color-sprout) 24%, var(--color-surface)); }
	summary::-webkit-details-marker { display: none; }
</style>
