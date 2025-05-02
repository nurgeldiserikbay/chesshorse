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

import { LEVELS, GAME_TYPES } from '@/utils/conts'
import { copyArray } from '@/utils/helpers'

import { useAudio } from '@/composables/useAudio'

import { useGameSettings } from '@/store/gameSettings'
import { useGameStore } from '@/store/gameStore'
import { useAdsStore } from '@/store/adsStore'

import HeadMain from '@/components/HeadMain.vue'
import BoardTable from '@/components/BoardTable.vue'
import ResultTable from '@/components/ResultTable.vue'

import Admob from '@/utils/admob'

const gameSettings = useGameSettings()
const { currentLevel, curGameStat, updateGameStat, reload, gameType } = toRefs(
	useGameStore()
)
const adsStore = useAdsStore()
const { playAudio } = useAudio()

const game = ref<Game>()
const possibleMoves = ref<number[][]>([])
const isTimeEnd = ref(false)
const board = reactive<{ value: TypeBoard | null }>({
	value: null,
})
const horsePos = ref([0, 0])

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

	updatePossibleMoves()
}

function clearBoard(board: TypeBoard) {
	return board.map((row) =>
		row.map((col) => {
			if ((col.type = BOARD_ITEM.pill)) col.type = BOARD_ITEM.cell

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
	<HeadMain :isGameEnd="isGameEnd" :settings="true" @timeend="timeend" />
	<div class="page playground-page">
		<div v-if="isGameEnd" class="playground-page__overlay">
			<ResultTable
				class="playground-page__table"
				:showTime="isFirstType"
				@reload="reloadGame"
			/>
		</div>
		<BoardTable
			v-if="!adsStore.loading && board.value"
			:board="board.value"
			:possibleMoves="possibleMoves"
			:horsePos="horsePos"
			:canToBack="!isSecondType"
			@move="move"
		/>
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
	</div>
</template>

<style lang="scss" scoped>
.playground-page {
	position: relative;
	overflow: visible;

	&__overlay {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		z-index: 1000;
		background: rgba(0, 0, 0, 0.3);
		background: radial-gradient(
			circle,
			rgba(83, 101, 210, 0.9) 0%,
			rgba(3, 34, 110, 0.9) 100%
		);
		display: flex;
		justify-content: center;
		align-items: flex-start;
		padding-top: 5px;
	}

	.loading {
		width: 100%;
		height: 100%;
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
