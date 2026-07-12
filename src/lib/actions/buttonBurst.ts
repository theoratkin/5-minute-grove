import type { Action } from 'svelte/action';

type ButtonBurstOptions = {
	pieces?: number;
	colors?: string[];
};

const DEFAULT_COLORS = ['#b8bb26', '#d79921', '#83a598', '#fabd2f', '#fb4934'];

export const buttonBurst: Action<HTMLElement, ButtonBurstOptions | undefined> = (
	node,
	options = {}
) => {
	let config = normalizeOptions(options);
	const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
	const originalPosition = node.style.position;
	const originalOverflow = node.style.overflow;

	if (window.getComputedStyle(node).position === 'static') {
		node.style.position = 'relative';
	}

	node.style.overflow = 'visible';

	function runPulse() {
		node.animate(
			[
				{ transform: 'scale(1)' },
				{ transform: 'scale(0.985)' },
				{ transform: 'scale(1)' }
			],
			{ duration: 180, easing: 'ease-out' }
		);
	}

	function runBurst(event: MouseEvent) {
		if (reducedMotion.matches) {
			runPulse();
			return;
		}

		const rect = node.getBoundingClientRect();
		const originX = event.clientX > 0 ? event.clientX - rect.left : rect.width / 2;
		const originY = event.clientY > 0 ? event.clientY - rect.top : rect.height / 2;

		runPulse();

		for (let index = 0; index < config.pieces; index += 1) {
			const piece = document.createElement('span');
			const size = 5 + Math.random() * 5;
			const travelX = (Math.random() - 0.5) * Math.min(rect.width, 260);
			const travelY = -(28 + Math.random() * 62);
			const driftY = 16 + Math.random() * 22;
			const rotation = (Math.random() - 0.5) * 520;
			const duration = 520 + Math.random() * 180;

			piece.setAttribute('aria-hidden', 'true');
			piece.style.position = 'fixed';
			piece.style.left = `${rect.left + originX}px`;
			piece.style.top = `${rect.top + originY}px`;
			piece.style.width = `${size}px`;
			piece.style.height = `${size * (Math.random() > 0.5 ? 1 : 0.48)}px`;
			piece.style.borderRadius = Math.random() > 0.55 ? '999px' : '2px';
			piece.style.background = config.colors[index % config.colors.length];
			piece.style.pointerEvents = 'none';
			piece.style.zIndex = '20';
			piece.style.transform = 'translate(-50%, -50%)';

			document.body.appendChild(piece);

			const animation = piece.animate(
				[
					{
						opacity: 1,
						transform: 'translate(-50%, -50%) translate(0, 0) rotate(0deg) scale(1)'
					},
					{
						opacity: 1,
						offset: 0.58,
						transform: `translate(-50%, -50%) translate(${travelX}px, ${travelY}px) rotate(${rotation * 0.72}deg) scale(1)`
					},
					{
						opacity: 0,
						transform: `translate(-50%, -50%) translate(${travelX * 1.08}px, ${travelY + driftY}px) rotate(${rotation}deg) scale(0.72)`
					}
				],
				{ duration, easing: 'cubic-bezier(0.16, 1, 0.3, 1)' }
			);

			void animation.finished
				.catch(() => {
					// The animation can be cancelled if the button leaves the DOM.
				})
				.finally(() => piece.remove());
		}
	}

	node.addEventListener('click', runBurst);

	return {
		update(nextOptions = {}) {
			config = normalizeOptions(nextOptions);
		},
		destroy() {
			node.removeEventListener('click', runBurst);
			node.style.position = originalPosition;
			node.style.overflow = originalOverflow;
		}
	};
};

function normalizeOptions(options: ButtonBurstOptions) {
	return {
		pieces: options.pieces ?? 18,
		colors: options.colors?.length ? options.colors : DEFAULT_COLORS
	};
}
