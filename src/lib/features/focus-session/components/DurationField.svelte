<script lang="ts">
	import { normalizeStartDuration } from '../focusSession.utils';
	import * as m from '$lib/paraglide/messages.js';

	let {
		seconds,
		onchange,
		onsubmit,
		editable = true
	}: {
		seconds: number;
		onchange?: (seconds: number) => void;
		onsubmit?: () => void;
		editable?: boolean;
	} = $props();

	let minutesInput = $state<HTMLInputElement>();
	let secondsInput = $state<HTMLInputElement>();
	let minutesText = $state('05');
	let secondsText = $state('00');
	let editing = $state(false);

	$effect(() => {
		if (editing) return;
		minutesText = String(Math.floor(seconds / 60)).padStart(2, '0');
		secondsText = String(seconds % 60).padStart(2, '0');
	});

	function numeric(value: string, maximum: number) {
		const digits = value.replace(/\D/g, '');
		return digits === '' ? 0 : Math.min(maximum, Number(digits));
	}

	function commit() {
		const duration = normalizeStartDuration(
			numeric(minutesText, 999) * 60 + numeric(secondsText, 59)
		);
		onchange?.(duration);
		return duration;
	}

	function finishEditing(event: FocusEvent) {
		if (!editable) return;
		const next = event.relatedTarget;
		if (next instanceof Node && event.currentTarget instanceof Node && event.currentTarget.contains(next)) {
			return;
		}

		editing = false;
		const duration = commit();
		minutesText = String(Math.floor(duration / 60)).padStart(2, '0');
		secondsText = String(duration % 60).padStart(2, '0');
	}

	function updateMinutes(event: Event) {
		minutesText = (event.currentTarget as HTMLInputElement).value.replace(/\D/g, '').slice(0, 3);
		commit();
	}

	function updateSeconds(event: Event) {
		const input = event.currentTarget as HTMLInputElement;
		const digits = input.value.replace(/\D/g, '').slice(0, 2);
		secondsText = digits === '' ? '' : String(Math.min(59, Number(digits)));
		commit();
	}

	function step(segment: 'minutes' | 'seconds', amount: number) {
		if (segment === 'minutes') {
			minutesText = String(Math.max(0, Math.min(999, numeric(minutesText, 999) + amount))).padStart(2, '0');
		} else {
			secondsText = String((numeric(secondsText, 59) + amount + 60) % 60).padStart(2, '0');
		}
		commit();
	}

	function handleKeydown(event: KeyboardEvent, segment: 'minutes' | 'seconds') {
		if (!editable) return;
		if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
			event.preventDefault();
			step(segment, event.key === 'ArrowUp' ? 1 : -1);
		} else if (event.key === 'ArrowLeft' && segment === 'seconds') {
			event.preventDefault();
			minutesInput?.focus();
			minutesInput?.select();
		} else if (event.key === 'ArrowRight' && segment === 'minutes') {
			event.preventDefault();
			secondsInput?.focus();
			secondsInput?.select();
		} else if (event.key === 'Enter') {
			event.preventDefault();
			commit();
			onsubmit?.();
		}
	}
</script>

<div
	class="duration-field"
	class:duration-field-editable={editable}
	role={editable ? 'group' : 'timer'}
	aria-label={editable ? m.duration_editable_label() : m.duration_remaining({ time: `${minutesText}:${secondsText}` })}
	onfocusin={() => editable && (editing = true)}
	onfocusout={finishEditing}
>
	{#if editable}
		<label class="sr-only" for="timer-minutes">{m.duration_minutes()}</label>
		<input
			bind:this={minutesInput}
			id="timer-minutes"
			class:duration-wide={minutesText.length > 2}
			class="duration-segment duration-minutes"
			type="text"
			inputmode="numeric"
			pattern="[0-9]*"
			maxlength="3"
			value={minutesText}
			onfocus={(event) => event.currentTarget.select()}
			oninput={updateMinutes}
			onkeydown={(event) => handleKeydown(event, 'minutes')}
			aria-valuemin="0"
			aria-valuemax="999"
			aria-valuenow={numeric(minutesText, 999)}
			role="spinbutton"
		/>
	{:else}
		<span class:duration-wide={minutesText.length > 2} class="duration-segment duration-minutes" aria-hidden="true">{minutesText}</span>
	{/if}
	<span class="duration-separator" aria-hidden="true">:</span>
	{#if editable}
		<label class="sr-only" for="timer-seconds">{m.duration_seconds()}</label>
		<input
			bind:this={secondsInput}
			id="timer-seconds"
			class="duration-segment duration-seconds"
			type="text"
			inputmode="numeric"
			pattern="[0-9]*"
			maxlength="2"
			tabindex="-1"
			value={secondsText}
			onfocus={(event) => event.currentTarget.select()}
			oninput={updateSeconds}
			onkeydown={(event) => handleKeydown(event, 'seconds')}
			aria-valuemin="0"
			aria-valuemax="59"
			aria-valuenow={numeric(secondsText, 59)}
			role="spinbutton"
		/>
	{:else}
		<span class="duration-segment duration-seconds" aria-hidden="true">{secondsText}</span>
	{/if}
</div>

<style>
	.duration-field {
		display: flex;
		align-items: center;
		justify-content: center;
		font-family: var(--font-timer);
		font-size: clamp(4.5rem, 18vw, 8rem);
		font-weight: 700;
		font-variant-numeric: tabular-nums lining-nums;
		font-feature-settings: 'tnum' 1, 'lnum' 1;
		letter-spacing: -0.035em;
		line-height: 1;
	}

	.duration-segment {
		box-sizing: content-box;
		min-width: 0;
		margin: 0;
		border: 0;
		border-radius: 0.18em;
		padding: 0;
		background: transparent;
		color: inherit;
		font: inherit;
		font-variant-numeric: inherit;
		letter-spacing: inherit;
		line-height: inherit;
		text-align: center;
		outline: none;
		appearance: none;
		transition: background 150ms, box-shadow 150ms;
	}

	.duration-minutes { width: 2ch; }
	.duration-seconds { width: 2ch; }
	.duration-wide { width: 3ch; }

	.duration-field-editable .duration-segment:hover {
		background: color-mix(in srgb, var(--color-mist) 60%, transparent);
	}

	.duration-field-editable .duration-segment:focus {
		background: color-mix(in srgb, var(--color-sprout) 42%, transparent);
		box-shadow: 0 0 0 0.035em var(--color-moss);
	}

	.duration-separator { padding: 0; }
</style>
