<script lang="ts">
	import * as m from '$lib/paraglide/messages.js';

	let {
		value = '',
		disabled = false,
		clearable = true,
		onchange
	}: {
		value?: string;
		disabled?: boolean;
		clearable?: boolean;
		onchange?: (value: string) => void;
	} = $props();

	let input: HTMLInputElement;

	function clearInput() {
		onchange?.('');
		input.focus();
	}
</script>

<div class="relative">
	<label class="sr-only" for="task-name">{m.task_name_optional()}</label>
	<input
		bind:this={input}
		id="task-name"
		data-task-name
		class="w-full border-b border-transparent bg-transparent px-9 py-1 text-center text-base font-medium text-ink-muted outline-none transition placeholder:text-ink-muted/70 hover:border-moss/15 focus:border-moss/40 focus:text-ink focus:ring-0 disabled:cursor-not-allowed disabled:text-ink-muted"
		{disabled}
		maxlength="80"
		autocomplete="off"
		placeholder={m.task_placeholder()}
		value={value}
		oninput={(event) => onchange?.(event.currentTarget.value)}
	/>
	{#if value && !disabled && clearable}
		<button
			class="absolute right-1 top-1/2 grid size-7 -translate-y-1/2 place-items-center rounded-full text-ink-muted transition hover:bg-mist hover:text-ink focus-visible:text-ink"
			type="button"
			aria-label={m.task_clear()}
			title={m.task_clear()}
			onclick={clearInput}
		>
			<i class="ph-bold ph-x text-sm" aria-hidden="true"></i>
		</button>
	{/if}
</div>
