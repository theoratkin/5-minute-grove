<script lang="ts">
	import * as m from '$lib/paraglide/messages.js';

	let {
		open,
		ondismiss
	}: {
		open: boolean;
		ondismiss: () => void;
	} = $props();

	let dialog: HTMLDialogElement;

	$effect(() => {
		if (!dialog) return;

		if (open && !dialog.open) dialog.showModal();
		if (!open && dialog.open) dialog.close();
	});

	function handleClose() {
		if (open) ondismiss();
	}

	function handleBackdropClick(event: MouseEvent) {
		if (event.target === dialog) ondismiss();
	}
</script>

<dialog
	bind:this={dialog}
	class="m-auto w-[min(32rem,calc(100%-2rem))] overflow-visible rounded-[2rem_1.5rem_1.85rem_1.35rem] border border-surface/90 bg-paper p-0 text-ink shadow-[0_28px_90px_rgb(0_0_0/30%)] backdrop:bg-ink/45 backdrop:backdrop-blur-[2px]"
	aria-labelledby="introduction-title"
	onclose={handleClose}
	onclick={handleBackdropClick}
>
	<div class="relative grid gap-6 p-6 sm:p-8">
		<button
			class="absolute top-4 right-4 grid size-11 place-items-center rounded-xl text-ink-muted transition hover:bg-mist hover:text-moss"
			type="button"
			aria-label={m.intro_close()}
			onclick={ondismiss}
		>
			<i class="ph-bold ph-x text-lg" aria-hidden="true"></i>
		</button>

		<div class="pr-10">
			<p class="mb-2 text-sm font-bold text-moss">{m.intro_welcome()}</p>
			<h2 id="introduction-title" class="font-display text-3xl leading-tight font-semibold tracking-[-0.035em] text-moss-dark sm:text-4xl">
				{m.intro_heading()}
			</h2>
		</div>

		<div class="grid gap-4 text-sm leading-relaxed text-ink-muted sm:text-base">
			<p>
				{m.intro_paragraph_1()}
			</p>
			<p>
				{m.intro_paragraph_2()}
			</p>
		</div>

		<button
			class="min-h-12 rounded-xl bg-moss px-5 font-extrabold text-on-accent transition hover:bg-moss-dark"
			type="button"
			onclick={ondismiss}
		>
			{m.about_start_focus()}
		</button>
	</div>
</dialog>
