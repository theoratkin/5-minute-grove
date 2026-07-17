<script lang="ts">
	let { paused = false }: { paused?: boolean } = $props();
</script>

<div class:paused class="sun"></div>

<style>
	.sun {
		position: absolute;
		top: 0.65rem;
		right: 1.2rem;
		z-index: 1;
		width: 1.15rem;
		height: 1.15rem;
		border-radius: 9999px;
		background: var(--color-sun);
		box-shadow: 0 0 1rem color-mix(in srgb, var(--color-sun) 70%, transparent);
		animation: glow 5s ease-in-out infinite;
	}

	.sun.paused { animation-play-state: paused; }

	@media (min-width: 640px) {
		.sun { right: 9rem; }
	}

	@keyframes glow {
		50% {
			transform: scale(1.08);
			box-shadow: 0 0 1.4rem color-mix(in srgb, var(--color-sun) 78%, transparent);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.sun { animation: none; }
	}
</style>
