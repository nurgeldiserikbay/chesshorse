import { ref, computed, watch } from 'vue'
import { defineStore } from 'pinia'
import { Preferences } from '@capacitor/preferences'

import { LEVELS, GAME_TYPE, GAME_TYPES, levelsFor } from '@/utils/conts'

export interface IGameStat {
	time: string
	moves: number
	date: string
	score?: number
	stars?: number
	// партия не засчитана (One Way: застрял, собрав не всё)
	failed?: boolean
}

export type IGameStats = {
	[key: string]: { [key: number]: IGameStat }
}

const ONE_WAY_VERSION_KEY = 'chesshorse.oneway.version'

export const useGameStore = defineStore('GameStore', () => {
	const gameType = ref<GAME_TYPE | null>(null)
	const currentLevel = ref(LEVELS[0]?.level || 0)
	const curGameStat = ref<IGameStat>({
		time: '',
		moves: 0,
		date: '',
		score: 0,
		stars: 0,
		failed: false,
	})
	const gameStats = ref<IGameStats>({
		[GAME_TYPES.COLLECT_ALL]: {},
		[GAME_TYPES.NO_WAY_BACK]: {},
		[GAME_TYPES.BY_TIME]: {},
	})

	const nextLevel = computed(() => {
		// One Way открывается внутри себя: следующий — после пройденного текущего
		if (gameType.value === GAME_TYPES.NO_WAY_BACK) {
			if (!gameStats.value[GAME_TYPES.NO_WAY_BACK][currentLevel.value]) return
			return levelsFor(gameType.value)[currentLevel.value + 1]?.level
		}
		if (
			gameType.value !== GAME_TYPES.COLLECT_ALL &&
			!gameStats.value[GAME_TYPES.COLLECT_ALL][currentLevel.value]
		)
			return
		return LEVELS[currentLevel.value + 1]?.level
	})

	watch(
		() => gameStats.value,
		async () => {
			await Preferences.set({
				key: 'gameStats',
				value: JSON.stringify(gameStats.value),
			})
		},
		{ deep: true }
	)

	function setGameType(type: GAME_TYPE) {
		gameType.value = type
	}

	function selectLevel(levelInd: number) {
		currentLevel.value = levelInd

		curGameStat.value = {
			time: '',
			moves: 0,
			date: '',
			score: 0,
			stars: 0,
			failed: false,
		}
	}

	function updateGameStat(
		fields: (keyof IGameStat)[],
		newGameStat: Partial<IGameStat>
	) {
		fields.forEach((key) => {
			if (curGameStat.value[key] !== undefined) {
				// @ts-ignore
				curGameStat.value[key] = newGameStat[key]
			}
		})
	}

	function gameEnd(time: string) {
		if (curGameStat.value) {
			curGameStat.value.time = time
			curGameStat.value.date = new Date().toDateString()
		}

		// Незасчитанная партия (застрял в One Way) уровень не проходит
		if (curGameStat.value?.failed) return

		// Последняя партия — время и ходы, а звёзды и очки — лучшие за всё время:
		// переигровка не должна отнимать заработанное.
		if (gameType.value) {
			const prev = gameStats.value[gameType.value][currentLevel.value]
			gameStats.value[gameType.value][currentLevel.value] = {
				...curGameStat.value,
				stars: Math.max(prev?.stars || 0, curGameStat.value.stars || 0),
				score: Math.max(prev?.score || 0, curGameStat.value.score || 0),
			}
		}
	}

	function reload() {
		selectLevel(currentLevel.value)
	}

	async function loadData() {
		// Отметка версии ставится сразу, даже без сохранений: иначе у нового
		// игрока сброс сработал бы при втором запуске и стёр настоящий прогресс.
		let legacyOneWay = false
		try {
			legacyOneWay = localStorage.getItem(ONE_WAY_VERSION_KEY) !== '2'
			localStorage.setItem(ONE_WAY_VERSION_KEY, '2')
		} catch {
			// хранилище недоступно — сбрасывать не будем
		}

		const ret = await Preferences.get({ key: 'gameStats' })

		if (!ret.value) return

		// В браузере игры с одного localhost делят хранилище, и 02/07 пишут
		// свой «gameStats» другого вида. Берём только наши режимы-объекты.
		let parsed: unknown
		try {
			parsed = JSON.parse(ret.value)
		} catch {
			return
		}
		if (!parsed || typeof parsed !== 'object') return

		const stats = parsed as Record<string, unknown>
		Object.values(GAME_TYPES).forEach((type) => {
			const value = stats[type]
			if (value && typeof value === 'object' && !Array.isArray(value)) {
				gameStats.value[type] = value as IGameStats[string]
			}
		})

		// One Way стал головоломкой с новыми уровнями под теми же номерами:
		// результаты старого режима к ним не относятся
		if (legacyOneWay) gameStats.value[GAME_TYPES.NO_WAY_BACK] = {}
	}

	return {
		gameType,
		setGameType,
		nextLevel,
		currentLevel,
		selectLevel,
		curGameStat,
		updateGameStat,
		gameEnd,
		reload,
		gameStats,
		loadData,
	}
})
