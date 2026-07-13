import type { Action } from 'svelte/action';

type ButtonSplashOptions = {
	ripples?: number;
	color?: string;
};

const DEFAULT_COLOR = 'rgba(250, 189, 47, 0.72)';
const DEFAULT_FILL = 'rgba(184, 187, 38, 0.1)';
const DEFAULT_GLOW = 'rgba(250, 189, 47, 0.2)';

export const buttonSplash: Action<HTMLElement, ButtonSplashOptions | undefined> = (
	node,
	options = {}
) => {
	let config = normalizeOptions(options);
	const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

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

	function runSplash(event: MouseEvent) {
		runPulse();

		if (reducedMotion.matches) return;

		const rect = node.getBoundingClientRect();
		const originX = event.clientX > 0 ? event.clientX : rect.left + rect.width / 2;
		const originY = event.clientY > 0 ? event.clientY : rect.top + rect.height / 2;
		const maxX = Math.max(originX, window.innerWidth - originX);
		const maxY = Math.max(originY, window.innerHeight - originY);
		const finalSize = Math.ceil(Math.hypot(maxX, maxY) * 2);

		for (let index = 0; index < config.ripples; index += 1) {
			const ripple = document.createElement('span');
			const delay = index * 85;
			const duration = 2400 + index * 140;
			const width = finalSize * (0.96 + Math.random() * 0.16);
			const height = finalSize * (0.82 + Math.random() * 0.2);
			const rotation = -18 + Math.random() * 36;
			const skewX = -5 + Math.random() * 10;
			const skewY = -3 + Math.random() * 6;
			const radius = createOrganicRadius();
			const initialTransform = createTransform(0.02, rotation, skewX, skewY);
			const middleTransform = createTransform(0.58, rotation + 7, skewX * 0.6, skewY * 0.6);
			const finalTransform = createTransform(1, rotation + 13, 0, 0);

			ripple.setAttribute('aria-hidden', 'true');
			ripple.style.position = 'fixed';
			ripple.style.left = `${originX}px`;
			ripple.style.top = `${originY}px`;
			ripple.style.width = `${width}px`;
			ripple.style.height = `${height}px`;
			ripple.style.border = `1.5px solid ${config.color}`;
			ripple.style.background = DEFAULT_FILL;
			ripple.style.borderRadius = radius;
			ripple.style.boxShadow = `0 0 34px ${DEFAULT_GLOW}, inset 0 0 28px rgba(184, 187, 38, 0.08)`;
			ripple.style.mixBlendMode = 'screen';
			ripple.style.pointerEvents = 'none';
			ripple.style.zIndex = '0';
			ripple.style.transform = initialTransform;
			ripple.style.willChange = 'transform, opacity, border-width, border-radius, background';

			document.body.appendChild(ripple);

			const animation = ripple.animate(
				[
					{
						opacity: 0.92,
						background: DEFAULT_FILL,
						borderRadius: radius,
						borderWidth: '18px',
						transform: initialTransform
					},
					{
						opacity: 0.52,
						background: 'rgba(184, 187, 38, 0.045)',
						borderRadius: createOrganicRadius(),
						borderWidth: '7px',
						offset: 0.52,
						transform: middleTransform
					},
					{
						opacity: 0,
						background: 'rgba(184, 187, 38, 0)',
						borderRadius: createOrganicRadius(),
						borderWidth: '0px',
						transform: finalTransform
					}
				],
				{
					delay,
					duration,
					easing: 'cubic-bezier(0.11, 0.72, 0.24, 1)'
				}
			);

			void animation.finished
				.catch(() => {
					// The animation can be cancelled if navigation or DOM updates remove the button.
				})
				.finally(() => ripple.remove());
		}
	}

	node.addEventListener('click', runSplash);

	return {
		update(nextOptions = {}) {
			config = normalizeOptions(nextOptions);
		},
		destroy() {
			node.removeEventListener('click', runSplash);
		}
	};
};

function createTransform(scale: number, rotation: number, skewX: number, skewY: number) {
	return `translate(-50%, -50%) rotate(${rotation}deg) skew(${skewX}deg, ${skewY}deg) scale(${scale})`;
}

function createOrganicRadius() {
	const horizontal = createRadiusStops();
	const vertical = createRadiusStops();

	return `${horizontal} / ${vertical}`;
}

function createRadiusStops() {
	return Array.from({ length: 4 }, () => `${42 + Math.round(Math.random() * 16)}%`).join(' ');
}

function normalizeOptions(options: ButtonSplashOptions) {
	return {
		ripples: Math.max(1, options.ripples ?? 3),
		color: options.color ?? DEFAULT_COLOR
	};
}
