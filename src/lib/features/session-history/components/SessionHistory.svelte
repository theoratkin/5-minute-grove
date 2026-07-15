<script lang="ts">
	import { onDestroy, tick } from 'svelte';
	import { buttonSplash } from '$lib/actions/buttonSplash';
	import { formatMinutes, formatTime } from '$lib/app/time';
	import type { FocusSessionRecord } from '$lib/features/focus-session/focusSession.types';

	let {
		records,
		currentSession = null,
		onresume,
		deleteSession,
		updateSessionTitle
	}: {
		records: FocusSessionRecord[];
		currentSession?: FocusSessionRecord | null;
		onresume: (record: FocusSessionRecord) => void;
		deleteSession: (id: string) => void;
		updateSessionTitle: (id: string, title: string) => void;
	} = $props();

	let resumingId = $state<string | null>(null);
	let editingId = $state<string | null>(null);
	let titleDraft = $state('');
	let titleInput = $state<HTMLInputElement | undefined>();
	let resumeTimeout: ReturnType<typeof setTimeout> | undefined;

	function resumeWithCommitment(record: FocusSessionRecord) {
		if (resumingId !== null) return;

		resumingId = record.id;
		resumeTimeout = setTimeout(() => {
			resumingId = null;
			onresume(record);
		}, 420);
	}

	async function startEditing(record: FocusSessionRecord) {
		if (resumingId !== null) return;

		editingId = record.id;
		titleDraft = record.title;
		await tick();
		titleInput?.focus();
		titleInput?.select();
	}

	function saveTitle(record: FocusSessionRecord) {
		if (editingId !== record.id) return;

		const title = titleDraft.trim() || 'Session';
		if (title !== record.title) updateSessionTitle(record.id, title);
		editingId = null;
	}

	function cancelEditing() {
		editingId = null;
		titleDraft = '';
	}

	onDestroy(() => {
		if (resumeTimeout) clearTimeout(resumeTimeout);
	});

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
							<div class="min-w-0">
								{#if editingId === currentSession.id}
									<input
										class="session-title-input max-w-48"
										aria-label="Session name"
										bind:this={titleInput}
										bind:value={titleDraft}
										onblur={() => saveTitle(currentSession)}
										onkeydown={(event) => {
											if (event.key === 'Enter') event.currentTarget.blur();
											if (event.key === 'Escape') cancelEditing();
										}}
									/>
								{:else}
									<button class="session-title max-w-48" type="button" aria-label={`Edit name: ${currentSession.title}`} title="Edit session name" onclick={() => startEditing(currentSession)}>{currentSession.title}</button>
								{/if}
							</div>
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
							<li class:resuming-session={resumingId === record.id} class="relative grid gap-3 overflow-hidden rounded-2xl border border-moss/10 bg-surface/75 p-3">
								{#if resumingId === record.id}
									<div class="resume-commit-glow" aria-hidden="true"></div>
								{/if}
								<div class="relative z-10 flex items-start justify-between gap-3">
									<div class="grid min-w-0 gap-1">
										{#if editingId === record.id}
											<input
												class="session-title-input max-w-48"
												aria-label="Session name"
												bind:this={titleInput}
												bind:value={titleDraft}
												onblur={() => saveTitle(record)}
												onkeydown={(event) => {
													if (event.key === 'Enter') event.currentTarget.blur();
													if (event.key === 'Escape') cancelEditing();
												}}
											/>
										{:else}
											<button class="session-title max-w-48" type="button" aria-label={`Edit name: ${record.title}`} title="Edit session name" onclick={() => startEditing(record)}>{record.title}</button>
										{/if}
										<span class="text-xs font-bold text-ink-muted">{formatTime(record.startedAt)}</span>
									</div>
									<div class="grid flex-none justify-items-end">
										<span class="text-sm font-extrabold text-moss">{formatMinutes(record.totalSeconds)}</span>
										<span class="mt-1 text-xs font-bold text-ink-muted">{record.extensionCount} extensions</span>
									</div>
								</div>
								<div class="relative z-10 flex justify-end gap-2">
									<button class:resuming={resumingId === record.id} class="resume-button grid size-9 place-items-center rounded-xl bg-moss text-on-accent transition hover:bg-moss-dark" type="button" aria-label={resumingId === record.id ? `Resuming ${record.title}` : `Resume ${record.title}`} title="Resume session" use:buttonSplash onclick={() => resumeWithCommitment(record)} disabled={resumingId !== null}>
										<i class:resuming={resumingId === record.id} class="resume-icon ph-fill ph-play text-base" aria-hidden="true"></i>
									</button>
									<button class="grid size-9 place-items-center rounded-xl border border-clay/25 text-clay transition hover:bg-clay/10" type="button" aria-label={`Delete ${record.title}`} title="Delete session" onclick={() => deleteSession(record.id)}>
										<i class="ph-fill ph-trash text-base" aria-hidden="true"></i>
									</button>
								</div>
							</li>
						{/each}
					</ul>
	</section>

<style>
	.session-title,
	.session-title-input {
		display: block;
		width: 100%;
		min-width: 0;
		padding: 0;
		font-size: 0.875rem;
		font-weight: 800;
		line-height: 1.25rem;
		color: var(--color-ink);
		text-align: left;
		overflow-wrap: anywhere;
	}

	.session-title {
		cursor: text;
		border: 0;
		background: transparent;
	}

	.session-title:hover,
	.session-title:focus-visible {
		color: var(--color-moss);
		text-decoration: underline;
		text-decoration-thickness: 1px;
		text-underline-offset: 0.2em;
		outline: none;
	}

	.session-title-input {
		border: 0;
		border-bottom: 1px solid color-mix(in srgb, var(--color-moss) 55%, transparent);
		background: transparent;
		outline: none;
	}

	.resuming-session {
		animation: session-commit 420ms cubic-bezier(0.2, 0.8, 0.2, 1);
	}

	.resume-commit-glow {
		position: absolute;
		z-index: 0;
		right: 1.5rem;
		bottom: 1.25rem;
		width: 1.5rem;
		height: 1.5rem;
		border-radius: 9999px;
		background: color-mix(in srgb, var(--color-sprout) 78%, transparent);
		animation: resume-glow 420ms ease-out forwards;
	}

	.resume-button.resuming {
		pointer-events: none;
		animation: resume-press 420ms cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
	}

	.resume-icon.resuming {
		animation: resume-forward 420ms ease-out forwards;
	}

	@keyframes session-commit {
		0% { transform: scale(1); }
		35% { transform: scale(0.985); }
		100% { transform: scale(1); }
	}

	@keyframes resume-glow {
		0% { transform: scale(0); opacity: 0.72; }
		100% { transform: scale(13); opacity: 0; }
	}

	@keyframes resume-press {
		0% { transform: translateY(0); }
		28% { transform: translateY(0.2rem); }
		100% { transform: translateY(0); }
	}

	@keyframes resume-forward {
		35% { transform: translateX(0.14rem); }
		100% { transform: translateX(0); }
	}

	@media (prefers-reduced-motion: reduce) {
		.resuming-session,
		.resume-commit-glow,
		.resume-button.resuming,
		.resume-icon.resuming {
			animation: none;
		}
	}
</style>
			{/each}
		</div>
	{/if}
</section>
