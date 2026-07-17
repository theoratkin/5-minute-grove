<script lang="ts">
	let { count, animateGrowth = false }: { count: number; animateGrowth?: boolean } = $props();

	type Point = { x: number; y: number };
	type Branch = readonly [Point, Point, Point, Point];

	const branches: readonly Branch[] = [
		[{ x: 243, y: 69 }, { x: 229, y: 61 }, { x: 216, y: 52 }, { x: 205, y: 41 }],
		[{ x: 247, y: 58 }, { x: 258, y: 49 }, { x: 269, y: 43 }, { x: 278, y: 36 }],
		[{ x: 241, y: 84 }, { x: 228, y: 78 }, { x: 215, y: 72 }, { x: 203, y: 63 }],
		[{ x: 250, y: 82 }, { x: 262, y: 75 }, { x: 273, y: 67 }, { x: 282, y: 58 }],
		[{ x: 243, y: 49 }, { x: 234, y: 42 }, { x: 226, y: 35 }, { x: 219, y: 27 }]
	] as const;

	function pointOnBranch(branch: Branch, t: number): Point {
		const [start, controlOne, controlTwo, end] = branch;
		const inverse = 1 - t;
		return {
			x: inverse ** 3 * start.x + 3 * inverse ** 2 * t * controlOne.x + 3 * inverse * t ** 2 * controlTwo.x + t ** 3 * end.x,
			y: inverse ** 3 * start.y + 3 * inverse ** 2 * t * controlOne.y + 3 * inverse * t ** 2 * controlTwo.y + t ** 3 * end.y
		};
	}

	function branchDirection(branch: Branch, t: number): Point {
		const [start, controlOne, controlTwo, end] = branch;
		const inverse = 1 - t;
		return {
			x: 3 * inverse ** 2 * (controlOne.x - start.x) + 6 * inverse * t * (controlTwo.x - controlOne.x) + 3 * t ** 2 * (end.x - controlTwo.x),
			y: 3 * inverse ** 2 * (controlOne.y - start.y) + 6 * inverse * t * (controlTwo.y - controlOne.y) + 3 * t ** 2 * (end.y - controlTwo.y)
		};
	}

	// Each completed minute advances one of the five branches. After every
	// five leaves, the next ring starts slightly farther from the trunk.
	const leaves = Array.from({ length: 12 }, (_, ring) =>
		branches.map((branch, branchIndex) => {
			const t = 0.13 + ring * 0.0785;
			const anchor = pointOnBranch(branch, t);
			const direction = branchDirection(branch, t);
			const directionLength = Math.hypot(direction.x, direction.y);
			const side = (ring + branchIndex) % 2 === 0 ? 1 : -1;
			const normal = {
				x: (-direction.y / directionLength) * side,
				y: (direction.x / directionLength) * side
			};
			const distanceFromBranch = 3.8 + ((ring + branchIndex) % 3) * 0.45;
			return {
				anchor,
				x: anchor.x + normal.x * distanceFromBranch,
				y: anchor.y + normal.y * distanceFromBranch,
				rotation: (Math.atan2(normal.y, normal.x) * 180) / Math.PI,
				scale: 0.78 + ((ring * 2 + branchIndex) % 4) * 0.045,
				tone: (ring + branchIndex * 2) % 3
			};
		})
	).flat();
</script>

{#each leaves as leaf, growthIndex}
	{#if growthIndex < count}
		<g
			class:new-leaf={animateGrowth && growthIndex === count - 1}
			class="leaf-growth"
			style={`transform-origin: ${leaf.anchor.x}px ${leaf.anchor.y}px`}
		>
			<ellipse
				class={`leaf-tone-${leaf.tone}`}
				cx={leaf.x}
				cy={leaf.y}
				rx={8.2 * leaf.scale}
				ry={5 * leaf.scale}
				transform={`rotate(${leaf.rotation} ${leaf.x} ${leaf.y})`}
			></ellipse>
		</g>
	{/if}
{/each}

<style>
	.leaf-growth { transform-box: view-box; }
	.leaf-tone-0 { fill: var(--color-moss); }
	.leaf-tone-1 { fill: var(--color-moss-dark); }
	.leaf-tone-2 { fill: var(--color-moss); opacity: 0.68; }
	.new-leaf { animation: leaf-bloom 900ms cubic-bezier(0.18, 0.9, 0.28, 1.25) both; }

	@keyframes leaf-bloom {
		0% { opacity: 0; scale: 0.05; }
		55% { opacity: 1; scale: 1.28; filter: drop-shadow(0 0 5px var(--color-sun)); }
		100% { scale: 1; filter: none; }
	}

	@media (prefers-reduced-motion: reduce) {
		.new-leaf { animation: none; opacity: 1; scale: 1; }
	}
</style>
