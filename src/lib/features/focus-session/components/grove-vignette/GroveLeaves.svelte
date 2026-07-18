<script lang="ts">
	let { count, animateGrowth = false }: { count: number; animateGrowth?: boolean } = $props();

	import { branchDirection, pointOnBranch, FULL_TREE_BRANCHES } from './treeGeometry';

	// Each completed minute advances one limb of the three-level fork. After
	// every pass through the limbs, the next ring grows farther toward the tips.
	const ringCount = Math.ceil(60 / FULL_TREE_BRANCHES.length);
	const leaves = Array.from({ length: ringCount }, (_, ring) =>
		FULL_TREE_BRANCHES.map((branch, branchIndex) => {
			const t = 0.2 + (ring / Math.max(1, ringCount - 1)) * 0.72;
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
	).flat().slice(0, 60);
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
