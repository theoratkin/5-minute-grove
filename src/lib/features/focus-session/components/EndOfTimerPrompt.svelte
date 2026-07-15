<script lang="ts">
	let {
		intention,
		completedContracts,
		extensionCount
	}: {
		intention: string;
		completedContracts: number;
		extensionCount: number;
	} = $props();
</script>

<section class="completed-panel grid h-full content-center rounded-[1.25rem] border border-sprout p-5 sm:p-6" aria-label="End of timer decision">
	<div>
		<p class="mb-2 text-xs font-black tracking-[0.16em] text-moss uppercase">Complete</p>
		<h2 class="font-display text-3xl leading-none font-semibold tracking-[-0.04em] text-moss-dark">Five minutes counts.</h2>
		<p class="mt-3 leading-relaxed text-ink-muted">
			{intention || 'This sprint'} has {completedContracts === 1 ? 'one finished block' : `${completedContracts} finished blocks`}
			{extensionCount > 0 ? ` and ${extensionCount} voluntary extensions` : ''}.
		</p>
	</div>
</section>

<style>
	.completed-panel {
		background: linear-gradient(
			135deg,
			color-mix(in srgb, var(--color-sprout) 78%, transparent),
			color-mix(in srgb, var(--color-surface) 82%, transparent)
		);
	}
</style>
