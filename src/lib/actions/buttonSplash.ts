import type { Action } from 'svelte/action';

type ButtonSplashOptions = {
	ripples?: number;
	color?: string;
};

const DEFAULT_COLOR = 'rgb(49 94 76 / 72%)';
const DEFAULT_FILL = 'rgb(49 94 76 / 12%)';
const DEFAULT_GLOW = 'rgb(49 94 76 / 24%)';

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
		if (reducedMotion.matches) return;
		runPulse();

		const rect = node.getBoundingClientRect();
		const originX = event.clientX > 0 ? event.clientX : rect.left + rect.width / 2;
		const originY = event.clientY > 0 ? event.clientY : rect.top + rect.height / 2;
		const maxX = Math.max(originX, window.innerWidth - originX);
		const maxY = Math.max(originY, window.innerHeight - originY);
		const finalSize = Math.ceil(Math.hypot(maxX, maxY) * 2);
		const styles = getComputedStyle(node);
		const color = config.color ?? (styles.getPropertyValue('--splash-color').trim() || DEFAULT_COLOR);
		const fill = styles.getPropertyValue('--splash-fill').trim() || DEFAULT_FILL;
		const glow = styles.getPropertyValue('--splash-glow').trim() || DEFAULT_GLOW;

		for (let index = 0; index < config.ripples; index += 1) {
			const ripple = document.createElement('span');
			const delay = index * 85;
			const duration = 2200 + index * 140;
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
			ripple.style.border = `10px solid ${color}`;
			ripple.style.background = fill;
			ripple.style.borderRadius = radius;
			ripple.style.boxShadow = `0 0 28px ${glow}, inset 0 0 22px ${fill}`;
			ripple.style.pointerEvents = 'none';
			ripple.style.zIndex = '0';
			ripple.style.transform = initialTransform;
			ripple.style.willChange = 'transform, opacity';

			const background = document.getElementById('button-splash-background') ?? document.body;
			background.appendChild(ripple);

			const animation = ripple.animate(
				[
					{
						opacity: 0.86,
						transform: initialTransform
					},
					{
						opacity: 0.38,
						offset: 0.52,
						transform: middleTransform
					},
					{
						opacity: 0,
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
		ripples: Math.max(1, options.ripples ?? 2),
		color: options.color
	};
}
