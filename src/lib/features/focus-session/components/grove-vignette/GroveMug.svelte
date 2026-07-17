<script lang="ts">
	let { paused = false }: { paused?: boolean } = $props();
</script>

<div class="mug" aria-hidden="true">
	<span class:paused class="steam steam-one"></span>
	<span class:paused class="steam steam-two"></span>
	<span class="handle"></span>
</div>

<style>
	.mug {
		position: absolute;
		right: 1.35rem;
		bottom: 1.05rem;
		z-index: 7;
		width: 2.25rem;
		height: 1.75rem;
		border-radius: 0.35rem 0.35rem 0.8rem 0.8rem;
		background: color-mix(in srgb, var(--color-sun) 68%, var(--color-paper));
	}

	.handle {
		position: absolute;
		top: 0.3rem;
		right: -0.65rem;
		width: 0.9rem;
		height: 0.95rem;
		border: 0.25rem solid color-mix(in srgb, var(--color-sun) 68%, var(--color-paper));
		border-left: 0;
		border-radius: 0 0.65rem 0.65rem 0;
	}

	.steam {
		position: absolute;
		bottom: 1.8rem;
		width: 0.45rem;
		height: 1.35rem;
		border-left: 0.12rem solid color-mix(in srgb, var(--color-ink-muted) 42%, transparent);
		border-radius: 50%;
		animation: steam 4.2s ease-in-out infinite;
	}

	.steam-one { left: 0.65rem; }
	.steam-two { left: 1.3rem; animation-delay: -2.1s; }
	.steam.paused { animation-play-state: paused; }

	@keyframes steam {
		0%, 100% { transform: translate3d(0, 0.2rem, 0) rotate(-5deg); opacity: 0; }
		35% { opacity: 0.55; }
		75% { opacity: 0.18; }
		100% { transform: translate3d(0.22rem, -0.5rem, 0) rotate(8deg); }
	}

	@media (prefers-reduced-motion: reduce) {
		.steam { animation: none; opacity: 0.25; }
	}
</style>
