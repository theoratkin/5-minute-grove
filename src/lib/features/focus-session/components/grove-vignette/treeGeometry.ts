export type Point = { x: number; y: number };
export type Branch = readonly [Point, Point, Point, Point];

export const SAPLING_BRANCHES: readonly Branch[] = [
	[{ x: 244, y: 94 }, { x: 241, y: 84 }, { x: 235, y: 77 }, { x: 228, y: 72 }],
	[{ x: 244, y: 94 }, { x: 248, y: 82 }, { x: 258, y: 69 }, { x: 266, y: 61 }]
] as const;

export const YOUNG_TREE_BRANCHES: readonly Branch[] = [
	[{ x: 244, y: 89 }, { x: 239, y: 76 }, { x: 228, y: 64 }, { x: 217, y: 59 }],
	[{ x: 244, y: 89 }, { x: 250, y: 72 }, { x: 263, y: 56 }, { x: 276, y: 48 }],
	[{ x: 217, y: 59 }, { x: 211, y: 52 }, { x: 205, y: 47 }, { x: 198, y: 43 }],
	[{ x: 217, y: 59 }, { x: 222, y: 49 }, { x: 227, y: 40 }, { x: 231, y: 34 }]
] as const;

export const FULL_TREE_BRANCHES: readonly Branch[] = [
	[{ x: 244, y: 88 }, { x: 239, y: 73 }, { x: 226, y: 56 }, { x: 214, y: 52 }],
	[{ x: 244, y: 88 }, { x: 250, y: 70 }, { x: 264, y: 50 }, { x: 277, y: 45 }],
	[{ x: 214, y: 52 }, { x: 207, y: 44 }, { x: 198, y: 37 }, { x: 190, y: 34 }],
	[{ x: 214, y: 52 }, { x: 220, y: 41 }, { x: 225, y: 32 }, { x: 230, y: 27 }],
	[{ x: 277, y: 45 }, { x: 270, y: 37 }, { x: 263, y: 29 }, { x: 258, y: 25 }],
	[{ x: 277, y: 45 }, { x: 284, y: 38 }, { x: 293, y: 33 }, { x: 300, y: 31 }],
	[{ x: 190, y: 34 }, { x: 186, y: 27 }, { x: 181, y: 22 }, { x: 176, y: 19 }],
	[{ x: 190, y: 34 }, { x: 193, y: 25 }, { x: 197, y: 16 }, { x: 199, y: 11 }],
	[{ x: 258, y: 25 }, { x: 254, y: 17 }, { x: 249, y: 11 }, { x: 246, y: 8 }],
	[{ x: 258, y: 25 }, { x: 263, y: 20 }, { x: 268, y: 15 }, { x: 271, y: 13 }]
] as const;

export function branchPath([start, controlOne, controlTwo, end]: Branch): string {
	return `M${start.x} ${start.y} C${controlOne.x} ${controlOne.y} ${controlTwo.x} ${controlTwo.y} ${end.x} ${end.y}`;
}

export function pointOnBranch(branch: Branch, t: number): Point {
	const [start, controlOne, controlTwo, end] = branch;
	const inverse = 1 - t;
	return {
		x: inverse ** 3 * start.x + 3 * inverse ** 2 * t * controlOne.x + 3 * inverse * t ** 2 * controlTwo.x + t ** 3 * end.x,
		y: inverse ** 3 * start.y + 3 * inverse ** 2 * t * controlOne.y + 3 * inverse * t ** 2 * controlTwo.y + t ** 3 * end.y
	};
}

export function branchDirection(branch: Branch, t: number): Point {
	const [start, controlOne, controlTwo, end] = branch;
	const inverse = 1 - t;
	return {
		x: 3 * inverse ** 2 * (controlOne.x - start.x) + 6 * inverse * t * (controlTwo.x - controlOne.x) + 3 * t ** 2 * (end.x - controlTwo.x),
		y: 3 * inverse ** 2 * (controlOne.y - start.y) + 6 * inverse * t * (controlTwo.y - controlOne.y) + 3 * t ** 2 * (end.y - controlTwo.y)
	};
}
