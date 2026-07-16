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

<section class="grid h-full content-center justify-items-center p-5 text-center sm:p-6" aria-label="End of timer decision">
	<div class="max-w-md">
		<p class="mb-2 text-xs font-black tracking-[0.16em] text-moss uppercase">Complete</p>
		<h2 class="font-display text-3xl leading-none font-semibold tracking-[-0.04em] text-moss-dark">Five minutes counts.</h2>
		<p class="mt-3 leading-relaxed text-ink-muted">
			{intention || 'This session'} has {completedContracts === 1 ? 'one finished block' : `${completedContracts} finished blocks`}
				{extensionCount > 0 ? ` and ${extensionCount} voluntary ${extensionCount === 1 ? 'extension' : 'extensions'}` : ''}.
		</p>
	</div>
</section>
