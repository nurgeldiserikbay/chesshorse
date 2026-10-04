import { BOARD_ITEM } from './consts'
import { TypeBoard } from './types'

const KNIGHT_STEPS = [
	[1, 2],
	[2, 1],
	[-1, 2],
	[-2, 1],
	[1, -2],
	[2, -1],
	[-1, -2],
	[-2, -1],
]

const RUNS = 40

// Детерминированный ГСЧ: норма уровня не должна меняться между запусками.
function mulberry32(seed: number) {
	return () => {
		seed = (seed + 0x6d2b79f5) | 0
		let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
		t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296
	}
}

/**
 * Норма ходов для режима Classic: длина лучшего из нескольких жадных
 * маршрутов «к ближайшей монете». Маршрут реально проходим, поэтому три
 * звезды всегда достижимы. null — если какую-то монету не достать.
 */
export function calcMovesPar(
	board: TypeBoard,
	start: number[],
	seed = 1
): number | null {
	const size = board.length
	const passable = (r: number, c: number) =>
		r >= 0 &&
		c >= 0 &&
		r < size &&
		c < (board[r]?.length || 0) &&
		board[r][c].type !== BOARD_ITEM.brick

	const coins: string[] = []
	board.forEach((row, r) =>
		row.forEach((cell, c) => {
			if (cell.type === BOARD_ITEM.pill) coins.push(`${r}:${c}`)
		})
	)
	if (!coins.length) return 0

	const rand = mulberry32(seed)
	let best: number | null = null

	for (let run = 0; run < RUNS; run++) {
		const left = new Set(coins)
		let pos = [start[0], start[1]]
		let total = 0

		while (left.size) {
			// BFS до ближайших монет; среди равноудалённых выбираем случайно.
			const dist = new Map<string, number>([[`${pos[0]}:${pos[1]}`, 0]])
			let frontier = [pos]
			let found: number[][] = []
			let d = 0

			while (frontier.length && !found.length) {
				d++
				const next: number[][] = []
				for (const [r, c] of frontier) {
					for (const [dr, dc] of KNIGHT_STEPS) {
						const nr = r + dr
						const nc = c + dc
						const key = `${nr}:${nc}`
						if (!passable(nr, nc) || dist.has(key)) continue
						dist.set(key, d)
						next.push([nr, nc])
						if (left.has(key)) found.push([nr, nc])
					}
				}
				frontier = next
			}

			if (!found.length) return best
			const target = found[Math.floor(rand() * found.length)]
			total += d
			left.delete(`${target[0]}:${target[1]}`)
			pos = target
			if (best !== null && total >= best) break
		}

		if (!left.size && (best === null || total < best)) best = total
	}

	return best
}

/** Пороги звёзд: 3★ — не больше нормы, 2★ — до +30%, 1★ — просто пройти. */
export function starThresholds(par: number) {
	return { three: par, two: Math.ceil(par * 1.3) }
}

export function starsForMoves(moves: number, par: number | null) {
	if (par === null) return 0
	const t = starThresholds(par)
	if (moves <= t.three) return 3
	if (moves <= t.two) return 2
	return 1
}
