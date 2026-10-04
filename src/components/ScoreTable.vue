<template>
	<div class="score-table">
		<div v-if="!isSecondType" class="score-table__time">
			<svg class="score-table__watch" viewBox="0 0 40 44" aria-hidden="true">
				<rect x="15" y="1" width="10" height="6" rx="2" fill="#fecb23" stroke="#1a1033" stroke-width="2.5" />
				<path d="M31 9l4 4" stroke="#1a1033" stroke-width="5" stroke-linecap="round" />
				<path d="M31 9l4 4" stroke="#fecb23" stroke-width="2" stroke-linecap="round" />
				<circle cx="20" cy="25" r="16" fill="#fecb23" stroke="#1a1033" stroke-width="3" />
				<circle cx="20" cy="25" r="11.5" fill="#fffbe9" stroke="#1a1033" stroke-width="2" />
				<path d="M20 25V17M20 25l5 3" stroke="#1a1033" stroke-width="2.5" stroke-linecap="round" />
			</svg>
			<span class="score-table__time-value">{{ timeValue }}</span>
		</div>
		<div class="score-table__move">
			<span v-if="isFirstType">Moves:</span>
			<span v-else>Sweets:</span>
			<span v-if="gameStore.curGameStat" class="score-table__move--value">{{
				gameStore.curGameStat.moves
			}}</span>
		</div>
	</div>
</template>

<script lang="ts" setup>
import { ref, computed, watch, onBeforeUnmount } from 'vue'
import { Capacitor } from '@capacitor/core'

import { GAME_TYPES } from '@/utils/conts'

import { useGameStore } from '@/store/gameStore'

import Admob from '@/utils/admob'

const $props = defineProps<{
	isGameEnd?: boolean
}>()

const $emits = defineEmits(['timeend'])

const gameStore = useGameStore()

const MS_HOUR = 60 * 60 * 10
const MS_MIN = 60 * 10
const MS_SEC = 10

let timerId: ReturnType<typeof setInterval> | undefined

const date = ref(0)

const timeValue = ref('')

const isFirstType = computed(() => {
	return gameStore.gameType === GAME_TYPES.COLLECT_ALL
})

const isSecondType = computed(() => {
	return gameStore.gameType === GAME_TYPES.NO_WAY_BACK
})

const isThirdType = computed(() => {
	return gameStore.gameType === GAME_TYPES.BY_TIME
})

watch(
	() => gameStore.curGameStat,
	() => {
		if (!isSecondType.value) {
			// Реклама здесь была на старте партии: watch срабатывает с immediate,
			// то есть объявление выходило при входе на игровой экран, а таймер
			// запускался только после его закрытия. Google прямо называет это
			// недопустимым («unexpected full screen interstitial» в момент старта
			// уровня). Партия начинается без рекламы, показ перенесён на её конец.
			setTimerStart()
			createTimer()
		}
	},
	{ immediate: true }
)

watch(
	() => $props.isGameEnd,
	() => {
		if ($props.isGameEnd) {
			clearTimer()
			gameStore.gameEnd(timeValue.value)

			// Партия закончена, результат уже на экране — естественная пауза.
			// Показ ничего не ждёт и ничего не блокирует.
			if (Capacitor.getPlatform() === 'android') {
				Admob.interstitial({ onInterstitialAdClosed: () => {} })
			}
		}
	}
)

watch(
	() => date.value,
	() => {
		if (isThirdType.value && date.value === 0) {
			clearTimer()
			$emits('timeend')
		}
	}
)

onBeforeUnmount(() => {
	clearTimer()
})

function setTimerStart() {
	if (isThirdType.value) date.value = 300
	else date.value = 0
	setTimerValue()
}

function createTimer() {
	clearTimer()
	timerId = setInterval(() => {
		date.value += isThirdType.value ? -1 : 1
		setTimerValue()

		if ($props.isGameEnd) {
			clearTimer()
			gameStore.gameEnd(timeValue.value)
		}
	}, 100)
}

function setTimerValue() {
	let reminder = date.value
	const h = Math.floor(date.value / MS_HOUR)
	reminder = reminder % MS_HOUR
	const m = Math.floor(reminder / MS_MIN)
	reminder = reminder % MS_MIN
	const s = Math.floor(reminder / MS_SEC)
	const ms = reminder % MS_SEC

	timeValue.value = `${h ? `${addZero(h)} : ` : ''}${
		m ? `${addZero(m)} : ` : ''
	}${addZero(s)} : ${addZero(ms)}`
}

function clearTimer() {
	if (timerId) clearInterval(timerId)
}

function addZero(num: number) {
	if (!num) return `00`
	else if (num < 10) return `0${num}`
	else return `${num}`
}
</script>

<style lang="scss" scoped>
/* Плашка как в макете: синяя, в золотой рамке; время сверху, ходы — во
   вложенной тёмной «таблетке». Жёсткая тень снизу вместо размытой. */
.score-table {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 4px;
	min-width: 0;
	padding: 4px 14px 6px;
	background: #124490;
	border: 3px solid #fecb23;
	border-radius: 14px;
	box-shadow: 0 4px 0 #1a1033;

	&__time {
		display: flex;
		align-items: center;
		gap: 8px;
		color: #fff;
		font-weight: 800;
		font-size: 24px;
		line-height: 1.1;
	}

	&__watch {
		width: 26px;
		height: 29px;
		flex: none;
	}

	&__time-value {
		white-space: nowrap;
		font-variant-numeric: tabular-nums;
	}

	&__move {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 6px;
		padding: 1px 16px;
		background: #0a366e;
		border-radius: 999px;
		color: #fff;
		font-weight: 700;
		font-size: 16px;
		white-space: nowrap;

		&--value {
			color: #ffd54f;
			font-weight: 800;
		}
	}
}
</style>
