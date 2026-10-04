export type SweetKind = 'candy' | 'lollipop' | 'donut' | 'cupcake'

export interface ISweet {
	kind: SweetKind
	points: number
	// доля на доске: чем дороже сладость, тем реже
	weight: number
}

export const SWEETS: ISweet[] = [
	{ kind: 'candy', points: 10, weight: 55 },
	{ kind: 'lollipop', points: 20, weight: 25 },
	{ kind: 'donut', points: 30, weight: 14 },
	{ kind: 'cupcake', points: 50, weight: 6 },
]

export const SWEET_POINTS = Object.fromEntries(
	SWEETS.map((s) => [s.kind, s.points])
) as Record<SweetKind, number>

// Серия: каждая сладость подряд, без пустого хода, поднимает множитель.
export const MAX_COMBO = 5

export function pickSweet(rand: () => number = Math.random): SweetKind {
	const total = SWEETS.reduce((acc, s) => acc + s.weight, 0)
	let roll = rand() * total
	for (const s of SWEETS) {
		roll -= s.weight
		if (roll < 0) return s.kind
	}
	return SWEETS[0].kind
}

/** Детерминированный ГСЧ: у уровня всегда одна и та же раскладка сладостей. */
export function seededRandom(seed: number) {
	return () => {
		seed = (seed + 0x6d2b79f5) | 0
		let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
		t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296
	}
}

export const cellKey = (row: number, col: number) => `${row}:${col}`
