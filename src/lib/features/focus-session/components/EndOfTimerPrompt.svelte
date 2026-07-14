<script lang="ts">
	import { buttonSplash } from '$lib/actions/buttonSplash';

	let {
		intention,
		completedContracts,
		extensionCount,
		onAddFive,
		onDone
	}: {
		intention: string;
		completedContracts: number;
		extensionCount: number;
		onAddFive: () => void;
		onDone: () => void;
	} = $props();
</script>


<section class="grid gap-5 rounded-[1.5rem] border border-sprout bg-[linear-gradient(135deg,var(--color-sprout),var(--color-surface))] p-5 sm:p-6" aria-label="End of timer decision">
	<div>
		<p class="mb-2 text-xs font-black tracking-[0.16em] text-moss uppercase">Complete</p>
		<h2 class="font-display text-3xl leading-none font-semibold tracking-[-0.04em] text-moss-dark">Five minutes counts.</h2>
		<p class="mt-3 leading-relaxed text-ink-muted">
			{intention || 'This sprint'} has {completedContracts === 1 ? 'one finished block' : `${completedContracts} finished blocks`}
			{extensionCount > 0 ? ` and ${extensionCount} voluntary extensions` : ''}.
		</p>
	</div>

	<div class="flex gap-2.5">
		<button class="min-h-13 min-w-0 flex-1 rounded-2xl bg-moss px-4 font-extrabold text-on-accent shadow-[0_5px_0_var(--color-moss-pressed)] transition hover:-translate-y-0.5 hover:bg-moss-dark hover:shadow-[0_5px_0_var(--color-moss-hover-pressed)]" type="button" use:buttonSplash onclick={onAddFive}>Add 5 minutes</button>
		<button class="min-h-13 shrink-0 rounded-2xl border border-moss/15 bg-surface px-5 text-sm font-extrabold text-moss transition hover:bg-mist" type="button" onclick={onDone}>Done</button>
	</div>
</section>
