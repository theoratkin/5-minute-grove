<script lang="ts">
	import { flip } from 'svelte/animate';
	import {
		dragHandle,
		dragHandleZone,
		SOURCES,
		TRIGGERS,
		type DndEvent
	} from 'svelte-dnd-action';
	import { buttonSplash } from '$lib/actions/buttonSplash';
	import { confettiBurst } from '$lib/actions/confettiBurst';
	import { formatMinutes } from '$lib/app/time';
	import { UNTITLED_TASK_ID } from '../focusTask.state';
	import type { FocusTask } from '../focusTask.types';
	import EditableTaskTitle from './EditableTaskTitle.svelte';
	import * as m from '$lib/paraglide/messages.js';

	let {
		tasks,
		currentSession = null,
		activeTaskId = null,
		onadd,
		onstart,
		ontoggle,
		onrename,
		onmove,
		onreorder,
		ondelete,
		onassignuntitled
	}: {
		tasks: FocusTask[];
		currentSession?: { totalSeconds: number } | null;
		activeTaskId?: string | null;
		onadd: (title: string) => void;
		onstart: (task: FocusTask) => void;
		ontoggle: (id: string) => void;
		onrename: (id: string, title: string) => void;
		onmove: (id: string, direction: -1 | 1) => void;
		onreorder: (orderedIds: string[]) => void;
		ondelete: (id: string) => void;
		onassignuntitled: (id: string) => void;
	} = $props();

	let draft = $state('');
	let openMenuTaskId = $state<string | null>(null);
	let draggedTaskId = $state<string | null>(null);
	let consideredOpenTasks = $state<FocusTask[] | null>(null);
	let openTasks = $derived(consideredOpenTasks ?? tasks.filter((task) => !task.completedAt));
	let completedTasks = $derived(tasks.filter((task) => task.completedAt));
	let untitledAssignmentTargets = $derived(
		tasks.filter((task) => !task.completedAt && task.id !== UNTITLED_TASK_ID)
	);
	const flipDurationMs = 150;

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

	function taskTitle(task: FocusTask) {
		return task.id === UNTITLED_TASK_ID ? m.focus_list_untitled() : task.title;
	}

	function handleDndConsider(event: CustomEvent<DndEvent<FocusTask>>) {
		consideredOpenTasks = pinUntitledTask(event.detail.items);
		draggedTaskId = event.detail.info.id;
		openMenuTaskId = null;
	}

	function handleDndFinalize(event: CustomEvent<DndEvent<FocusTask>>) {
		consideredOpenTasks = pinUntitledTask(event.detail.items);
		onreorder(consideredOpenTasks.map((task) => task.id));
		consideredOpenTasks = null;
		if (
			event.detail.info.source === SOURCES.POINTER ||
			event.detail.info.trigger === TRIGGERS.DRAG_STOPPED
		) {
			draggedTaskId = null;
		}
	}

	function pinUntitledTask(items: FocusTask[]) {
		const untitled = items.find((task) => task.id === UNTITLED_TASK_ID);
		return untitled
			? [untitled, ...items.filter((task) => task.id !== UNTITLED_TASK_ID)]
			: items;
	}

	function closeTransientControls() {
		openMenuTaskId = null;
	}

	function handleWindowClick(event: MouseEvent) {
		if (!(event.target as Element | null)?.closest('.task-menu-control')) closeTransientControls();
	}
</script>

<svelte:window onclick={handleWindowClick} onkeydown={(event) => event.key === 'Escape' && closeTransientControls()} />

<section class:drag-in-progress={draggedTaskId !== null} class="grid gap-4" aria-label={m.focus_list_label()}>
	<div class="flex items-center justify-between gap-4">
		<h2 class="font-display text-2xl font-semibold tracking-[-0.03em] text-moss-dark">{m.focus_list_heading()}</h2>
		<span class="min-w-8 rounded-full bg-sprout/65 px-2 py-0.5 text-center text-sm font-bold text-moss">{openTasks.length}</span>
	</div>

	<form class="flex gap-2" onsubmit={addTask}>
		<label class="min-w-0 flex-1">
			<span class="sr-only">{m.focus_list_add_label()}</span>
			<input class="min-h-11 w-full rounded-xl border border-moss/15 bg-surface/70 px-3 text-sm font-semibold text-ink outline-none placeholder:text-ink-muted/70 focus:border-moss/40" maxlength="80" autocomplete="off" placeholder={m.focus_list_placeholder()} bind:value={draft} />
		</label>
		<button class="grid size-11 shrink-0 place-items-center rounded-xl bg-moss text-on-accent transition hover:bg-moss-dark" type="submit" aria-label={m.focus_list_add_action()} title={m.focus_list_add_action()}>
			<i class="ph-bold ph-plus" aria-hidden="true"></i>
		</button>
	</form>

	{#if openTasks.length === 0}
		<p class="rounded-[1.25rem_1.7rem_1.2rem_1.5rem] border border-dashed border-moss/20 bg-mist/50 p-4 text-sm leading-relaxed text-ink-muted">{m.focus_list_empty()}</p>
	{:else}
		<ul
			class="grid gap-2.5 p-0"
			aria-label={m.focus_list_open_tasks_reorder()}
			use:dragHandleZone={{
				items: openTasks,
				flipDurationMs,
				delayTouchStart: true,
				dropTargetStyle: {}
			}}
			onconsider={handleDndConsider}
			onfinalize={handleDndFinalize}
		>
			{#each openTasks as task, index (task.id)}
				<li
					class:active-task={task.id === activeTaskId}
					class:dragging-task={draggedTaskId === task.id}
					class="task-row relative grid grid-cols-[auto_minmax(0,1fr)_auto_auto] items-center gap-2 border border-moss/10 bg-surface/60 p-2.5"
					animate:flip={{ duration: flipDurationMs }}
				>
					{#if task.id !== UNTITLED_TASK_ID}
						<button class="drag-handle absolute top-3.5 -left-5 z-10 grid h-8 w-7 place-items-center rounded-lg text-ink-muted hover:bg-mist hover:text-ink" type="button" use:dragHandle aria-label={m.focus_list_drag_task({ title: taskTitle(task) })} title={m.focus_list_drag_title()}><i class="ph-bold ph-dots-six-vertical" aria-hidden="true"></i></button>
					{/if}
					{#if task.id === UNTITLED_TASK_ID}
						<span class="grid size-10 place-items-center text-ink-muted" title={m.focus_list_shared_untitled()}><i class="ph-bold ph-inbox text-lg" aria-hidden="true"></i></span>
					{:else}
						<button class="grid size-10 place-items-center rounded-xl text-moss transition hover:bg-sprout/40" type="button" use:confettiBurst onclick={() => ontoggle(task.id)} aria-label={m.focus_list_mark_done({ title: task.title })} title={m.focus_list_mark_done_title()}>
							<i class="ph-bold ph-square text-lg" aria-hidden="true"></i>
						</button>
					{/if}
					<div class="min-w-0 self-center">
						<EditableTaskTitle title={taskTitle(task)} label={m.focus_list_edit_title({ title: taskTitle(task) })} onrename={(title) => onrename(task.id, title)} />
						<span class="mt-0.5 block text-xs font-semibold text-ink-muted">{m.focus_list_minutes_focused({ minutes: formatMinutes(taskSeconds(task)) })}{task.id === activeTaskId && currentSession ? m.focus_list_now() : ''}</span>
					</div>
					{#if task.id === activeTaskId && currentSession}
						<span class="grid size-10 place-items-center text-moss" aria-label={m.focus_list_currently_focused({ title: taskTitle(task) })} title={m.focus_list_current_focus()}>
							<i class="ph-bold ph-timer text-xl" aria-hidden="true"></i>
						</span>
					{:else}
						<button class="grid size-10 place-items-center rounded-xl border border-moss/15 bg-paper/60 text-moss transition hover:bg-sprout/35" type="button" use:buttonSplash onclick={() => onstart(task)} aria-label={m.focus_list_start({ title: taskTitle(task) })} title={m.focus_list_start_title()}>
							<i class="ph-fill ph-play" aria-hidden="true"></i>
						</button>
					{/if}
					{#if task.id !== UNTITLED_TASK_ID || untitledAssignmentTargets.length > 0}
						<div class="task-menu-control relative">
							<button class="grid size-10 place-items-center rounded-xl text-ink-muted transition hover:bg-mist hover:text-ink" type="button" onclick={() => openMenuTaskId = openMenuTaskId === task.id ? null : task.id} aria-label={task.id === UNTITLED_TASK_ID ? m.timer_assign_focus() : m.focus_list_more_actions({ title: taskTitle(task) })} aria-expanded={openMenuTaskId === task.id} title={task.id === UNTITLED_TASK_ID ? m.timer_assign_focus() : m.focus_list_more_actions_title()}><i class={`ph-bold ${task.id === UNTITLED_TASK_ID ? 'ph-swap' : 'ph-dots-three-vertical'} text-lg`} aria-hidden="true"></i></button>
							{#if openMenuTaskId === task.id}
								<div class="task-menu absolute top-[calc(100%+0.35rem)] right-0 z-30 grid w-44 gap-1 rounded-xl border border-moss/15 bg-paper p-1.5 shadow-[0_12px_32px_rgb(0_0_0/18%)]" role="menu">
									{#if task.id === UNTITLED_TASK_ID && untitledAssignmentTargets.length > 0}
										<p class="px-2 pb-0.5 pt-1 text-[0.6875rem] font-bold uppercase tracking-wide text-ink-muted">{m.timer_assign_focus()}</p>
										<div class="max-h-44 overflow-y-auto">
											{#each untitledAssignmentTargets as target (target.id)}
												<button class="menu-action w-full" type="button" onclick={() => { onassignuntitled(target.id); openMenuTaskId = null; }} role="menuitem"><i class="ph-bold ph-arrow-right" aria-hidden="true"></i><span class="truncate">{target.title}</span></button>
											{/each}
										</div>
									{/if}
									{#if task.id !== UNTITLED_TASK_ID}
										<button class="menu-action" type="button" onclick={() => { onmove(task.id, -1); openMenuTaskId = null; }} disabled={index === 0 || openTasks[index - 1]?.id === UNTITLED_TASK_ID} role="menuitem"><i class="ph-bold ph-arrow-up" aria-hidden="true"></i>{m.focus_list_move_up()}</button>
										<button class="menu-action" type="button" onclick={() => { onmove(task.id, 1); openMenuTaskId = null; }} disabled={index === openTasks.length - 1} role="menuitem"><i class="ph-bold ph-arrow-down" aria-hidden="true"></i>{m.focus_list_move_down()}</button>
										<button class="menu-action menu-action-delete" type="button" onclick={() => { ondelete(task.id); openMenuTaskId = null; }} role="menuitem"><i class="ph-bold ph-trash" aria-hidden="true"></i>{m.focus_list_delete()}</button>
									{/if}
								</div>
							{/if}
						</div>
					{/if}
				</li>
			{/each}
		</ul>
	{/if}

	{#if completedTasks.length > 0}
		<details class="group">
			<summary class="flex min-h-11 cursor-pointer list-none items-center justify-between rounded-xl px-2 text-sm font-bold text-ink-muted hover:bg-mist">
				<span>{m.focus_list_done_recently({ count: completedTasks.length })}</span>
				<i class="ph-bold ph-caret-down transition group-open:rotate-180" aria-hidden="true"></i>
			</summary>
			<ul class="mt-2 grid gap-2 p-0">
				{#each completedTasks.slice(0, 12) as task (task.id)}
					<li class="relative grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 rounded-xl bg-mist/45 p-2">
						<button class="grid size-10 shrink-0 place-items-center rounded-xl text-moss hover:bg-sprout/40" type="button" onclick={() => ontoggle(task.id)} aria-label={m.focus_list_reopen({ title: task.title })} title={m.focus_list_reopen_title()}><i class="ph-fill ph-check-square text-lg" aria-hidden="true"></i></button>
						<div class="min-w-0">
							<EditableTaskTitle title={task.title} label={m.focus_list_edit_completed({ title: task.title })} completed onrename={(title) => onrename(task.id, title)} />
							<span class="text-xs text-ink-muted">{m.focus_list_minutes_focused({ minutes: formatMinutes(task.accumulatedSeconds) })}</span>
						</div>
						<button class="grid size-10 place-items-center rounded-xl text-clay transition hover:bg-clay/10" type="button" onclick={() => ondelete(task.id)} aria-label={m.focus_list_delete()} title={m.focus_list_delete()}><i class="ph-bold ph-trash text-lg" aria-hidden="true"></i></button>
					</li>
				{/each}
			</ul>
		</details>
	{/if}

</section>

<style>
	.task-row { border-radius: 0.85rem 1.35rem 1rem 0.75rem; }
	.active-task { border-color: color-mix(in srgb, var(--color-moss) 30%, transparent); background: color-mix(in srgb, var(--color-sprout) 24%, var(--color-surface)); }
	.drag-handle { cursor: grab; opacity: 0; transform: translateX(-0.15rem); touch-action: none; transition: color 120ms ease, background 120ms ease, opacity 120ms ease, transform 120ms ease; }
	.task-row:hover .drag-handle,
	.drag-handle:focus-visible { opacity: 1; transform: translateX(0); }
	.drag-handle:active { cursor: grabbing; }
	.dragging-task { opacity: 0.45; }
	.drag-in-progress :global(.editable-title) { pointer-events: none; }
	.menu-action { display: flex; min-height: 2.5rem; align-items: center; gap: 0.6rem; border-radius: 0.6rem; padding: 0.45rem 0.65rem; text-align: left; font-size: 0.875rem; font-weight: 700; color: var(--color-ink); }
	.menu-action:hover:not(:disabled) { background: var(--color-mist); }
	.menu-action:disabled { opacity: 0.4; }
	.menu-action-delete { color: var(--color-clay); }
	summary::-webkit-details-marker { display: none; }

	@media (pointer: coarse) {
		.drag-handle { opacity: 1; transform: translateX(0); }
	}
</style>
