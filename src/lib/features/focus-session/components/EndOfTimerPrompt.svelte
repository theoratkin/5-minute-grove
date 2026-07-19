<script lang="ts">
	import GroveMug from './grove-vignette/GroveMug.svelte';
</script>

<section class="grid h-full content-center justify-items-center p-5 text-center sm:p-6" aria-label="End of timer decision">
	<div class="max-w-md">
		<p class="mb-2 text-sm font-semibold text-moss">Your time is complete</p>
		<h2 class="font-display text-3xl leading-none font-semibold tracking-[-0.04em] text-moss-dark">Stay a little longer?</h2>
		<p class="mt-3 leading-relaxed text-ink-muted">Continue if you’d like, or finish here.</p>
	</div>
	<div class="completion-mug">
		<GroveMug />
	</div>
</section>

<style>
	.completion-mug {
		position: relative;
		width: 2.9rem;
		height: 2.15rem;
		margin-top: 1.75rem;
	}
</style>
