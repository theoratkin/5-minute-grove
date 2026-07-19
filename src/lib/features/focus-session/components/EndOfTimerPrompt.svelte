<script lang="ts">
	import GroveMug from './grove-vignette/GroveMug.svelte';
	import * as m from '$lib/paraglide/messages.js';
</script>

<section class="grid h-full content-center justify-items-center p-5 text-center sm:p-6" aria-label={m.timer_end_decision()}>
	<div class="max-w-md">
		<p class="mb-2 text-sm font-semibold text-moss">{m.timer_status_complete()}</p>
		<h2 class="font-display text-3xl leading-none font-semibold tracking-[-0.04em] text-moss-dark">{m.timer_end_heading()}</h2>
		<p class="mt-3 leading-relaxed text-ink-muted">{m.timer_end_body()}</p>
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
