import candyPink from '@/assets/img/game/items/candy-pink.webp'
import candyBlue from '@/assets/img/game/items/candy-blue.webp'
import lollipop from '@/assets/img/game/items/lollipop.webp'
import star from '@/assets/img/game/items/star.webp'
import crystal from '@/assets/img/game/items/crystal.webp'
import crown from '@/assets/img/game/items/crown.webp'

export type ItemKind =
	| 'candy-pink'
	| 'candy-blue'
	| 'lollipop'
	| 'star'
	| 'crystal'
	| 'crown'

// Три вида конфет — одна ценность, разный вид: поле пестрее, правила те же.
export const ITEM_POINTS: Record<ItemKind, number> = {
	'candy-pink': 10,
	'candy-blue': 10,
	lollipop: 10,
	star: 25,
	crystal: 50,
	crown: 100,
}

export const ITEM_IMG: Record<ItemKind, string> = {
	'candy-pink': candyPink,
	'candy-blue': candyBlue,
	lollipop,
	star,
	crystal,
	crown,
}

/** Редкие предметы получают эффект сильнее и счётчик в итогах. */
export const RARE_ITEMS: ItemKind[] = ['star', 'crystal', 'crown']

export type ItemGroup = 'candy' | 'star' | 'crystal' | 'crown'

export type KnightMood = 'happy' | 'think' | 'cheer'

/** «+очки» над клеткой, где взят предмет */
export interface IBoardPopup {
	id: number
	row: number
	col: number
	points: number
	group: ItemGroup
}

export const itemGroup = (kind: ItemKind): ItemGroup =>
	kind === 'star' || kind === 'crystal' || kind === 'crown' ? kind : 'candy'

// Новые предметы открываются постепенно: игроку всегда есть что увидеть.
export const CRYSTAL_FROM_LEVEL = 10
export const CROWN_FROM_LEVEL = 20
const MAX_CROWNS = 2

// Серия: предмет сразу после предмета поднимает множитель, пустой ход сбрасывает.
export const MAX_COMBO = 5

export const COMBO_WORDS: Record<number, string> = {
	2: 'Nice!',
	3: 'Great!',
	4: 'Amazing!',
	5: 'Awesome!',
}

/** Детерминированный ГСЧ: у уровня всегда одна и та же раскладка. */
export function seededRandom(seed: number) {
	return () => {
		seed = (seed + 0x6d2b79f5) | 0
		let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
		t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296
	}
}

export const cellKey = (row: number, col: number) => `${row}:${col}`

/**
 * Предмет для новой клетки. levelIndex — с нуля; crowns — сколько корон уже
 * лежит на уровне (их не больше двух).
 */
export function pickItem(
	rand: () => number,
	levelIndex: number,
	crowns: number
): ItemKind {
	const table: [ItemKind | 'candy', number][] = [
		['candy', 68],
		['star', 22],
	]
	if (levelIndex >= CRYSTAL_FROM_LEVEL) table.push(['crystal', 10])
	if (levelIndex >= CROWN_FROM_LEVEL && crowns < MAX_CROWNS)
		table.push(['crown', 3])

	const total = table.reduce((acc, [, w]) => acc + w, 0)
	let roll = rand() * total
	let picked: ItemKind | 'candy' = 'candy'
	for (const [kind, w] of table) {
		roll -= w
		if (roll < 0) {
			picked = kind
			break
		}
	}
	if (picked !== 'candy') return picked
	const candies: ItemKind[] = ['candy-pink', 'candy-blue', 'lollipop']
	return candies[Math.floor(rand() * candies.length)]
}
