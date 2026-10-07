// Генератор уровней режима One Way.
//
// Правило режима: конь ходит только на клетки с предметами, и на клетку, где
// уже побывал, вернуться нельзя. Уровень пройден, когда собрано всё.
//
// Как строится уровень. Случайный путь коня без повторов — по его клеткам
// раскладываются предметы, первая клетка — старт. Значит, решение есть всегда.
// Но путь — не единственная дорога: соседние по ходу коня предметы дают
// развилки, и часть из них ведёт в тупик через несколько ходов.
//
// Как меряется сложность. Точно считается вероятность того, что игрок,
// выбирающий ход наугад среди доступных, соберёт всё. Чем она меньше, тем
// больше на поле ловушек. Для каждого уровня перебираются сотни кандидатов и
// берётся тот, чья сложность ближе всего к цели этого уровня: цель плавно
// падает от ~75% на первом уровне до ~0.2% на последнем, а число предметов
// растёт с 5 до 28.
//
// Запуск из корня проекта:
//   node scripts/gen-oneway-levels.mjs
// Пишет src/utils/oneway-levels.ts. Генерация детерминирована (сид по уровню).

import fs from 'node:fs'

const COUNT = 60
const SIZE = 8
const CANDIDATES = 400
const K = [[1, 2], [2, 1], [-1, 2], [-2, 1], [1, -2], [2, -1], [-1, -2], [-2, -1]]

function rng(seed) {
	return () => {
		seed = (seed + 0x6d2b79f5) | 0
		let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
		t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296
	}
}

/** Случайный путь коня без повторов длиной n внутри квадрата region×region. */
function randomWalk(rand, n, region) {
	for (let attempt = 0; attempt < 200; attempt++) {
		const r0 = Math.floor(rand() * (SIZE - region + 1))
		const c0 = Math.floor(rand() * (SIZE - region + 1))
		const inside = (r, c) => r >= r0 && c >= c0 && r < r0 + region && c < c0 + region
		let cur = [r0 + Math.floor(rand() * region), c0 + Math.floor(rand() * region)]
		const seen = new Set([cur.join()])
		const path = [cur]
		while (path.length < n) {
			const opts = K.map(([dr, dc]) => [cur[0] + dr, cur[1] + dc]).filter(
				([r, c]) => inside(r, c) && !seen.has(r + ',' + c)
			)
			if (!opts.length) break
			cur = opts[Math.floor(rand() * opts.length)]
			seen.add(cur.join())
			path.push(cur)
		}
		if (path.length === n) return path
	}
	return null
}

/**
 * Вероятность пройти уровень, выбирая ход наугад. Точный перебор с памятью по
 * (позиция, собранное). null — если состояний слишком много (кандидат
 * пропускаем: на столь запутанном поле сложность всё равно не оценить).
 * Путь не длиннее 30 клеток, поэтому собранное помещается в 32-битную маску.
 */
function randomSuccess(path) {
	const n = path.length
	const index = new Map(path.map((p, i) => [p.join(), i]))
	const adj = path.map(([r, c]) =>
		K.map(([dr, dc]) => index.get(r + dr + ',' + (c + dc))).filter((i) => i !== undefined)
	)
	const full = n === 31 ? -1 >>> 0 : (1 << n) - 1
	const memo = new Map()
	let budget = 60000
	function walk(pos, mask) {
		if (mask === full) return 1
		const key = mask * 32 + pos
		const hit = memo.get(key)
		if (hit !== undefined) return hit
		if (--budget < 0) throw new Error('budget')
		let count = 0
		let v = 0
		for (const j of adj[pos]) {
			if (mask & (1 << j)) continue
			count++
			v += walk(j, (mask | (1 << j)) >>> 0)
		}
		v = count ? v / count : 0
		memo.set(key, v)
		return v
	}
	try {
		return walk(0, 1)
	} catch {
		return null
	}
}

/** Сколько ходов на пути, где был выбор (для отчёта). */
function forks(path) {
	const index = new Set(path.map((p) => p.join()))
	const seen = new Set()
	let f = 0
	for (const [r, c] of path) {
		seen.add(r + ',' + c)
		const opts = K.filter(([dr, dc]) => {
			const k = r + dr + ',' + (c + dc)
			return index.has(k) && !seen.has(k)
		}).length
		if (opts > 1) f++
	}
	return f
}

const levels = []
for (let i = 0; i < COUNT; i++) {
	const t = i / (COUNT - 1)
	const n = Math.round(5 + t * 23)
	const target = Math.log(0.75) + t * (Math.log(0.002) - Math.log(0.75))
	const rand = rng(1000 + i * 7919)

	let best = null
	for (let k = 0; k < CANDIDATES; k++) {
		// чем дальше, тем чаще путь зажат в маленьком квадрате: там больше
		// перекрёстных ходов, а значит развилок и ловушек
		const region = Math.max(4, Math.min(SIZE, Math.round(SIZE - rand() * (2 + t * 3))))
		const path = randomWalk(rand, n, region)
		if (!path) continue
		const p = randomSuccess(path)
		if (p === null || p <= 0) continue
		const score = Math.abs(Math.log(p) - target)
		if (!best || score < best.score) best = { path, p, score }
		if (score < 0.05) break // достаточно близко к цели
	}
	if (!best) throw new Error('не нашлось кандидата для уровня ' + i)
	levels.push({ start: best.path[0], items: best.path.slice(1), p: best.p, forks: forks(best.path) })
	console.log(
		`#${String(i + 1).padStart(2)}  предметов ${String(n - 1).padStart(2)}  ` +
			`наугад ${(best.p * 100).toFixed(best.p < 0.01 ? 2 : 1).padStart(5)}%  развилок ${levels[i].forks}`
	)
}

const out = `// Сгенерировано scripts/gen-oneway-levels.mjs — руками не править.
// start — клетка коня, items — клетки с предметами. Решение есть всегда:
// предметы лежат на пути коня без повторов. random — вероятность пройти,
// выбирая ход наугад (мера сложности).
export interface IOneWayLevel {
	start: [number, number]
	items: [number, number][]
	random: number
}

export const ONE_WAY_LEVELS: IOneWayLevel[] = [
${levels
	.map(
		(l) =>
			`\t{ start: [${l.start}], items: [${l.items.map((p) => `[${p}]`).join(', ')}], random: ${+l.p.toPrecision(3)} },`
	)
	.join('\n')}
]
`
fs.writeFileSync('src/utils/oneway-levels.ts', out.replace(/\n/g, '\r\n'))
console.log('записано: src/utils/oneway-levels.ts')
