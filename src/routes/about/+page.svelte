<script lang="ts">
	import * as m from '$lib/paraglide/messages.js';
	import { localizeHref } from '$lib/paraglide/runtime.js';
</script>

<svelte:head>
	<title>{m.about_meta_title()}</title>
	<meta
		name="description"
		content={m.about_meta_description()}
	/>
</svelte:head>

<article class="rounded-[2.4rem_1.8rem_2.15rem_1.65rem] border border-surface/80 bg-paper/90 p-7 shadow-[0_24px_70px_rgb(0_0_0/12%)] backdrop-blur sm:p-10">
	<p class="mb-3 text-sm font-bold text-moss">{m.about_eyebrow()}</p>
	<h1 class="font-display text-4xl leading-tight font-semibold tracking-[-0.045em] text-moss-dark sm:text-5xl">
		{m.about_heading()}
	</h1>

	<div class="mt-8 grid gap-5 text-base leading-relaxed text-ink-muted sm:text-lg">
		<p>
			{m.about_paragraph_1()}
		</p>
		<p>
			{m.about_paragraph_2()}
		</p>
		<p>
			{m.about_paragraph_3()}
		</p>
		<p>
			{m.about_paragraph_4()}
		</p>
		<p>
			{m.about_paragraph_5()}
		</p>
		<p class="rounded-2xl border border-moss/10 bg-mist/60 p-5 font-semibold text-ink">
			{m.about_paragraph_6()}
		</p>
	</div>

	<a class="mt-8 inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-moss px-5 font-extrabold text-on-accent transition hover:bg-moss-dark" href={localizeHref('/')}>
		<i class="ph-bold ph-arrow-left" aria-hidden="true"></i>
		{m.about_start_focus()}
	</a>

	<footer class="mt-8 border-t border-moss/10 pt-5">
		<section class="flex gap-2 text-xs leading-relaxed text-ink-muted" aria-labelledby="privacy-data-heading">
			<i class="ph-bold ph-lock-key mt-0.5 shrink-0 text-sm text-moss" aria-hidden="true"></i>
			<div>
				<h2 id="privacy-data-heading" class="font-extrabold text-ink-muted">
					{m.about_privacy_heading()}
				</h2>
				<p class="mt-0.5">{m.about_privacy_body()}</p>
			</div>
		</section>
	</footer>
</article>
