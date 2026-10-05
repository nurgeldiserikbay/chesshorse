import { ref } from 'vue'

/*
   Звук и музыка синтезируются через Web Audio — без mp3-файлов.
   Звуки короткие и мягкие (синус/треугольник с быстрым затуханием),
   ноты сбора идут по пентатонике и поднимаются с серией, складываясь
   в мелодию. Фоновая мелодия — тихая «музыкальная шкатулка» по кругу
   C–Am–F–G, планируется наперёд и затихает, когда приложение свёрнуто.
*/

export type SfxName =
	| 'hop'
	| 'candy'
	| 'star'
	| 'crystal'
	| 'crown'
	| 'win'
	| 'fail'

const STORAGE_SOUND = 'chesshorse.sound'
const STORAGE_MUSIC = 'chesshorse.music'

function readFlag(key: string): boolean {
	try {
		return localStorage.getItem(key) !== '0'
	} catch {
		return true
	}
}

function writeFlag(key: string, value: boolean) {
	try {
		localStorage.setItem(key, value ? '1' : '0')
	} catch {
		// хранилище может быть недоступно — настройка просто не запомнится
	}
}

const audioActive = ref(readFlag(STORAGE_SOUND))
const musicActive = ref(readFlag(STORAGE_MUSIC))

let ctx: AudioContext | null = null
let sfxBus: GainNode | null = null
let musicBus: GainNode | null = null

function getCtx(): AudioContext | null {
	if (ctx) return ctx
	const AC =
		window.AudioContext ||
		(window as unknown as { webkitAudioContext?: typeof AudioContext })
			.webkitAudioContext
	if (!AC) return null
	ctx = new AC()

	sfxBus = ctx.createGain()
	sfxBus.gain.value = 0.55
	sfxBus.connect(ctx.destination)

	// Музыку прячем за мягким фильтром: она фон, а не главное
	const lowpass = ctx.createBiquadFilter()
	lowpass.type = 'lowpass'
	lowpass.frequency.value = 2600
	musicBus = ctx.createGain()
	musicBus.gain.value = 0
	musicBus.connect(lowpass)
	lowpass.connect(ctx.destination)
	return ctx
}

const midi = (n: number) => 440 * Math.pow(2, (n - 69) / 12)

/** Одна нота: синус + тихий обертон, быстрая атака, экспоненциальное затухание */
function tone(
	bus: GainNode,
	freq: number,
	at: number,
	{
		dur = 0.25,
		gain = 0.2,
		type = 'sine' as OscillatorType,
		overtone = 0.25,
		slideTo = 0,
	} = {}
) {
	if (!ctx) return
	const g = ctx.createGain()
	g.gain.setValueAtTime(0.0001, at)
	g.gain.exponentialRampToValueAtTime(gain, at + 0.006)
	g.gain.exponentialRampToValueAtTime(0.0001, at + dur)
	g.connect(bus)

	const osc = ctx.createOscillator()
	osc.type = type
	osc.frequency.setValueAtTime(freq, at)
	if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, at + dur)
	osc.connect(g)
	osc.start(at)
	osc.stop(at + dur + 0.02)

	if (overtone > 0) {
		const og = ctx.createGain()
		og.gain.value = overtone
		og.connect(g)
		const o2 = ctx.createOscillator()
		o2.type = 'sine'
		o2.frequency.setValueAtTime(freq * 2, at)
		o2.connect(og)
		o2.start(at)
		o2.stop(at + dur + 0.02)
	}
}

// До мажорная пентатоника: любые две ноты подряд звучат благозвучно
const PENTA = [72, 74, 76, 79, 81, 84, 86, 88]

function playSfx(name: SfxName, step = 1) {
	const c = getCtx()
	if (!c || !sfxBus) return
	if (c.state === 'suspended') void c.resume()
	const t = c.currentTime + 0.01
	const bus = sfxBus

	switch (name) {
		case 'hop':
			// мягкий деревянный «тук» с опусканием высоты
			tone(bus, 520, t, { dur: 0.09, gain: 0.12, type: 'triangle', overtone: 0, slideTo: 260 })
			break
		case 'candy': {
			const note = PENTA[Math.min(step - 1, PENTA.length - 1)]
			tone(bus, midi(note), t, { dur: 0.22, gain: 0.16 })
			break
		}
		case 'star': {
			const note = PENTA[Math.min(step - 1, PENTA.length - 3)]
			tone(bus, midi(note), t, { dur: 0.2, gain: 0.15 })
			tone(bus, midi(note + 7), t + 0.07, { dur: 0.3, gain: 0.13 })
			break
		}
		case 'crystal':
			;[84, 88, 91, 96].forEach((n, i) =>
				tone(bus, midi(n), t + i * 0.05, { dur: 0.35, gain: 0.1, overtone: 0.4 })
			)
			break
		case 'crown':
			;[72, 76, 79, 84].forEach((n, i) =>
				tone(bus, midi(n), t + i * 0.08, {
					dur: i === 3 ? 0.6 : 0.2,
					gain: 0.14,
					type: 'triangle',
				})
			)
			break
		case 'win':
			;[72, 76, 79, 84, 79, 84].forEach((n, i) =>
				tone(bus, midi(n), t + i * 0.11, {
					dur: i === 5 ? 0.9 : 0.25,
					gain: 0.14,
					type: 'triangle',
				})
			)
			tone(bus, midi(48), t + 0.55, { dur: 1, gain: 0.12, type: 'triangle', overtone: 0 })
			break
		case 'fail':
			;[67, 64, 60].forEach((n, i) =>
				tone(bus, midi(n), t + i * 0.16, { dur: 0.35, gain: 0.12, type: 'triangle' })
			)
			break
	}
}

/* ---------- фоновая мелодия ---------- */

const BPM = 92
const EIGHTH = 60 / BPM / 2

// Аккорды по тактам (корень в басу) и мелодия восьмыми; 0 — пауза
const CHORDS = [48, 45, 41, 43, 48, 45, 41, 43]
const MELODY = [
	[76, 0, 79, 0, 81, 79, 76, 0],
	[72, 0, 76, 0, 74, 72, 69, 0],
	[77, 0, 81, 0, 79, 77, 76, 0],
	[74, 0, 79, 0, 77, 76, 74, 0],
	[76, 0, 79, 0, 84, 0, 83, 81],
	[81, 0, 76, 0, 81, 79, 76, 0],
	[77, 0, 81, 79, 77, 0, 74, 0],
	[74, 76, 77, 74, 72, 0, 0, 0],
]

let schedTimer: ReturnType<typeof setInterval> | undefined
let nextTime = 0
let stepIndex = 0

function scheduleMusic() {
	if (!ctx || !musicBus) return
	while (nextTime < ctx.currentTime + 0.4) {
		const bar = Math.floor(stepIndex / 8) % CHORDS.length
		const beat = stepIndex % 8
		const root = CHORDS[bar]

		const note = MELODY[bar][beat]
		if (note) tone(musicBus, midi(note), nextTime, { dur: 0.7, gain: 0.22, overtone: 0.3 })
		// бас на первую и третью долю, тихие аккордовые ноты между
		if (beat === 0 || beat === 4)
			tone(musicBus, midi(root), nextTime, { dur: 0.9, gain: 0.2, type: 'triangle', overtone: 0 })
		if (beat === 2 || beat === 6) {
			const third = root + (bar % 4 === 1 ? 3 : 4)
			tone(musicBus, midi(third + 12), nextTime, { dur: 0.4, gain: 0.07, overtone: 0 })
			tone(musicBus, midi(root + 19), nextTime, { dur: 0.4, gain: 0.07, overtone: 0 })
		}

		nextTime += EIGHTH
		stepIndex++
	}
}

function fadeMusic(to: number, sec = 0.6) {
	if (!ctx || !musicBus) return
	const g = musicBus.gain
	g.cancelScheduledValues(ctx.currentTime)
	g.setValueAtTime(g.value, ctx.currentTime)
	g.linearRampToValueAtTime(to, ctx.currentTime + sec)
}

function startMusic() {
	if (!musicActive.value || document.hidden) return
	const c = getCtx()
	if (!c) return
	if (c.state === 'suspended') void c.resume()
	if (!schedTimer) {
		nextTime = c.currentTime + 0.1
		schedTimer = setInterval(scheduleMusic, 100)
	}
	fadeMusic(0.32, 1.2)
}

function stopMusic() {
	fadeMusic(0, 0.4)
	setTimeout(() => {
		if (musicActive.value && !document.hidden) return
		clearInterval(schedTimer)
		schedTimer = undefined
	}, 450)
}

// Свернули приложение — тишина; вернулись — музыка дальше
if (typeof document !== 'undefined') {
	document.addEventListener('visibilitychange', () => {
		if (document.hidden) {
			stopMusic()
			void ctx?.suspend()
		} else if (musicActive.value && ctx) {
			void ctx.resume().then(startMusic)
		}
	})
}

export const useAudio = () => {
	function playAudio(name: SfxName, step = 1) {
		if (!audioActive.value) return
		playSfx(name, step)
	}

	function toggleAudio() {
		audioActive.value = !audioActive.value
		writeFlag(STORAGE_SOUND, audioActive.value)
	}

	function toggleMusic() {
		musicActive.value = !musicActive.value
		writeFlag(STORAGE_MUSIC, musicActive.value)
		if (musicActive.value) startMusic()
		else stopMusic()
	}

	return {
		audioActive,
		musicActive,
		toggleAudio,
		toggleMusic,
		playAudio,
		startMusic,
	}
}
