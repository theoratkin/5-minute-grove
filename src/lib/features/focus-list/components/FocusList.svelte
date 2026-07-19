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
	import { formatMinutes } from '$lib/app/time';
	import { UNTITLED_TASK_ID } from '../focusTask.state';
	import type { FocusTask } from '../focusTask.types';

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
		ondelete
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
	} = $props();

	let draft = $state('');
	let openMenuTaskId = $state<string | null>(null);
	let draggedTaskId = $state<string | null>(null);
	let consideredOpenTasks = $state<FocusTask[] | null>(null);
	let openTasks = $derived(consideredOpenTasks ?? tasks.filter((task) => !task.completedAt));
	let completedTasks = $derived(tasks.filter((task) => task.completedAt));
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

	function constrainTitle(event: Event) {
		const element = event.currentTarget as HTMLElement;
		const current = element.textContent ?? '';
		const constrained = current.replace(/[\r\n]+/g, ' ').slice(0, 80);
		if (constrained === current) return;
		element.textContent = constrained;
		const selection = window.getSelection();
		selection?.selectAllChildren(element);
		selection?.collapseToEnd();
	}

	function commitTitle(event: FocusEvent, task: FocusTask) {
		const element = event.currentTarget as HTMLElement;
		const title = (element.textContent ?? '').replace(/\s+/g, ' ').trim().slice(0, 80);
		if (!title) {
			element.textContent = task.title;
			return;
		}
		element.textContent = title;
		if (title !== task.title) onrename(task.id, title);
	}

	function handleTitleKeydown(event: KeyboardEvent, task: FocusTask) {
		if (event.key === 'Enter') {
			event.preventDefault();
			(event.currentTarget as HTMLElement).blur();
		} else if (event.key === 'Escape') {
			event.preventDefault();
			const element = event.currentTarget as HTMLElement;
			element.textContent = task.title;
			element.blur();
		}
	}

	function handleDndConsider(event: CustomEvent<DndEvent<FocusTask>>) {
		consideredOpenTasks = event.detail.items;
		draggedTaskId = event.detail.info.id;
		openMenuTaskId = null;
	}

	function handleDndFinalize(event: CustomEvent<DndEvent<FocusTask>>) {
		consideredOpenTasks = event.detail.items;
		onreorder(event.detail.items.map((task) => task.id));
		consideredOpenTasks = null;
		if (
			event.detail.info.source === SOURCES.POINTER ||
			event.detail.info.trigger === TRIGGERS.DRAG_STOPPED
		) {
			draggedTaskId = null;
		}
	}

	function closeTransientControls() {
		openMenuTaskId = null;
	}

	function handleWindowClick(event: MouseEvent) {
		if (!(event.target as Element | null)?.closest('.task-menu-control')) closeTransientControls();
	}
</script>

<svelte:window onclick={handleWindowClick} onkeydown={(event) => event.key === 'Escape' && closeTransientControls()} />

<section class:drag-in-progress={draggedTaskId !== null} class="grid gap-4" aria-label="Focus list">
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
		<ul
			class="grid gap-2.5 p-0"
			aria-label="Open tasks. Drag a task by its handle to change its position."
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
					<button class="drag-handle absolute top-3.5 -left-5 z-10 grid h-8 w-7 place-items-center rounded-lg text-ink-muted hover:bg-mist hover:text-ink" type="button" use:dragHandle aria-label={`Drag ${task.title} to reorder`} title="Drag to reorder"><i class="ph-bold ph-dots-six-vertical" aria-hidden="true"></i></button>
					{#if task.id === UNTITLED_TASK_ID}
						<span class="grid size-10 place-items-center text-ink-muted" title="Shared untitled focus"><i class="ph-bold ph-inbox text-lg" aria-hidden="true"></i></span>
					{:else}
						<button class="grid size-10 place-items-center rounded-xl text-moss transition hover:bg-sprout/40" type="button" onclick={() => ontoggle(task.id)} aria-label={`Mark ${task.title} done`} title="Mark task done">
							<i class="ph-bold ph-square text-lg" aria-hidden="true"></i>
						</button>
					{/if}
					<div class="min-w-0 self-center">
						{#if task.id === UNTITLED_TASK_ID}
							<strong class="task-title block text-sm text-ink">{task.title}</strong>
						{:else}
							<div class="editable-title task-title rounded-md text-sm font-bold text-ink" contenteditable="plaintext-only" role="textbox" tabindex="0" aria-label={`Edit task title: ${task.title}`} spellcheck="true" oninput={constrainTitle} onblur={(event) => commitTitle(event, task)} onkeydown={(event) => handleTitleKeydown(event, task)}>{task.title}</div>
						{/if}
						<span class="mt-0.5 block text-xs font-semibold text-ink-muted">{formatMinutes(taskSeconds(task))} focused{task.id === activeTaskId && currentSession ? ' · now' : ''}</span>
					</div>
					{#if task.id === activeTaskId && currentSession}
						<span class="grid size-10 place-items-center text-moss" aria-label={`${task.title} is currently focused`} title="Current focus">
							<i class="ph-bold ph-timer text-xl" aria-hidden="true"></i>
						</span>
					{:else}
						<button class="grid size-10 place-items-center rounded-xl border border-moss/15 bg-paper/60 text-moss transition hover:bg-sprout/35" type="button" use:buttonSplash onclick={() => onstart(task)} aria-label={`Start ${task.title}`} title="Start task">
							<i class="ph-fill ph-play" aria-hidden="true"></i>
						</button>
					{/if}
					<div class="task-menu-control relative">
							<button class="grid size-10 place-items-center rounded-xl text-ink-muted transition hover:bg-mist hover:text-ink" type="button" onclick={() => openMenuTaskId = openMenuTaskId === task.id ? null : task.id} aria-label={`More actions for ${task.title}`} aria-expanded={openMenuTaskId === task.id} title="More task actions"><i class="ph-bold ph-dots-three-vertical text-lg" aria-hidden="true"></i></button>
							{#if openMenuTaskId === task.id}
								<div class="task-menu absolute top-[calc(100%+0.35rem)] right-0 z-30 grid w-44 gap-1 rounded-xl border border-moss/15 bg-paper p-1.5 shadow-[0_12px_32px_rgb(0_0_0/18%)]" role="menu">
									<button class="menu-action" type="button" onclick={() => { onmove(task.id, -1); openMenuTaskId = null; }} disabled={index === 0} role="menuitem"><i class="ph-bold ph-arrow-up" aria-hidden="true"></i>Move up</button>
									<button class="menu-action" type="button" onclick={() => { onmove(task.id, 1); openMenuTaskId = null; }} disabled={index === openTasks.length - 1} role="menuitem"><i class="ph-bold ph-arrow-down" aria-hidden="true"></i>Move down</button>
									{#if task.id !== UNTITLED_TASK_ID}
										<button class="menu-action menu-action-delete" type="button" onclick={() => { ondelete(task.id); openMenuTaskId = null; }} role="menuitem"><i class="ph-bold ph-trash" aria-hidden="true"></i>Delete</button>
									{/if}
								</div>
							{/if}
					</div>
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
					<li class="relative grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 rounded-xl bg-mist/45 p-2">
						<button class="grid size-10 shrink-0 place-items-center rounded-xl text-moss hover:bg-sprout/40" type="button" onclick={() => ontoggle(task.id)} aria-label={`Move ${task.title} back to open tasks`} title="Reopen task"><i class="ph-fill ph-check-square text-lg" aria-hidden="true"></i></button>
						<div class="min-w-0">
							<div class="editable-title task-title rounded-md text-sm font-bold text-ink-muted line-through" contenteditable="plaintext-only" role="textbox" tabindex="0" aria-label={`Edit completed task title: ${task.title}`} spellcheck="true" oninput={constrainTitle} onblur={(event) => commitTitle(event, task)} onkeydown={(event) => handleTitleKeydown(event, task)}>{task.title}</div>
							<span class="text-xs text-ink-muted">{formatMinutes(task.accumulatedSeconds)} focused</span>
						</div>
						<div class="task-menu-control relative">
								<button class="grid size-10 place-items-center rounded-xl text-ink-muted hover:bg-paper" type="button" onclick={() => openMenuTaskId = openMenuTaskId === task.id ? null : task.id} aria-label={`More actions for ${task.title}`} aria-expanded={openMenuTaskId === task.id}><i class="ph-bold ph-dots-three-vertical text-lg" aria-hidden="true"></i></button>
								{#if openMenuTaskId === task.id}
									<div class="task-menu absolute top-[calc(100%+0.35rem)] right-0 z-30 grid w-44 gap-1 rounded-xl border border-moss/15 bg-paper p-1.5 shadow-[0_12px_32px_rgb(0_0_0/18%)]" role="menu">
									<button class="menu-action menu-action-delete" type="button" onclick={() => { ondelete(task.id); openMenuTaskId = null; }} role="menuitem"><i class="ph-bold ph-trash" aria-hidden="true"></i>Delete</button>
								</div>
							{/if}
						</div>
					</li>
				{/each}
			</ul>
		</details>
	{/if}

</section>

<style>
	.task-row { border-radius: 0.85rem 1.35rem 1rem 0.75rem; }
	.active-task { border-color: color-mix(in srgb, var(--color-moss) 30%, transparent); background: color-mix(in srgb, var(--color-sprout) 24%, var(--color-surface)); }
	.task-title { overflow-wrap: anywhere; white-space: normal; line-height: 1.3; }
	.editable-title { cursor: text; padding: 0.15rem 0.2rem; margin: -0.15rem -0.2rem; }
	.editable-title:hover { background: color-mix(in srgb, var(--color-mist) 60%, transparent); }
	.editable-title:focus { background: var(--color-paper); box-shadow: 0 0 0 1px color-mix(in srgb, var(--color-moss) 34%, transparent); outline: none; }
	.drag-handle { cursor: grab; opacity: 0; transform: translateX(-0.15rem); touch-action: none; transition: color 120ms ease, background 120ms ease, opacity 120ms ease, transform 120ms ease; }
	.task-row:hover .drag-handle,
	.drag-handle:focus-visible { opacity: 1; transform: translateX(0); }
	.drag-handle:active { cursor: grabbing; }
	.dragging-task { opacity: 0.45; }
	.drag-in-progress .editable-title { pointer-events: none; }
	.menu-action { display: flex; min-height: 2.5rem; align-items: center; gap: 0.6rem; border-radius: 0.6rem; padding: 0.45rem 0.65rem; text-align: left; font-size: 0.875rem; font-weight: 700; color: var(--color-ink); }
	.menu-action:hover:not(:disabled) { background: var(--color-mist); }
	.menu-action:disabled { opacity: 0.4; }
	.menu-action-delete { color: var(--color-clay); }
	summary::-webkit-details-marker { display: none; }

	@media (pointer: coarse) {
		.drag-handle { opacity: 1; transform: translateX(0); }
	}
</style>
