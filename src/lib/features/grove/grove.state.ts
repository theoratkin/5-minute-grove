import type { GroveProgress, GroveSeedRecord, GroveState } from './grove.types.ts';

export const LEAVES_PER_TREE = 60;
const MINUTE_SECONDS = 60;

export function emptyGroveState(): GroveState {
	return {
		version: 2,
		totalLeaves: 0,
		creditedMinutesBySession: {},
		settledMatureTreeCount: 0
	};
}

export function normalizeGroveState(value: unknown): GroveState {
	if (!value || typeof value !== 'object') return emptyGroveState();

	const candidate = value as Record<string, unknown>;
	const creditedMinutesBySession =
		candidate.version === 2
			? normalizeCreditMap(candidate.creditedMinutesBySession, 1)
			: candidate.version === 1
				? normalizeCreditMap(candidate.creditedContractsBySession, 5)
				: null;
	if (!creditedMinutesBySession) return emptyGroveState();

	const creditedLeafTotal = Object.values(creditedMinutesBySession).reduce(
		(total, count) => total + count,
		0
	);
	const storedTotal =
		typeof candidate.totalLeaves === 'number' && Number.isFinite(candidate.totalLeaves)
			? Math.max(0, Math.floor(candidate.totalLeaves))
			: 0;
	const totalLeaves = Math.max(storedTotal, creditedLeafTotal);
	const settledMatureTreeCount =
		candidate.version === 2
			? Math.min(
					finiteCount(candidate.settledMatureTreeCount),
					Math.floor(totalLeaves / LEAVES_PER_TREE)
				)
			: Math.floor(totalLeaves / LEAVES_PER_TREE);

	return {
		version: 2,
		totalLeaves,
		creditedMinutesBySession,
		settledMatureTreeCount
	};
}

export function seedGroveState(records: GroveSeedRecord[]): GroveState {
	return reconcileGroveState(emptyGroveState(), records);
}

export function reconcileGroveState(state: GroveState, records: GroveSeedRecord[]): GroveState {
	let reconciled = state;

	for (const record of records) {
		if (!record.id) continue;
		const completedContractMinutes = finiteCount(record.completedContracts) * 5;
		const elapsedMinutes = Math.floor(finiteCount(record.totalSeconds) / MINUTE_SECONDS);
		const result = creditElapsedMinutes(
			reconciled,
			record.id,
			Math.max(completedContractMinutes, elapsedMinutes)
		);
		reconciled = result.state;
	}

	return reconciled;
}

export function creditElapsedMinutes(
	state: GroveState,
	sessionId: string,
	elapsedMinutes: number
): { state: GroveState; addedLeaves: number } {
	const nextCount = finiteCount(elapsedMinutes);
	const previousCount = state.creditedMinutesBySession[sessionId] ?? 0;
	const addedLeaves = Math.max(0, nextCount - previousCount);
	if (!sessionId || addedLeaves === 0) return { state, addedLeaves: 0 };

	return {
		state: {
			...state,
			totalLeaves: state.totalLeaves + addedLeaves,
			creditedMinutesBySession: {
				...state.creditedMinutesBySession,
				[sessionId]: nextCount
			}
		},
		addedLeaves
	};
}

export function settleMatureTrees(state: GroveState): GroveState {
	const settledMatureTreeCount = Math.floor(state.totalLeaves / LEAVES_PER_TREE);
	return settledMatureTreeCount === state.settledMatureTreeCount
		? state
		: { ...state, settledMatureTreeCount };
}

export function deriveGroveProgress(
	totalLeaves: number,
	settledTreeCount = Math.floor(finiteCount(totalLeaves) / LEAVES_PER_TREE)
): GroveProgress {
	const leaves = finiteCount(totalLeaves);
	const matureTreeCount = Math.min(
		finiteCount(settledTreeCount),
		Math.floor(leaves / LEAVES_PER_TREE)
	);
	return {
		matureTreeCount,
		currentTreeNumber: matureTreeCount + 1,
		currentTreeLeaves: Math.min(LEAVES_PER_TREE, leaves - matureTreeCount * LEAVES_PER_TREE)
	};
}

function normalizeCreditMap(value: unknown, multiplier: number): Record<string, number> {
	const credits: Record<string, number> = {};
	if (!value || typeof value !== 'object') return credits;
	for (const [sessionId, count] of Object.entries(value)) {
		if (!sessionId || typeof count !== 'number' || !Number.isFinite(count)) continue;
		credits[sessionId] = Math.max(0, Math.floor(count)) * multiplier;
	}
	return credits;
}

function finiteCount(value: unknown): number {
	return typeof value === 'number' && Number.isFinite(value)
		? Math.max(0, Math.floor(value))
		: 0;
}
