<script setup lang="ts">
import {
	ref,
	computed,
	reactive,
	watch,
	toRefs,
	onMounted,
	onBeforeUnmount,
} from 'vue'
import { Capacitor } from '@capacitor/core'

import { TypeBoard } from '@/game/types'
import { Game } from '@/game/game'
import { BOARD_ITEM } from '@/game/consts'
import { calcMovesPar, starThresholds, starsForMoves } from '@/game/par'
import {
	SweetKind,
	SWEET_POINTS,
	MAX_COMBO,
	pickSweet,
	seededRandom,
	cellKey,
} from '@/game/sweets'

import { LEVELS, GAME_TYPES } from '@/utils/conts'
import { copyArray } from '@/utils/helpers'

import { useAudio } from '@/composables/useAudio'

import { useGameSettings } from '@/store/gameSettings'
import { useGameStore } from '@/store/gameStore'
import { useAdsStore } from '@/store/adsStore'

import HeadMain from '@/components/HeadMain.vue'
import BoardTable from '@/components/BoardTable.vue'
import ResultTable from '@/components/ResultTable.vue'
import AdSlot from '@/components/AdSlot.vue'
import OtherGames from '@/components/OtherGames.vue'

import Admob from '@/utils/admob'

import SweetIcon from '@/components/SweetIcon.vue'
import starFullImg from '@/assets/img/game/star-full.webp'
import starEmptyImg from '@/assets/img/game/star-empty.webp'

const gameSettings = useGameSettings()
const { currentLevel, curGameStat, updateGameStat, reload, gameType } = toRefs(
	useGameStore()
)
const adsStore = useAdsStore()

const isOtherGames = ref(false)
const { playAudio } = useAudio()

const game = ref<Game>()
const possibleMoves = ref<number[][]>([])
const isTimeEnd = ref(false)
const board = reactive<{ value: TypeBoard | null }>({
	value: null,
})
const horsePos = ref([0, 0])
const totalCoins = ref(0)
const movesPar = ref<number | null>(null)

// Сладости на клетках, очки и серия. Раскладка уровня детерминирована.
const sweets = ref<Record<string, SweetKind>>({})
const score = ref(0)
const combo = ref(0)
const popups = ref<
	{ id: number; row: number; col: number; points: number; combo: number }[]
>([])
let popupId = 0

// Счёт на панели «докручивается» до настоящего, а не прыгает.
const shownScore = ref(0)
let scoreRaf = 0
watch(score, (to) => {
	cancelAnimationFrame(scoreRaf)
	const from = shownScore.value
	if (to <= from) {
		shownScore.value = to
		return
	}
	const startAt = performance.now()
	const step = (now: number) => {
		const t = Math.min(1, (now - startAt) / 400)
		shownScore.value = Math.round(from + (to - from) * t)
		if (t < 1) scoreRaf = requestAnimationFrame(step)
	}
	scoreRaf = requestAnimationFrame(step)
})

const pillCounts = computed(() => {
	return game.value?.board?.board?.reduce((acc, r) => {
		acc += r.reduce((acc2, c) => {
			if (c.type === BOARD_ITEM.pill) {
				acc2 += 1
			}

			return acc2
		}, 0)
		return acc
	}, 0)
})

const coinsProgress = computed(() => {
	if (!totalCoins.value) return 0
	return ((totalCoins.value - (pillCounts.value || 0)) / totalCoins.value) * 100
})

const moves = computed(() => curGameStat.value?.moves || 0)

const stars = computed(() => starsForMoves(moves.value, movesPar.value))

// Порог, который ещё можно удержать: «≤ 47 moves» на три звезды, потом на две.
const starsGoal = computed(() => {
	if (movesPar.value === null) return null
	const t = starThresholds(movesPar.value)
	if (stars.value === 3) return t.three
	if (stars.value === 2) return t.two
	return null
})

const resultTitle = computed(() => {
	if (isThirdType.value) return "Time's Up!"
	if (isSecondType.value && pillCounts.value) return 'No Moves Left'
	return 'Level Complete!'
})

const isFirstType = computed(() => {
	return gameType.value === GAME_TYPES.COLLECT_ALL
})

const isSecondType = computed(() => {
	return gameType.value === GAME_TYPES.NO_WAY_BACK
})

const isThirdType = computed(() => {
	return gameType.value === GAME_TYPES.BY_TIME
})

const isGameEnd = computed(() => {
	if (isFirstType.value) {
		return !pillCounts.value
	} else if (isSecondType.value) {
		return !possibleMoves.value?.length
	} else if (isThirdType.value) {
		return isTimeEnd.value
	}
})

watch(
	() => gameSettings.showPossibleMoves,
	() => {
		updatePossibleMoves()
	}
)

watch(
	() => currentLevel.value,
	() => {
		initGame()
	},
	{
		immediate: true,
	}
)

onMounted(async () => {
	try {
		if (Capacitor.getPlatform() === 'android') {
			await Admob.showBanner()
		}
	} catch (error: any) {
		// console.log(error)
	}
})

onBeforeUnmount(async () => {
	if (Capacitor.getPlatform() === 'android') {
		await Admob.removeBanner()
	}
})

function updatePossibleMoves() {
	possibleMoves.value =
		game.value?.horses[0]
			.getPossibleMoves()
			.filter((p) =>
				isSecondType.value
					? board.value && board.value[p[0]][p[1]].type === BOARD_ITEM.pill
					: true
			) || []
}

function move({ row, col }: { row: number; col: number }) {
	const is_coin = isCoin(game.value?.board?.board as TypeBoard, [row, col])
	const isMoved = game.value?.move(row, col, !isSecondType.value)

	if (isMoved) {
		collectSweet(row, col, is_coin)
		board.value = game.value?.board?.board?.map((r) => r) || []
		horsePos.value = [...(game.value?.horses[0]?.currentPos || [0, 0])]
		updatePossibleMoves()
		if (is_coin) {
			playAudio('pickupCoin')
		} else {
			playAudio('move')
		}

		if (curGameStat.value) {
			if (isThirdType.value) {
				if (is_coin) {
					if (!game.value) return
					game.value.board.setCoin()
					board.value = game.value?.board?.board
					assignNewSweets()
					updateGameStat.value(['moves'], {
						moves: curGameStat.value.moves + 1,
					})
				}
			} else {
				updateGameStat.value(['moves'], { moves: curGameStat.value.moves + 1 })
			}
		}
	} else {
		// console.log('wrong move!!!')
	}
}

function initGame() {
	let boardInit: TypeBoard

	if (isThirdType.value) {
		boardInit = clearBoard(
			copyArray(LEVELS[currentLevel.value || 0].board) as TypeBoard
		)
	} else {
		boardInit = copyArray(LEVELS[currentLevel.value || 0].board) as TypeBoard
	}

	horsePos.value = copyArray(LEVELS[currentLevel.value || 0].horsePos)
	board.value = boardInit
	game.value = new Game({
		board: boardInit,
		horsePos: [horsePos.value],
		usersCount: 1,
	})

	if (isThirdType.value) game.value.board.setCoin()

	sweets.value = {}
	score.value = 0
	shownScore.value = 0
	combo.value = 0
	popups.value = []
	assignNewSweets(seededRandom((currentLevel.value || 0) + 1))

	totalCoins.value = pillCounts.value || 0
	movesPar.value = isFirstType.value
		? calcMovesPar(boardInit, horsePos.value, (currentLevel.value || 0) + 1)
		: null
	updatePossibleMoves()
}

function collectSweet(row: number, col: number, isSweet: boolean) {
	if (!isSweet) {
		combo.value = 0
		return
	}
	combo.value = Math.min(combo.value + 1, MAX_COMBO)
	const points = SWEET_POINTS[sweets.value[cellKey(row, col)] || 'candy']
	const gained = points * combo.value
	score.value += gained
	updateGameStat.value(['score'], { score: score.value })

	const id = ++popupId
	popups.value.push({ id, row, col, points: gained, combo: combo.value })
	setTimeout(() => {
		popups.value = popups.value.filter((p) => p.id !== id)
	}, 900)
}

// Сладость каждой клетке с монетой, у которой её ещё нет: на старте уровня —
// по сиду уровня, в Time Attack — случайно для каждой новой.
function assignNewSweets(rand: () => number = Math.random) {
	board.value?.forEach((r, ri) =>
		r.forEach((c, ci) => {
			const key = cellKey(ri, ci)
			if (c.type === BOARD_ITEM.pill && !sweets.value[key]) {
				sweets.value[key] = pickSweet(rand)
			} else if (c.type !== BOARD_ITEM.pill && sweets.value[key]) {
				delete sweets.value[key]
			}
		})
	)
}

function clearBoard(board: TypeBoard) {
	return board.map((row) =>
		row.map((col) => {
			if (col.type === BOARD_ITEM.pill) col.type = BOARD_ITEM.cell

			return col
		})
	)
}

function isCoin(board: TypeBoard, point: [number, number]): boolean {
	if (
		board[point[0]] &&
		board[point[0]][point[1]] &&
		board[point[0]][point[1]].type === BOARD_ITEM.pill
	)
		return true
	return false
}

function reloadGame() {
	isTimeEnd.value = false
	initGame()
	reload.value()
}

function timeend() {
	isTimeEnd.value = true
}
</script>

<template>
	<div class="page playground-page">
		<HeadMain :isGameEnd="isGameEnd" :settings="true" @timeend="timeend" />
		<div v-if="isGameEnd" class="playground-page__overlay">
			<ResultTable
				class="playground-page__table"
				:showTime="isFirstType"
				:title="resultTitle"
				:stars="isFirstType ? stars : null"
				:goal="isFirstType && stars < 3 ? movesPar : null"
				@reload="reloadGame"
			/>
		</div>
		<BoardTable
			v-if="!adsStore.loading && board.value"
			:board="board.value"
			:possibleMoves="possibleMoves"
			:horsePos="horsePos"
			:canToBack="!isSecondType"
			:sweets="sweets"
			:popups="popups"
			@move="move"
		/>
		<div v-if="!adsStore.loading && board.value" class="coins-panel">
			<SweetIcon class="coins-panel__coin" kind="cupcake" />
			<span v-if="combo > 1" :key="combo" class="coins-panel__combo"
				>Combo ×{{ combo }}</span
			>
			<div class="coins-panel__body">
				<div class="coins-panel__top">
					<div class="coins-panel__label">
						Score
						<b :key="score" class="coins-panel__score">{{ shownScore }}</b>
					</div>
					<div v-if="movesPar !== null" class="coins-panel__stars">
						<img
							v-for="i in 3"
							:key="i"
							:src="i <= stars ? starFullImg : starEmptyImg"
							alt=""
						/>
						<span v-if="starsGoal !== null" class="coins-panel__goal"
							>≤ {{ starsGoal }}</span
						>
					</div>
				</div>
				<div v-if="!isThirdType" class="coins-panel__progress">
					<div class="coins-panel__bar">
						<div
							class="coins-panel__fill"
							:style="{ width: `${coinsProgress}%` }"
						></div>
					</div>
					<span class="coins-panel__left">{{ pillCounts }} left</span>
				</div>
			</div>
		</div>
		<div v-if="adsStore.loading" class="loading">
			<span>L</span>
			<span>o</span>
			<span>a</span>
			<span>d</span>
			<span>i</span>
			<span>n</span>
			<span>g</span>
			<span>.</span>
			<span>.</span>
			<span>.</span>
		</div>

		<AdSlot :interactive="isGameEnd" @open="isOtherGames = true" />

		<OtherGames v-if="isOtherGames" @close="isOtherGames = false" />
	</div>
</template>

<style lang="scss" scoped>
.playground-page {
	padding-top: 40px;
	/* Низ отдан рекламной зоне: в ней либо баннер, либо кросс-промо, но пустой
	   она не бывает. Раньше объявление приходило поверх доски. */
	padding-bottom: var(--ad-band);
	position: relative;
	overflow: visible;
	display: flex;
	flex-direction: column;

	&__overlay {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		z-index: 1000;
		background: rgba(16, 23, 61, 0.55);
		display: flex;
		justify-content: center;
		align-items: center;
		padding: 30px 0 var(--ad-band);
		box-sizing: border-box;
	}

	/* Нижняя панель как в макете: светлая карточка в золотой рамке */
	.coins-panel {
		flex: none;
		width: 100%;
		max-width: 460px;
		margin: 12px auto 12px;
		box-sizing: border-box;
		display: flex;
		align-items: center;
		gap: 10px;
		padding: 8px 12px 10px 8px;
		background: #fcf3e5;
		border: 4px solid #fecb23;
		border-radius: 16px;
		box-shadow: inset 0 0 0 2px #fff, 0 0 0 3px #1a1033, 0 6px 0 3px #1a1033;
		position: relative;

		&__coin {
			width: 52px;
			height: 52px;
			flex: none;
		}

		&__body {
			flex: 1 1 auto;
			min-width: 0;
			display: flex;
			flex-direction: column;
			gap: 6px;
		}

		&__top {
			display: flex;
			align-items: center;
			justify-content: space-between;
			gap: 8px;
		}

		&__label {
			display: flex;
			align-items: center;
			gap: 6px;
			color: #2a2457;
			font-weight: 800;
			font-size: 15px;
			white-space: nowrap;
		}

		/* :key на счёте перезапускает «подпрыгивание» при каждом начислении */
		&__score {
			display: inline-block;
			min-width: 52px;
			color: #f5a400;
			font-size: 24px;
			-webkit-text-stroke: 1px #1a1033;
			font-variant-numeric: tabular-nums;
			animation: bump 0.3s ease-out;
		}

		/* Серия висит над панелью, чтобы не теснить строку счёта */
		&__combo {
			position: absolute;
			top: -16px;
			left: 14px;
			padding: 1px 10px;
			border: 2px solid #1a1033;
			border-radius: 999px;
			background: #ff4f93;
			color: #fff;
			font-size: 14px;
			animation: bump 0.3s ease-out;
		}

		&__progress {
			display: flex;
			align-items: center;
			gap: 8px;
		}

		&__left {
			flex: none;
			color: #5b5788;
			font-size: 13px;
			font-weight: 800;
		}

		&__stars {
			display: flex;
			align-items: center;
			gap: 1px;
			flex: none;

			img {
				width: 24px;
				height: 24px;
			}
		}

		&__goal {
			margin-left: 4px;
			padding: 1px 8px;
			border-radius: 999px;
			background: #ece2f7;
			color: #2a2457;
			font-weight: 800;
			font-size: 14px;
			white-space: nowrap;
		}

		&__bar {
			flex: 1 1 auto;
			height: 14px;
			border-radius: 8px;
			background: #6d84a6;
			border: 2px solid #1a1033;
			overflow: hidden;
		}

		&__fill {
			height: 100%;
			border-radius: 6px;
			background: linear-gradient(180deg, #ffe680 0%, #fecb23 55%, #f5a400 100%);
			box-shadow: inset 0 2px 0 rgba(255, 255, 255, 0.6);
			transition: width 0.3s ease-out;
		}
	}

	.loading {
		width: 100%;
		flex: 1 1 auto;
		display: flex;
		justify-content: center;
		align-items: center;
		font-size: 24px;
		color: #fff;
		letter-spacing: 4px;

		span {
			animation: toggle 1.5s linear infinite;

			&:nth-child(1) {
				animation-delay: 0.1s;
			}

			&:nth-child(2) {
				animation-delay: 0.2s;
			}

			&:nth-child(3) {
				animation-delay: 0.3s;
			}

			&:nth-child(4) {
				animation-delay: 0.4s;
			}

			&:nth-child(5) {
				animation-delay: 0.5s;
			}

			&:nth-child(6) {
				animation-delay: 0.6s;
			}

			&:nth-child(7) {
				animation-delay: 0.7s;
			}

			&:nth-child(8) {
				animation-delay: 0.8s;
			}

			&:nth-child(9) {
				animation-delay: 0.9s;
			}

			&:nth-child(10) {
				animation-delay: 1s;
			}
		}
	}
}

@keyframes bump {
	0% {
		transform: scale(1);
	}
	40% {
		transform: scale(1.3);
	}
	100% {
		transform: scale(1);
	}
}

@keyframes toggle {
	0% {
		opacity: 1;
	}

	50% {
		opacity: 0;
	}

	100% {
		opacity: 1;
	}
}
</style>
