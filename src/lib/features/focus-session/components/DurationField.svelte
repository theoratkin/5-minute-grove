<script lang="ts">
	import { normalizeStartDuration } from '../focusSession.utils';

	let {
		seconds,
		onchange,
		onsubmit
	}: {
		seconds: number;
		onchange: (seconds: number) => void;
		onsubmit: () => void;
	} = $props();

	let minutesInput: HTMLInputElement;
	let secondsInput: HTMLInputElement;
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
		onchange(duration);
		return duration;
	}

	function finishEditing(event: FocusEvent) {
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
		if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
			event.preventDefault();
			step(segment, event.key === 'ArrowUp' ? 1 : -1);
		} else if (event.key === 'ArrowLeft' && segment === 'seconds') {
			event.preventDefault();
			minutesInput.focus();
			minutesInput.select();
		} else if (event.key === 'ArrowRight' && segment === 'minutes') {
			event.preventDefault();
			secondsInput.focus();
			secondsInput.select();
		} else if (event.key === 'Enter') {
			event.preventDefault();
			commit();
			onsubmit();
		}
	}
</script>

<div
	class="duration-field"
	role="group"
	aria-label="Timer duration in minutes and seconds"
	onfocusin={() => (editing = true)}
	onfocusout={finishEditing}
>
	<label class="sr-only" for="timer-minutes">Minutes</label>
	<input
		bind:this={minutesInput}
		id="timer-minutes"
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
	<span class="duration-separator" aria-hidden="true">:</span>
	<label class="sr-only" for="timer-seconds">Seconds</label>
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
		min-width: 0;
		border-radius: 0.18em;
		background: transparent;
		color: inherit;
		text-align: center;
		outline: none;
		transition: background 150ms, box-shadow 150ms;
	}

	.duration-minutes { width: 2.1ch; }
	.duration-minutes:has(+ *) { field-sizing: content; min-width: 2.1ch; max-width: 3.1ch; }
	.duration-seconds { width: 2.1ch; }

	.duration-segment:hover {
		background: color-mix(in srgb, var(--color-mist) 60%, transparent);
	}

	.duration-segment:focus {
		background: color-mix(in srgb, var(--color-sprout) 42%, transparent);
		box-shadow: 0 0 0 0.035em var(--color-moss);
	}

	.duration-separator { padding-inline: 0.025em 0.08em; }
</style>
