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

<label class="field">
	<span>What are you starting?</span>
	<input
		{disabled}
		placeholder="One tiny visible next step"
		value={value}
		oninput={(event) => onchange?.(event.currentTarget.value)}
	/>
</label>

<style>
	.field {
		display: grid;
		gap: 0.55rem;
	}

	span {
		color: var(--ink-soft);
		font-size: 0.88rem;
		font-weight: 700;
	}

	input {
		width: 100%;
		min-height: 3.1rem;
		border: 1px solid var(--line);
		border-radius: 8px;
		background: var(--surface-raised);
		color: var(--ink);
		padding: 0.85rem 0.95rem;
		outline: none;
	}

	input::placeholder {
		color: #928374;
	}

	input:focus {
		border-color: var(--green);
		box-shadow: 0 0 0 3px rgba(184, 187, 38, 0.18);
	}
</style>
