import type { Action } from 'svelte/action';

const PARTICLE_COUNT = 10;
const COLORS = [
	'var(--color-sun)',
	'var(--color-clay)',
	'var(--color-moss)',
	'var(--color-sprout)'
];

export const confettiBurst: Action<HTMLElement> = (node) => {
	const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

	function burst(event: MouseEvent) {
		if (reducedMotion.matches) return;

		const rect = node.getBoundingClientRect();
		const originX = event.clientX > 0 ? event.clientX : rect.left + rect.width / 2;
		const originY = event.clientY > 0 ? event.clientY : rect.top + rect.height / 2;

		for (let index = 0; index < PARTICLE_COUNT; index += 1) {
			const particle = document.createElement('span');
			const angle = (Math.PI * 2 * index) / PARTICLE_COUNT - Math.PI / 2;
			const distance = 42 + Math.random() * 30;
			const x = Math.cos(angle) * distance;
			const y = Math.sin(angle) * distance + 22;
			const lift = Math.min(y - 24, -18 - Math.random() * 18);
			const rotation = -160 + Math.random() * 320;

			particle.setAttribute('aria-hidden', 'true');
			particle.style.position = 'fixed';
			particle.style.left = `${originX}px`;
			particle.style.top = `${originY}px`;
			particle.style.width = `${4 + Math.random() * 3}px`;
			particle.style.height = `${6 + Math.random() * 4}px`;
			particle.style.borderRadius = '2px';
			particle.style.background = COLORS[index % COLORS.length];
			particle.style.pointerEvents = 'none';
			particle.style.zIndex = '60';
			particle.style.willChange = 'transform, opacity';
			document.body.appendChild(particle);

			const animation = particle.animate(
				[
					{ opacity: 0, transform: 'translate(-50%, -50%) scale(0.4) rotate(0deg)' },
					{
						opacity: 0.95,
						offset: 0.18,
						transform: `translate(calc(-50% + ${x * 0.45}px), calc(-50% + ${lift}px)) scale(1) rotate(${rotation * 0.45}deg)`
					},
					{
						opacity: 0,
						transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px)) scale(0.8) rotate(${rotation}deg)`
					}
				],
				{ duration: 620 + Math.random() * 180, easing: 'cubic-bezier(0.2, 0.7, 0.3, 1)' }
			);

			void animation.finished
				.catch(() => {
					// The animation can be cancelled during navigation.
				})
				.finally(() => particle.remove());
		}
	}

	node.addEventListener('click', burst);

	return {
		destroy() {
			node.removeEventListener('click', burst);
		}
	};
};
