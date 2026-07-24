import type { Action } from 'svelte/action';

type ButtonSplashOptions = {
	ripples?: number;
	color?: string;
	durationMs?: number;
	simple?: boolean;
};

const DEFAULT_COLOR = 'rgb(49 94 76 / 72%)';
const DEFAULT_FILL = 'rgb(49 94 76 / 12%)';
const DEFAULT_GLOW = 'rgb(49 94 76 / 24%)';
// Canvas gives the compositor a fixed bitmap to scale. A styled DOM element can
// be re-rasterized near its largest animated size even when its CSS box is small.
const MAX_TEXTURE_WIDTH = 320;
const MAX_RASTER_SCALE = 2;

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
		const background = document.getElementById('button-splash-background') ?? document.body;

		for (let index = 0; index < config.ripples; index += 1) {
			const delay = index * 85;
			const duration = config.durationMs + index * 140;
			const width = finalSize * (0.96 + Math.random() * 0.16);
			const height = finalSize * (0.82 + Math.random() * 0.2);
			const textureWidth = Math.min(width, MAX_TEXTURE_WIDTH);
			const textureScale = width / textureWidth;
			const textureHeight = height / textureScale;
			const rotation = -18 + Math.random() * 36;
			const skewX = -5 + Math.random() * 10;
			const skewY = -3 + Math.random() * 6;
			const borderWidth = (config.simple ? 5 : 10) / textureScale;
			const outerGlow = 28 / textureScale;
			const innerGlow = 22 / textureScale;
			const texturePadding = config.simple
				? Math.max(1, borderWidth)
				: Math.ceil(borderWidth + outerGlow * 2);
			const ripple = createSplashTexture({
				width: textureWidth,
				height: textureHeight,
				padding: texturePadding,
				borderWidth,
				outerGlow,
				innerGlow,
				color,
				fill,
				glow,
				simple: config.simple
			});
			const initialTransform = createTransform(0.02 * textureScale, rotation, skewX, skewY);
			const middleTransform = createTransform(
				(config.simple ? 0.26 : 0.58) * textureScale,
				rotation + 7,
				skewX * 0.6,
				skewY * 0.6
			);
			const fadeTransform = createTransform(
				0.44 * textureScale,
				rotation + 10,
				skewX * 0.3,
				skewY * 0.3
			);
			const finalTransform = createTransform(textureScale, rotation + 13, 0, 0);

			ripple.setAttribute('aria-hidden', 'true');
			ripple.style.position = 'fixed';
			ripple.style.left = `${originX}px`;
			ripple.style.top = `${originY}px`;
			ripple.style.pointerEvents = 'none';
			ripple.style.zIndex = '0';
			ripple.style.transform = initialTransform;
			ripple.style.transformOrigin = 'center';
			ripple.style.backfaceVisibility = 'hidden';
			ripple.style.willChange = 'transform, opacity';

			background.appendChild(ripple);

			const keyframes = config.simple
				? [
						{
							opacity: 0.72,
							transform: initialTransform
						},
						{
							opacity: 0.48,
							offset: 0.38,
							transform: middleTransform
						},
						{
							opacity: 0,
							offset: 0.7,
							transform: fadeTransform
						},
						{
							opacity: 0,
							transform: finalTransform
						}
					]
				: [
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
				];

			const animation = ripple.animate(
				keyframes,
				{
					delay,
					duration,
					easing: config.simple ? 'linear' : 'cubic-bezier(0.11, 0.72, 0.24, 1)'
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

type SplashTexture = {
	width: number;
	height: number;
	padding: number;
	borderWidth: number;
	outerGlow: number;
	innerGlow: number;
	color: string;
	fill: string;
	glow: string;
	simple: boolean;
};

function createSplashTexture(options: SplashTexture) {
	const canvas = document.createElement('canvas');
	const canvasWidth = Math.ceil(options.width + options.padding * 2);
	const canvasHeight = Math.ceil(options.height + options.padding * 2);
	// Keep Retina edges smooth without letting very dense mobile screens create
	// unbounded textures. The bitmap is still painted only once per ripple.
	const rasterScale = Math.min(window.devicePixelRatio || 1, MAX_RASTER_SCALE);
	canvas.width = Math.ceil(canvasWidth * rasterScale);
	canvas.height = Math.ceil(canvasHeight * rasterScale);
	canvas.style.width = `${canvasWidth}px`;
	canvas.style.height = `${canvasHeight}px`;

	const context = canvas.getContext('2d');
	if (!context) return canvas;
	context.scale(rasterScale, rasterScale);

	const path = createOrganicPath(
		options.padding,
		options.padding,
		options.width,
		options.height
	);

	context.save();
	context.lineWidth = options.borderWidth;
	context.strokeStyle = options.color;
	context.fillStyle = options.simple ? 'transparent' : options.fill;
	if (!options.simple) {
		// Canvas shadow blur does not follow the current transform.
		context.shadowBlur = options.outerGlow * rasterScale;
		context.shadowColor = options.glow;
	}
	context.fill(path);
	context.stroke(path);
	context.restore();

	if (!options.simple) {
		// Approximate the inset glow while clipped to the already-painted shape.
		context.save();
		context.clip(path);
		context.lineWidth = options.innerGlow * 2;
		context.strokeStyle = options.fill;
		context.stroke(path);
		context.restore();
	}

	return canvas;
}

function createOrganicPath(x: number, y: number, width: number, height: number) {
	const horizontal = createRadiusValues(width);
	const vertical = createRadiusValues(height);
	const radiusScale = Math.min(
		1,
		width / (horizontal[0] + horizontal[1]),
		width / (horizontal[2] + horizontal[3]),
		height / (vertical[0] + vertical[3]),
		height / (vertical[1] + vertical[2])
	);
	const [topLeftX, topRightX, bottomRightX, bottomLeftX] = horizontal.map(
		(value) => value * radiusScale
	);
	const [topLeftY, topRightY, bottomRightY, bottomLeftY] = vertical.map(
		(value) => value * radiusScale
	);
	const curve = 0.5522847498;
	const path = new Path2D();

	path.moveTo(x + topLeftX, y);
	path.lineTo(x + width - topRightX, y);
	path.bezierCurveTo(
		x + width - topRightX * (1 - curve),
		y,
		x + width,
		y + topRightY * (1 - curve),
		x + width,
		y + topRightY
	);
	path.lineTo(x + width, y + height - bottomRightY);
	path.bezierCurveTo(
		x + width,
		y + height - bottomRightY * (1 - curve),
		x + width - bottomRightX * (1 - curve),
		y + height,
		x + width - bottomRightX,
		y + height
	);
	path.lineTo(x + bottomLeftX, y + height);
	path.bezierCurveTo(
		x + bottomLeftX * (1 - curve),
		y + height,
		x,
		y + height - bottomLeftY * (1 - curve),
		x,
		y + height - bottomLeftY
	);
	path.lineTo(x, y + topLeftY);
	path.bezierCurveTo(
		x,
		y + topLeftY * (1 - curve),
		x + topLeftX * (1 - curve),
		y,
		x + topLeftX,
		y
	);
	path.closePath();

	return path;
}

function createRadiusValues(size: number) {
	return Array.from({ length: 4 }, () => size * (0.42 + Math.random() * 0.16));
}

function normalizeOptions(options: ButtonSplashOptions) {
	return {
		ripples: Math.max(1, options.ripples ?? 2),
		color: options.color,
		durationMs: Math.max(100, options.durationMs ?? 2200),
		simple: options.simple ?? false
	};
}
