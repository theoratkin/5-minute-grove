<script lang="ts">
	import { formatClock } from '$lib/app/time';
	import type { FocusPhase } from '$lib/features/focus-session/focusSession.types';

	let {
		remainingSeconds,
		phase,
		completedContracts,
		extensionCount
	}: {
		remainingSeconds: number;
		phase: FocusPhase;
		completedContracts: number;
		extensionCount: number;
	} = $props();

	let statusText = $derived.by(() => {
		if (phase === 'running') return 'Contract in progress';
		if (phase === 'contract-complete') return 'Contract complete';
		return 'Ready when you are';
	});

	let progress = $derived.by(() => {
		if (phase === 'contract-complete') return 100;
		return Math.round(((300 - remainingSeconds) / 300) * 100);
	});
</script>

<section class="timer" aria-label="Focus timer">
	<div class="status-row">
		<span>{statusText}</span>
		<span>{Math.max(0, progress)}%</span>
	</div>

	<div class="clock" aria-live="polite">{formatClock(remainingSeconds)}</div>

	<div class="meter" aria-hidden="true">
		<div style={`width: ${Math.max(0, Math.min(100, progress))}%`}></div>
	</div>

	<div class="stats" aria-label="Session progress">
		<div>
			<strong>{completedContracts}</strong>
			<span>complete</span>
		</div>
		<div>
			<strong>{extensionCount}</strong>
			<span>extensions</span>
		</div>
	</div>
</section>

<style>
	.timer {
		display: grid;
		gap: 1.25rem;
	}

	.status-row,
	.stats {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
	}

	.status-row {
		color: var(--ink-soft);
		font-size: 0.88rem;
		font-weight: 700;
	}

	.clock {
		min-height: 8rem;
		display: grid;
		place-items: center;
		border: 1px solid var(--line);
		border-radius: 8px;
		background: #fff;
		font-size: clamp(4.4rem, 18vw, 8.5rem);
		font-weight: 800;
		font-variant-numeric: tabular-nums;
		line-height: 1;
		letter-spacing: 0;
	}

	.meter {
		overflow: hidden;
		height: 0.75rem;
		border-radius: 999px;
		background: var(--surface-muted);
	}

	.meter div {
		height: 100%;
		border-radius: inherit;
		background: linear-gradient(90deg, var(--green), var(--amber));
		transition: width 180ms ease;
	}

	.stats > div {
		min-width: 8rem;
		border: 1px solid var(--line);
		border-radius: 8px;
		background: rgba(255, 255, 255, 0.58);
		padding: 0.8rem;
	}

	strong,
	.stats span {
		display: block;
	}

	strong {
		font-size: 1.45rem;
		line-height: 1;
	}

	.stats span {
		margin-top: 0.25rem;
		color: var(--ink-soft);
		font-size: 0.82rem;
		font-weight: 700;
	}
</style>
