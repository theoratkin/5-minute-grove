<script lang="ts">
	let {
		progress,
		extensionCount,
		paused = false
	}: { progress: number; extensionCount: number; paused?: boolean } = $props();

	let light = $derived(Math.max(0, Math.min(100, progress)));
	let visibleLeaves = $derived(Math.min(6, 2 + extensionCount));
</script>

<div
	class:paused
	class="vignette"
	style={`--light-opacity: ${0.45 + light * 0.004}; --growth: ${Math.min(extensionCount, 4)}`}
	aria-hidden="true"
>
	<div class="window">
		<div class="sky"></div>
		<div class="sun"></div>
		<div class="window-cross window-cross-horizontal"></div>
		<div class="window-cross window-cross-vertical"></div>
	</div>

	<div class="plant">
		<div class="stem"></div>
		{#each Array(6) as _, index}
			<span class:visible={index < visibleLeaves} class:leaf-left={index % 2 === 0} class="leaf" style={`bottom: ${2 + index * 0.42}rem`}></span>
		{/each}
		<div class="pot-rim"></div>
		<div class="pot"></div>
	</div>

	<div class="mug">
		<span class="steam steam-one"></span>
		<span class="steam steam-two"></span>
		<span class="handle"></span>
	</div>
	<div class="sill"></div>
</div>

<style>
	.vignette {
		position: relative;
		height: 6.75rem;
		overflow: hidden;
		border: 1px solid color-mix(in srgb, var(--color-moss) 12%, transparent);
		border-radius: 1.3rem 2.4rem 1.15rem 2rem;
		background:
			radial-gradient(circle at 78% 28%, color-mix(in srgb, var(--color-sun) 18%, transparent), transparent 24%),
			linear-gradient(165deg, color-mix(in srgb, var(--color-sprout) 20%, var(--color-surface)), var(--color-surface));
		box-shadow: inset 0 -1rem 2rem color-mix(in srgb, var(--color-moss) 5%, transparent);
	}

	.window {
		position: absolute;
		top: 0.85rem;
		left: 1.25rem;
		width: 7.2rem;
		height: 4.55rem;
		overflow: hidden;
		border: 0.32rem solid color-mix(in srgb, var(--color-paper) 85%, var(--color-moss));
		border-radius: 2.25rem 2.25rem 0.65rem 0.65rem;
		box-shadow: 0 0.35rem 0.8rem color-mix(in srgb, var(--color-ink) 9%, transparent);
	}

	.sky {
		position: absolute;
		inset: 0;
		background: linear-gradient(155deg, color-mix(in srgb, var(--color-sun) 40%, var(--color-surface)), color-mix(in srgb, var(--color-sprout) 45%, var(--color-surface)));
		opacity: var(--light-opacity);
		transition: opacity 1s ease;
	}

	.sun {
		position: absolute;
		top: 0.65rem;
		right: 0.85rem;
		width: 1.15rem;
		height: 1.15rem;
		border-radius: 9999px;
		background: var(--color-sun);
		box-shadow: 0 0 1rem color-mix(in srgb, var(--color-sun) 70%, transparent);
		animation: glow 5s ease-in-out infinite;
	}

	.window-cross { position: absolute; z-index: 2; background: color-mix(in srgb, var(--color-paper) 85%, var(--color-moss)); }
	.window-cross-horizontal { top: 48%; right: 0; left: 0; height: 0.22rem; }
	.window-cross-vertical { top: 0; bottom: 0; left: 50%; width: 0.22rem; }

	.sill {
		position: absolute;
		right: 0.8rem;
		bottom: 0.55rem;
		left: 0.8rem;
		height: 0.55rem;
		border-radius: 9999px 9999px 0.4rem 0.4rem;
		background: color-mix(in srgb, var(--color-moss) 32%, var(--color-paper));
		box-shadow: 0 0.35rem 0.5rem color-mix(in srgb, var(--color-ink) 10%, transparent);
	}

	.plant { position: absolute; right: 4.25rem; bottom: 0.95rem; width: 3.5rem; height: 5.2rem; z-index: 2; }
	.stem { position: absolute; right: 1.7rem; bottom: 1.45rem; width: 0.16rem; height: 2.8rem; border-radius: 1rem; background: var(--color-moss); }
	.pot-rim { position: absolute; right: 0.5rem; bottom: 1rem; width: 2.45rem; height: 0.55rem; border-radius: 0.35rem; background: color-mix(in srgb, var(--color-clay) 82%, var(--color-paper)); }
	.pot { position: absolute; right: 0.72rem; bottom: 0; width: 2rem; height: 1.2rem; border-radius: 0.15rem 0.15rem 0.75rem 0.75rem; background: var(--color-clay); }

	.leaf {
		position: absolute;
		right: 0.85rem;
		width: 1rem;
		height: 0.62rem;
		border-radius: 100% 0 100% 0;
		background: var(--color-moss);
		opacity: 0;
		transform: rotate(18deg) scale(0.25);
		transform-origin: bottom left;
		transition: opacity 700ms ease, transform 700ms cubic-bezier(0.2, 0.8, 0.2, 1);
	}

	.leaf-left { right: 1.72rem; border-radius: 0 100% 0 100%; transform: rotate(-18deg) scale(0.25); transform-origin: bottom right; }
	.leaf.visible { opacity: 0.9; transform: rotate(18deg) scale(1); }
	.leaf-left.visible { transform: rotate(-18deg) scale(1); }

	.mug { position: absolute; right: 1.35rem; bottom: 1.05rem; z-index: 3; width: 2.25rem; height: 1.75rem; border-radius: 0.35rem 0.35rem 0.8rem 0.8rem; background: color-mix(in srgb, var(--color-sun) 68%, var(--color-paper)); }
	.handle { position: absolute; top: 0.3rem; right: -0.65rem; width: 0.9rem; height: 0.95rem; border: 0.25rem solid color-mix(in srgb, var(--color-sun) 68%, var(--color-paper)); border-left: 0; border-radius: 0 0.65rem 0.65rem 0; }
	.steam { position: absolute; bottom: 1.8rem; width: 0.45rem; height: 1.35rem; border-left: 0.12rem solid color-mix(in srgb, var(--color-ink-muted) 42%, transparent); border-radius: 50%; animation: steam 4.2s ease-in-out infinite; }
	.steam-one { left: 0.65rem; }
	.steam-two { left: 1.3rem; animation-delay: -2.1s; }

	.paused .steam, .paused .sun { animation-play-state: paused; }

	@keyframes steam {
		0%, 100% { transform: translate3d(0, 0.2rem, 0) rotate(-5deg); opacity: 0; }
		35% { opacity: 0.55; }
		75% { opacity: 0.18; }
		100% { transform: translate3d(0.22rem, -0.5rem, 0) rotate(8deg); }
	}

	@keyframes glow { 50% { transform: scale(1.08); box-shadow: 0 0 1.4rem color-mix(in srgb, var(--color-sun) 78%, transparent); } }

	@media (prefers-reduced-motion: reduce) {
		.sun, .steam { animation: none; }
		.steam { opacity: 0.25; }
	}
</style>
