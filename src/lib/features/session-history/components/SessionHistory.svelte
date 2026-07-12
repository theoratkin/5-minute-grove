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

<section class="history" aria-label="Recent sessions">
	<div class="heading">
		<h2>Recent starts</h2>
		<span>{records.length}</span>
	</div>

	{#if records.length === 0}
		<p class="empty">No starts logged yet.</p>
	{:else}
		<ul>
			{#each records as record (record.id)}
				<li>
					<div>
						<strong>{record.intention}</strong>
						<span>{formatShortDateTime(record.startedAt)} · {reasonLabel(record.reason)}</span>
					</div>
					<div class="metrics">
						<span>{formatMinutes(record.totalSeconds)}</span>
						<span>{record.extensionCount} +5</span>
					</div>
				</li>
			{/each}
		</ul>
	{/if}
</section>

<style>
	.history {
		display: grid;
		gap: 0.85rem;
	}

	.heading {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
	}

	h2,
	.empty,
	ul {
		margin: 0;
	}

	h2 {
		font-size: 1rem;
	}

	.heading span {
		min-width: 2rem;
		border-radius: 999px;
		background: var(--surface-muted);
		padding: 0.18rem 0.55rem;
		text-align: center;
		color: var(--ink-soft);
		font-weight: 800;
	}

	.empty {
		color: var(--ink-soft);
	}

	ul {
		display: grid;
		gap: 0.6rem;
		padding: 0;
		list-style: none;
	}

	li {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.8rem;
		border: 1px solid var(--line);
		border-radius: 8px;
		background: var(--surface-raised);
		padding: 0.8rem;
	}

	strong,
	li span {
		display: block;
	}

	strong {
		max-width: 22rem;
		overflow-wrap: anywhere;
	}

	li span {
		margin-top: 0.25rem;
		color: var(--ink-soft);
		font-size: 0.82rem;
		font-weight: 700;
	}

	.metrics {
		display: grid;
		justify-items: end;
		flex: 0 0 auto;
	}

	.metrics span:first-child {
		color: var(--blue);
		font-size: 0.96rem;
	}

	@media (max-width: 520px) {
		li {
			align-items: start;
			flex-direction: column;
		}

		.metrics {
			display: flex;
			justify-items: start;
			gap: 0.85rem;
		}
	}
</style>
