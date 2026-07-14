<script lang="ts">
	import { buttonSplash } from '$lib/actions/buttonSplash';

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


<section class="grid gap-5 rounded-[1.5rem] border border-sprout bg-[linear-gradient(135deg,#f4f8e9,#fffdf5)] p-5 sm:p-6" aria-label="End of timer decision">
	<div>
		<p class="mb-2 text-xs font-black tracking-[0.16em] text-moss uppercase">Complete</p>
		<h2 class="font-display text-3xl leading-none font-semibold tracking-[-0.04em] text-moss-dark">Five minutes counts.</h2>
		<p class="mt-3 leading-relaxed text-ink-muted">
			{intention || 'This start'} has {completedContracts === 1 ? 'one finished block' : `${completedContracts} finished blocks`}
			{extensionCount > 0 ? ` and ${extensionCount} voluntary extensions` : ''}.
		</p>
	</div>

	<div class="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
		<button class="col-span-2 min-h-13 rounded-2xl bg-moss px-4 font-extrabold text-white shadow-[0_5px_0_#204536] transition hover:-translate-y-0.5 hover:bg-moss-dark sm:col-span-1" type="button" use:buttonSplash onclick={onAddFive}>Add 5 minutes</button>
		<button class="min-h-13 rounded-2xl border border-moss/15 bg-white px-3 text-sm font-extrabold text-moss transition hover:bg-mist" type="button" onclick={onDone}>Done</button>
		<button class="min-h-13 rounded-2xl border border-moss/15 bg-white px-3 text-sm font-bold text-ink-muted transition hover:bg-mist" type="button" onclick={onBreak}>Break</button>
		<button class="min-h-13 rounded-2xl border border-moss/15 bg-white px-3 text-sm font-bold text-ink-muted transition hover:bg-mist" type="button" onclick={onSwitchTask}>Switch task</button>
	</div>
</section>
