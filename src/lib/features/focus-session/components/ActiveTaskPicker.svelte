<script lang="ts">
	import { onMount, tick } from 'svelte';
	import { UNTITLED_TASK_ID } from '$lib/features/focus-list/focusTask.state';
	import type { FocusTask } from '$lib/features/focus-list/focusTask.types';
	import * as m from '$lib/paraglide/messages.js';

	let {
		tasks,
		activeTaskId,
		onassign,
		onrename,
		oncreate
	}: {
		tasks: FocusTask[];
		activeTaskId: string;
		onassign: (id: string) => void;
		onrename: (id: string, title: string) => void;
		oncreate: (title: string) => void;
	} = $props();

	let trigger = $state<HTMLButtonElement>();
	let panel = $state<HTMLDivElement>();
	let renameInput = $state<HTMLInputElement>();
	let newTaskInput = $state<HTMLInputElement>();
	let open = $state(false);
	let mode = $state<'choose' | 'rename' | 'create'>('choose');
	let draft = $state('');
	let activeTask = $derived(tasks.find((task) => task.id === activeTaskId));
	let activeTitle = $derived(
		activeTask?.id === UNTITLED_TASK_ID ? m.focus_list_untitled() : (activeTask?.title ?? m.focus_list_untitled())
	);
	let otherTasks = $derived(tasks.filter((task) => !task.completedAt && task.id !== activeTaskId));

	function prepareToggle() {
		if (open) return;
		mode = 'choose';
		draft = '';
	}

	function positionPanel() {
		if (!trigger || !panel || !open) return;

		const triggerRect = trigger.getBoundingClientRect();
		const edgeGap = 16;
		const gap = 8;
		const width = Math.min(304, window.innerWidth - edgeGap * 2);
		const left = Math.min(
			window.innerWidth - width - edgeGap,
			Math.max(edgeGap, triggerRect.left + triggerRect.width / 2 - width / 2)
		);
		const spaceBelow = window.innerHeight - triggerRect.bottom - gap - edgeGap;
		const top =
			panel.offsetHeight > spaceBelow && triggerRect.top > panel.offsetHeight + gap + edgeGap
				? triggerRect.top - panel.offsetHeight - gap
				: triggerRect.bottom + gap;

		panel.style.left = `${left}px`;
		panel.style.top = `${top}px`;
		panel.style.width = `${width}px`;
	}

	function handleToggle(event: Event) {
		open = (event as Event & { newState: string }).newState === 'open';
		if (open) void tick().then(positionPanel);
	}

	function close() {
		panel?.hidePopover();
	}

	async function beginRename() {
		if (!activeTask || activeTask.id === UNTITLED_TASK_ID) return;
		mode = 'rename';
		draft = activeTask.title;
		await tick();
		positionPanel();
		renameInput?.select();
	}

	async function beginCreate() {
		mode = 'create';
		draft = '';
		await tick();
		positionPanel();
		newTaskInput?.focus();
	}

	function rename(event: SubmitEvent) {
		event.preventDefault();
		const title = draft.trim();
		if (!title || !activeTask || activeTask.id === UNTITLED_TASK_ID) return;
		onrename(activeTask.id, title);
		close();
	}

	function create(event: SubmitEvent) {
		event.preventDefault();
		const title = draft.trim();
		if (!title) return;
		oncreate(title);
		close();
	}

	function assign(id: string) {
		onassign(id);
		close();
	}

	onMount(() => {
		window.addEventListener('resize', positionPanel);
		window.addEventListener('scroll', positionPanel, true);
		return () => {
			window.removeEventListener('resize', positionPanel);
			window.removeEventListener('scroll', positionPanel, true);
		};
	});
</script>

<div class="mx-auto w-fit max-w-full">
	<button
		bind:this={trigger}
		data-task-picker-trigger
		class="flex min-h-9 max-w-full items-center gap-2 rounded-full border border-moss/15 bg-paper/85 px-3 py-1.5 text-sm text-moss transition hover:border-moss/30 hover:bg-mist"
		type="button"
		popovertarget="active-task-picker-panel"
		onclick={prepareToggle}
		aria-expanded={open}
		aria-haspopup="dialog"
		aria-label={m.timer_change_task({ title: activeTitle })}
	>
		<i class="ph-fill ph-leaf shrink-0 text-xs" aria-hidden="true"></i>
		<span class="shrink-0 text-xs font-semibold text-ink-muted">{m.timer_working_on()}</span>
		<strong class="truncate">{activeTitle}</strong>
		<i class={`ph-bold ${open ? 'ph-caret-up' : 'ph-caret-down'} shrink-0 text-xs`} aria-hidden="true"></i>
	</button>

	<div bind:this={panel} id="active-task-picker-panel" class="task-picker-panel rounded-2xl border border-moss/15 bg-paper p-2 text-left shadow-xl" popover="auto" ontoggle={handleToggle} role="dialog" aria-label={m.timer_change_task({ title: activeTitle })}>
			{#if mode === 'rename'}
				<form class="flex gap-2 p-1" onsubmit={rename}>
					<label class="sr-only" for="active-task-rename">{m.timer_rename_task()}</label>
					<input bind:this={renameInput} bind:value={draft} id="active-task-rename" class="min-w-0 flex-1 rounded-xl border border-moss/20 bg-surface px-3 py-2 text-sm font-semibold text-ink outline-none focus:border-moss/50" maxlength="80" autocomplete="off" />
					<button class="grid size-10 shrink-0 place-items-center rounded-xl bg-moss text-on-accent hover:bg-moss-dark" type="submit" aria-label={m.timer_save_task_name()}><i class="ph-bold ph-check" aria-hidden="true"></i></button>
				</form>
			{:else if mode === 'create'}
				<form class="flex gap-2 p-1" onsubmit={create}>
					<label class="sr-only" for="active-task-create">{m.focus_list_add_label()}</label>
					<input bind:this={newTaskInput} bind:value={draft} id="active-task-create" class="min-w-0 flex-1 rounded-xl border border-moss/20 bg-surface px-3 py-2 text-sm font-semibold text-ink outline-none placeholder:text-ink-muted focus:border-moss/50" maxlength="80" autocomplete="off" placeholder={m.focus_list_placeholder()} />
					<button class="grid size-10 shrink-0 place-items-center rounded-xl bg-moss text-on-accent hover:bg-moss-dark" type="submit" aria-label={m.focus_list_add_action()}><i class="ph-bold ph-plus" aria-hidden="true"></i></button>
				</form>
			{:else}
				{#if activeTask?.id !== UNTITLED_TASK_ID}
					<button class="task-picker-action" type="button" onclick={beginRename}><i class="ph-bold ph-pencil-simple" aria-hidden="true"></i><span>{m.timer_rename_task()}</span></button>
				{/if}
				<button class="task-picker-action" type="button" onclick={beginCreate}><i class="ph-bold ph-plus" aria-hidden="true"></i><span>{m.focus_list_add_action()}</span></button>

				{#if otherTasks.length > 0}
					<div class="mx-2 my-2 border-t border-moss/10"></div>
					<p class="px-3 pb-1 pt-0.5 text-[0.6875rem] font-bold uppercase tracking-wide text-ink-muted">{m.timer_switch_task()}</p>
					<div class="max-h-44 overflow-y-auto">
						{#each otherTasks as task (task.id)}
							<button class="task-picker-action" type="button" onclick={() => assign(task.id)}><i class="ph-bold ph-arrow-right" aria-hidden="true"></i><span class="truncate">{task.id === UNTITLED_TASK_ID ? m.focus_list_untitled() : task.title}</span></button>
						{/each}
					</div>
				{/if}
			{/if}
	</div>
</div>

<style>
	.task-picker-panel { position: fixed; inset: unset; margin: 0; max-height: calc(100vh - 2rem); overflow-y: auto; box-shadow: 0 16px 45px color-mix(in srgb, var(--color-ink) 14%, transparent); }
	.task-picker-action { display: flex; min-height: 2.5rem; width: 100%; align-items: center; gap: 0.65rem; border-radius: 0.75rem; padding: 0.5rem 0.75rem; color: var(--color-ink); font-size: 0.875rem; font-weight: 700; transition: background 150ms, color 150ms; }
	.task-picker-action:hover, .task-picker-action:focus-visible { background: var(--color-mist); color: var(--color-moss); outline: none; }
</style>
