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

<label class="grid gap-2">
	<span class="text-sm font-bold text-ink-muted">Name this sprint <span class="font-medium">(optional)</span></span>
	<input
		class="min-h-13 w-full rounded-2xl border border-moss/15 bg-surface px-4 py-3 text-ink outline-none transition placeholder:text-ink-muted/70 focus:border-moss focus:ring-4 focus:ring-sprout/60 disabled:bg-mist"
		{disabled}
		placeholder="What are you working on?"
		value={value}
		oninput={(event) => onchange?.(event.currentTarget.value)}
	/>
</label>
