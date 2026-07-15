<script lang="ts">
	let {
		value = '',
		disabled = false,
		onchange
	}: {
		value?: string;
		disabled?: boolean;
		onchange?: (value: string) => void;
	} = $props();
</script>

<label class="block">
	<span class="sr-only">Session name (optional)</span>
	<input
		class="w-full border-b border-transparent bg-transparent px-1 py-1 text-center text-base font-medium text-ink-muted outline-none transition placeholder:text-ink-muted/70 hover:border-moss/15 focus:border-moss/40 focus:text-ink focus:ring-0 disabled:cursor-not-allowed disabled:text-ink-muted"
		{disabled}
		placeholder="Name this session (optional)"
		value={value}
		oninput={(event) => onchange?.(event.currentTarget.value)}
	/>
</label>
