import { BOARD_ITEM } from './consts'
import { TypeBoard } from './types'
import { ItemKind, pickItem, cellKey } from './items'
import { LEVELS } from '@/utils/conts'

/*
   Time Attack — бесконечный забег.

   Таймер тикает вниз, секундомер добавляет время. Волшебная конфета
   (portal) переносит на следующий этап: поле сменяется раскладкой с большим
   числом дырок. Пустые плитки время от времени трескаются и падают, подарок
   (repair) возвращает упавшие. Предметы кладутся только туда, куда конь может
   добраться, — после смены поля и падений никаких недостижимых конфет.
*/

export const RUSH_ITEMS_ON_BOARD = 3
/** Через сколько собранных предметов появляется волшебная конфета */
export const PORTAL_EVERY = 8
/** Сколько секунд даёт секундомер на этапе: 5, 4, потом 3 */
export const clockSeconds = (stage: number) => Math.max(3, 6 - stage)
/** Пауза между падениями плиток: с этапом всё короче */
export const fallDelayMs = (stage: number) => Math.max(2200, 7000 - (stage - 1) * 700)
/** Сколько трещина держится до падения — время отреагировать */
export const CRACK_MS = 1500

const K = [
	[1, 2],
	[2, 1],
	[-1, 2],
	[-2, 1],
	[1, -2],
	[2, -1],
	[-1, -2],
	[-2, -1],
]

const holes = (b: TypeBoard) =>
	b.reduce((acc, r) => acc + r.filter((c) => c.type === BOARD_ITEM.brick).length, 0)

/** Раскладки уровней от самой открытой к самой дырявой */
export const RUSH_LAYOUTS = [...LEVELS].sort((a, b) => holes(a.board) - holes(b.board))

/** Раскладка для этапа: чем дальше забег, тем больше дырок */
export function layoutForStage(stage: number, rand: () => number = Math.random) {
	const from = Math.min(RUSH_LAYOUTS.length - 1, (stage - 1) * 6)
	const to = Math.min(RUSH_LAYOUTS.length - 1, from + 8)
	return RUSH_LAYOUTS[from + Math.floor(rand() * (to - from + 1))]
}

/** Все клетки, куда конь может дойти отсюда (через любые не-дыры) */
export function reachable(board: TypeBoard, from: number[]): Set<string> {
	const seen = new Set([cellKey(from[0], from[1])])
	let q = [from]
	while (q.length) {
		const next: number[][] = []
		for (const [r, c] of q)
			for (const [dr, dc] of K) {
				const nr = r + dr
				const nc = c + dc
				const cell = board[nr]?.[nc]
				const key = cellKey(nr, nc)
				if (!cell || cell.type === BOARD_ITEM.brick || seen.has(key)) continue
				seen.add(key)
				next.push([nr, nc])
			}
		q = next
	}
	return seen
}

/** Сколько ходов есть у коня с этой клетки */
export const movesFrom = (board: TypeBoard, p: number[]) =>
	K.filter(([dr, dc]) => {
		const cell = board[p[0] + dr]?.[p[1] + dc]
		return cell && cell.type !== BOARD_ITEM.brick
	}).length

/** Какой предмет положить следующим */
export function pickRushItem(opts: {
	stage: number
	sinceStage: number
	fallen: number
	onBoard: ItemKind[]
	rand?: () => number
}): ItemKind {
	const { stage, sinceStage, fallen, onBoard, rand = Math.random } = opts
	const has = (k: ItemKind) => onBoard.includes(k)
	if (sinceStage >= PORTAL_EVERY && !has('portal')) return 'portal'
	if (fallen >= 3 && !has('repair') && rand() < 0.35) return 'repair'
	if (!has('clock') && rand() < 0.18) return 'clock'
	// обычные предметы ценнее с каждым этапом, как уровни Classic
	return pickItem(rand, (stage - 1) * 10, onBoard.filter((k) => k === 'crown').length)
}
