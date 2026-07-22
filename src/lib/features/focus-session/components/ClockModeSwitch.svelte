<script lang="ts">
	import type { FocusClockMode } from '../focusSession.types';
	import * as m from '$lib/paraglide/messages.js';

	let {
		mode,
		onchange
	}: {
		mode: FocusClockMode;
		onchange: (mode: FocusClockMode) => void;
	} = $props();
</script>

<div class="clock-mode-switch" role="group" aria-label={m.timer_mode_label()}>
	<button
		class:active={mode === 'countdown'}
		type="button"
		aria-pressed={mode === 'countdown'}
		onclick={() => onchange('countdown')}
	>
		{m.timer_mode_countdown()}
	</button>
	<button
		class:active={mode === 'count-up'}
		type="button"
		aria-pressed={mode === 'count-up'}
		onclick={() => onchange('count-up')}
	>
		{m.timer_mode_count_up()}
	</button>
</div>

<style>
	.clock-mode-switch {
		display: inline-flex;
		flex-shrink: 0;
		border: 1px solid color-mix(in srgb, var(--color-moss) 14%, transparent);
		border-radius: 9999px;
		padding: 0.15rem;
		background: color-mix(in srgb, var(--color-mist) 65%, transparent);
	}

	button {
		min-height: 1.8rem;
		border-radius: 9999px;
		padding: 0.25rem 0.55rem;
		color: var(--color-ink-muted);
		font-size: 0.6875rem;
		font-weight: 800;
		line-height: 1;
		transition: color 150ms, background 150ms, box-shadow 150ms;
	}

	button.active {
		color: var(--color-moss-dark);
		background: var(--color-surface);
		box-shadow: 0 1px 0.35rem color-mix(in srgb, var(--color-ink) 9%, transparent);
	}

	button:focus-visible {
		outline: 2px solid color-mix(in srgb, var(--color-moss) 45%, transparent);
		outline-offset: 1px;
	}
</style>
