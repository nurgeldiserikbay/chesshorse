// Снимает витрину Google Play: шесть экранов на каждое из трёх устройств.
//
// Соотношение у всех кадров ровно 9:16 — Play принимает только 16:9 или 9:16
// (03-MathBoxes уже получал отказ за 5:8). Вьюпорт взят как у настоящего
// устройства, размер файла набирается плотностью.
//
// Рекламная полоса скрыта: на витрине показываем игру, а не место под баннер.
//
// Нужен запущенный сервер (из корня проекта):
//   node node_modules/vite/bin/vite.js --mode development --port 4237
// Затем:
//   node store/make-store-shots.mjs [порт]

import fs from 'node:fs'
import path from 'node:path'

/** patchright лежит в расширении VSCode, версия меняется — ищем сами. */
function findPatchright() {
	const root = 'C:/Users/nurik/.vscode/extensions'
	const hit = fs
		.readdirSync(root)
		.filter((d) => d.startsWith('danielsanmedium.dscodegpt-'))
		.sort()
		.reverse()
		.map((d) => path.join(root, d, 'standalone/node_modules/patchright/index.mjs'))
		.find((p) => fs.existsSync(p))
	if (!hit) throw new Error('patchright не найден в расширениях VSCode')
	return 'file:///' + hit.split(String.fromCharCode(92)).join('/')
}

const { chromium } = await import(findPatchright())

const PORT = process.argv[2] || '4237'
const URL = `http://localhost:${PORT}/`
const OUT = path.resolve('store/screenshots')

const DEVICES = [
	{ dir: 'phone', width: 360, height: 640, scale: 3 }, //   1080×1920
	{ dir: 'tablet7', width: 576, height: 1024, scale: 2 }, // 1152×2048
	{ dir: 'tablet10', width: 720, height: 1280, scale: 2 }, // 1440×2560
]

// Пройденные уровни Classic со звёздами: карта выглядит обжитой.
// До 24-го включительно — чтобы открылся уровень с кристаллами и короной.
const DONE = 24
const STARS = [3, 3, 2, 3, 3, 1, 3, 2, 3, 3, 2, 3, 3, 3, 2, 3, 1, 3, 3, 2, 3, 3, 2, 3]
const stats = { COLLECT_ALL: {}, NO_WAY_BACK: {}, BY_TIME: {} }
for (let i = 0; i < DONE; i++)
	stats.COLLECT_ALL[i] = {
		time: '01:30',
		moves: 50,
		date: 'x',
		stars: STARS[i],
		score: 2400 + i * 37,
	}

const HIDE_ADS = `
	:root { --ad-band: 0px !important; }
	.slot { display: none !important; }
	.promo-games { display: none !important; }
`

async function openApp(browser, dev, { tutorial = false } = {}) {
	const page = await browser.newPage({
		viewport: { width: dev.width, height: dev.height },
		deviceScaleFactor: dev.scale,
	})
	await page.addInitScript(
		({ stats, tutorial }) => {
			try {
				localStorage.setItem('CapacitorStorage.gameStats', JSON.stringify(stats))
				if (tutorial) localStorage.removeItem('chesshorse.tutorial')
				else localStorage.setItem('chesshorse.tutorial', '1')
				localStorage.setItem('chesshorse.music', '0')
			} catch {}
		},
		{ stats, tutorial }
	)
	await page.goto(URL)
	await page.addStyleTag({ content: HIDE_ADS })
	await page.waitForSelector('.start-page__btn')
	await page.waitForTimeout(900)
	return page
}

async function toLevel(page, index) {
	await page.click('.start-page__btn')
	await page.locator('.mode-card--green').click()
	await page.waitForSelector('.node')
	await page.locator('.node').nth(index).dispatchEvent('click')
	await page.waitForSelector('.table__col .item')
	await page.waitForTimeout(700)
}

/** Ход конём к ближайшему предмету (BFS по DOM). false — ходить некуда. */
async function stepToItem(page) {
	const target = await page.evaluate(() => {
		const rows = [...document.querySelectorAll('.table__row')].map((r) => [
			...r.querySelectorAll('.table__col'),
		])
		const h = document.querySelector('.horse')
		const m = /translate\(([\d.]+)px, ([\d.]+)px\)/.exec(h.style.transform)
		const step = rows[0][0].getBoundingClientRect().width + 2
		const start = [Math.round(+m[2] / step), Math.round(+m[1] / step)]
		const K = [[1, 2], [2, 1], [-1, 2], [-2, 1], [1, -2], [2, -1], [-1, -2], [-2, -1]]
		const prev = new Map([[start.join(), null]])
		let q = [start]
		while (q.length) {
			const nq = []
			for (const [r, c] of q)
				for (const [dr, dc] of K) {
					const nr = r + dr
					const nc = c + dc
					const cell = rows[nr] && rows[nr][nc]
					if (!cell || cell.classList.contains('is_hole') || prev.has(nr + ',' + nc)) continue
					prev.set(nr + ',' + nc, [r, c])
					nq.push([nr, nc])
					if (cell.querySelector('.item')) {
						let cur = [nr, nc]
						while (prev.get(cur.join()).join() !== start.join()) cur = prev.get(cur.join())
						return cur
					}
				}
			q = nq
		}
		return null
	})
	if (!target) return false
	await page
		.locator('.table__row')
		.nth(target[0])
		.locator('.table__col')
		.nth(target[1])
		.click()
	return true
}

const browser = await chromium.launch().catch(() => chromium.launch({ channel: 'chrome' }))

for (const dev of DEVICES) {
	const dir = path.join(OUT, dev.dir)
	fs.mkdirSync(dir, { recursive: true })
	const shot = (page, name) => page.screenshot({ path: path.join(dir, name) })

	// 1–3: старт, режимы, карта
	let page = await openApp(browser, dev)
	await shot(page, '01-start.png')
	await page.click('.start-page__btn')
	await page.waitForTimeout(700)
	await shot(page, '02-modes.png')
	await page.locator('.mode-card--green').click()
	await page.waitForSelector('.node')
	await page.waitForTimeout(900)
	await shot(page, '03-map.png')
	await page.close()

	// 4: обучение — первая партия, подсказка и «Г» к клетке
	page = await openApp(browser, dev, { tutorial: true })
	await toLevel(page, 0)
	await page.waitForTimeout(500)
	await shot(page, '04-how-to-play.png')
	await page.close()

	// 5: игра в разгаре — уровень с кристаллами и короной, серия набрана
	page = await openApp(browser, dev)
	await toLevel(page, DONE)
	for (let i = 0; i < 9; i++) {
		await stepToItem(page)
		await page.waitForTimeout(420)
	}
	await stepToItem(page)
	await page.waitForTimeout(330) // «+N» и вспышка ещё на экране
	await shot(page, '05-gameplay.png')

	// 6: победа — доигрываем уровень до конца
	for (let i = 0; i < 300; i++) {
		if (await page.locator('.result-table').count()) break
		if (!(await stepToItem(page))) break
		await page.waitForTimeout(60)
	}
	await page.waitForSelector('.result-table')
	await page.waitForTimeout(3200) // звёзды и бонусы успевают прилететь
	await shot(page, '06-level-complete.png')
	await page.close()

	console.log('готово:', dev.dir)
}

await browser.close()
