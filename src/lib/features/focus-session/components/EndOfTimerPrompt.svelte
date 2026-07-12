<script lang="ts">
	let {
		intention,
		completedContracts,
		extensionCount,
		onAddFive,
		onDone,
		onBreak,
		onSwitchTask
	}: {
		intention: string;
		completedContracts: number;
		extensionCount: number;
		onAddFive: () => void;
		onDone: () => void;
		onBreak: () => void;
		onSwitchTask: () => void;
	} = $props();
</script>

<section class="prompt" aria-label="End of timer decision">
	<div>
		<p class="eyebrow">Complete</p>
		<h2>Five minutes counts.</h2>
		<p class="summary">
			{intention || 'This start'} has {completedContracts === 1 ? 'one finished block' : `${completedContracts} finished blocks`}
			{extensionCount > 0 ? ` and ${extensionCount} voluntary extensions` : ''}.
		</p>
	</div>

	<div class="actions">
		<button class="primary" type="button" onclick={onAddFive}>Add 5 minutes</button>
		<button type="button" onclick={onDone}>Done</button>
		<button type="button" onclick={onBreak}>Break</button>
		<button type="button" onclick={onSwitchTask}>Switch task</button>
	</div>
</section>

<style>
	.prompt {
		display: grid;
		gap: 1rem;
		border: 1px solid rgba(47, 125, 95, 0.25);
		border-radius: 8px;
		background: rgba(47, 125, 95, 0.08);
		padding: 1rem;
	}

	.eyebrow {
		margin: 0 0 0.25rem;
		color: var(--green-dark);
		font-size: 0.8rem;
		font-weight: 800;
		text-transform: uppercase;
	}

	h2,
	.summary {
		margin: 0;
	}

	h2 {
		font-size: 1.35rem;
		line-height: 1.15;
	}

	.summary {
		margin-top: 0.45rem;
		color: var(--ink-soft);
		line-height: 1.45;
	}

	.actions {
		display: grid;
		grid-template-columns: repeat(4, minmax(0, 1fr));
		gap: 0.6rem;
	}

	button {
		min-height: 2.85rem;
		border: 1px solid var(--line);
		border-radius: 8px;
		background: #fff;
		color: var(--ink);
		font-weight: 800;
	}

	.primary {
		border-color: var(--green);
		background: var(--green);
		color: #fff;
	}

	button:hover {
		transform: translateY(-1px);
	}

	@media (max-width: 760px) {
		.actions {
			grid-template-columns: 1fr 1fr;
		}
	}
</style>
