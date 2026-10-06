// Собирает из двух исходников всё, что нужно сборке и витрине.
//
// Исходники — `store/brand/icon-source.png` (квадрат без прозрачных и тёмных
// углов: Play и Android скругляют иконку сами) и `store/brand/banner-source.png`.
// Всё остальное — производные, и пересобирать их надо отсюда: размеры Android
// и Play разъезжаются молча.
//
//   node store/make-brand.mjs                 — ресурсы, витрина, PWA
//   npx capacitor-assets generate --android   — раскладка по Android
//   node store/make-brand.mjs --shrink-splash — заставка PNG → WebP
//
// Последний шаг обязателен: capacitor-assets раскладывает заставку в 26 PNG
// (~8 МБ, больше самой игры), WebP с тем же именем ресурса весит в разы меньше.

import fs from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/(\w:)/, '$1')), '..')

// sharp ставится транзитивно (через @capacitor/assets) и в корень node_modules
// не попадает — берём его из хранилища pnpm.
function loadSharp() {
	const store = path.join(ROOT, 'node_modules/.pnpm')
	const dir = fs
		.readdirSync(store)
		.filter((d) => d.startsWith('sharp@'))
		.sort()
		.reverse()[0]
	if (!dir) throw new Error('sharp не найден в node_modules/.pnpm')
	return createRequire(path.join(store, dir, 'node_modules/sharp/package.json'))('sharp')
}
const sharp = loadSharp()

const ICON = path.join(ROOT, 'store/brand/icon-source.png')
const BANNER = path.join(ROOT, 'store/brand/banner-source.png')
const RES = path.join(ROOT, 'resources')
const UPLOAD = path.join(ROOT, 'store/upload')
const PUB_ICONS = path.join(ROOT, 'public/icons')

// --------------------------------------------- заставка в WebP (после assets) ---
if (process.argv.includes('--shrink-splash')) {
	const res = path.join(ROOT, 'android/app/src/main/res')
	let before = 0
	let after = 0
	for (const dir of fs.readdirSync(res).filter((d) => d.startsWith('drawable'))) {
		const png = path.join(res, dir, 'splash.png')
		if (!fs.existsSync(png)) continue
		const webp = png.replace(/\.png$/, '.webp')
		await sharp(png).webp({ quality: 85, effort: 6 }).toFile(webp)
		before += fs.statSync(png).size
		after += fs.statSync(webp).size
		fs.rmSync(png) // два ресурса с одним именем Android не соберёт
	}
	console.log('заставка:', (before / 1048576).toFixed(1), 'МБ →', (after / 1048576).toFixed(1), 'МБ')
	process.exit(0)
}

fs.mkdirSync(UPLOAD, { recursive: true })
const made = []
const add = (file, note) => made.push(`${path.relative(ROOT, file).replace(/\\/g, '/')} — ${note}`)

/** Средний цвет полосы иконки: фон заставки берётся из неё самой. */
async function averageColor(file, region) {
	const { data } = await sharp(file).extract(region).resize(1, 1, { fit: 'fill' }).raw().toBuffer({ resolveWithObject: true })
	return `#${[data[0], data[1], data[2]].map((v) => v.toString(16).padStart(2, '0')).join('')}`
}

const meta = await sharp(ICON).metadata()
const band = (top) => ({ left: 0, top, width: Math.round(meta.width * 0.08), height: Math.round(meta.height * 0.1) })
const skyTop = await averageColor(ICON, band(0))
const skyBottom = await averageColor(ICON, band(Math.round(meta.height * 0.9)))

const gradient = (w, h, top, bottom) =>
	Buffer.from(
		`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">
			<defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
				<stop offset="0" stop-color="${top}"/><stop offset="1" stop-color="${bottom}"/>
			</linearGradient></defs>
			<rect width="${w}" height="${h}" fill="url(#g)"/>
		</svg>`
	)

const icon = (size) => sharp(ICON).resize(size, size, { fit: 'cover', kernel: sharp.kernel.lanczos3 })

// ------------------------------------------------------------------ иконка ---

await icon(1024).ensureAlpha().png().toFile(path.join(RES, 'icon-only.png'))
add(path.join(RES, 'icon-only.png'), '1024×1024')

// Передний слой во весь холст: capacitor-assets сам оборачивает слои в
// <inset 16.7%>, свой запас поверх дал бы двойное уменьшение (так было в 03).
await icon(1024).ensureAlpha().png().toFile(path.join(RES, 'icon-foreground.png'))
add(path.join(RES, 'icon-foreground.png'), '1024×1024, во весь холст')

await sharp(gradient(1024, 1024, skyTop, skyBottom)).png().toFile(path.join(RES, 'icon-background.png'))
add(path.join(RES, 'icon-background.png'), `градиент ${skyTop} → ${skyBottom}`)

// ---------------------------------------------------------------- заставка ---

// Значок по центру градиента, а не картинка во весь экран: заставка
// раскладывается на два десятка размеров, гладкий фон сжимается в разы лучше.
const BADGE = 760
const mask = Buffer.from(
	`<svg xmlns="http://www.w3.org/2000/svg" width="${BADGE}" height="${BADGE}">
		<rect width="${BADGE}" height="${BADGE}" rx="${Math.round(BADGE * 0.23)}" fill="#fff"/>
	</svg>`
)
const badge = await icon(BADGE).composite([{ input: mask, blend: 'dest-in' }]).png().toBuffer()
const SPLASH = 2732
const centre = Math.round((SPLASH - BADGE) / 2)
for (const [name, top, bottom] of [
	['splash.png', skyTop, skyBottom],
	['splash-dark.png', '#1b2a52', '#101733'],
]) {
	await sharp(gradient(SPLASH, SPLASH, top, bottom))
		.composite([{ input: badge, left: centre, top: centre }])
		.png()
		.toFile(path.join(RES, name))
	add(path.join(RES, name), `${SPLASH}×${SPLASH}, значок ${BADGE}px`)
}

// ---------------------------------------------------------------- витрина ---

await icon(512).ensureAlpha().png().toFile(path.join(UPLOAD, 'icon-512.png'))
add(path.join(UPLOAD, 'icon-512.png'), 'иконка Play, 32-битный PNG')

// Play принимает обложку только без альфа-канала. У исходника 1794×876 —
// ровно 2.048, как у 1024×500, поэтому cover ничего не срежет.
await sharp(BANNER)
	.resize(1024, 500, { fit: 'cover', kernel: sharp.kernel.lanczos3 })
	.removeAlpha()
	.png()
	.toFile(path.join(UPLOAD, 'feature-graphic-1024x500.png'))
add(path.join(UPLOAD, 'feature-graphic-1024x500.png'), 'баннер Play, без альфы')

// -------------------------------------------------------------------- PWA ---

// Размеры — из vite.config.ts (манифест) и index.html. Меняются только вместе.
for (const [name, size] of [
	['favicon-16x16.png', 16],
	['favicon-32x32.png', 32],
	['apple-touch-icon.png', 180],
	['android-chrome-192x192.png', 192],
	['android-chrome-512x512.png', 512],
	['mstile-70x70.png', 70],
	['mstile-144x144.png', 144],
	['mstile-150x150.png', 150],
	['mstile-310x310.png', 310],
]) {
	await icon(size).png().toFile(path.join(PUB_ICONS, name))
}
// Широкая плитка: значок по центру того же градиента
await sharp(gradient(310, 150, skyTop, skyBottom))
	.composite([{ input: await icon(130).png().toBuffer(), left: 90, top: 10 }])
	.png()
	.toFile(path.join(PUB_ICONS, 'mstile-310x150.png'))
add(PUB_ICONS, '10 размеров значка')

// favicon.ico: с Vista ICO держит внутри обычные PNG — собираем руками
const icoSizes = [16, 32, 48]
const icoImages = await Promise.all(icoSizes.map((s) => icon(s).png().toBuffer()))
const dir = Buffer.alloc(6 + 16 * icoSizes.length)
dir.writeUInt16LE(0, 0)
dir.writeUInt16LE(1, 2)
dir.writeUInt16LE(icoSizes.length, 4)
let offset = dir.length
icoSizes.forEach((size, i) => {
	const at = 6 + i * 16
	dir.writeUInt8(size, at)
	dir.writeUInt8(size, at + 1)
	dir.writeUInt16LE(1, at + 4)
	dir.writeUInt16LE(32, at + 6)
	dir.writeUInt32LE(icoImages[i].length, at + 8)
	dir.writeUInt32LE(offset, at + 12)
	offset += icoImages[i].length
})
fs.writeFileSync(path.join(PUB_ICONS, 'favicon.ico'), Buffer.concat([dir, ...icoImages]))
add(path.join(PUB_ICONS, 'favicon.ico'), icoSizes.join(', ') + ' px')

console.log(made.join('\n'))
