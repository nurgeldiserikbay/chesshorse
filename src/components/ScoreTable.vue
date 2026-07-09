<template>
	<div class="score-table">
		<div v-if="!isSecondType" class="score-table__time">
			<span class="score-table__time-value">{{ timeValue }}</span>
		</div>
		<div class="score-table__move">
			<span v-if="isFirstType">Moves:</span>
			<span v-else>Pills:</span>
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
import { useAdsStore } from '@/store/adsStore'

import Admob from '@/utils/admob'

const $props = defineProps<{
	isGameEnd?: boolean
}>()

const $emits = defineEmits(['timeend'])

const gameStore = useGameStore()
const adsStore = useAdsStore()

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
			setTimerStart()
			if (Capacitor.getPlatform() === 'android') {
				adsStore.toggleLoading(true)
				Admob.interstitial({
					isFirst: false,
					onInterstitialAdClosed: () => {
						adsStore.toggleLoading(false)
						createTimer()
					},
				})
			} else {
				createTimer()
			}
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
.score-table {
	display: flex;
	align-items: center;
	gap: 25px;

	@media screen and (max-width: 520px) {
		justify-content: center;
		flex-direction: column;
		gap: 0px 15px;
		flex-wrap: wrap;
	}

	&__time,
	&__move {
		display: flex;
		align-items: center;
		font-weight: 600;
		font-size: 18px;
		gap: 5px;
		color: #fff;

		span {
			&:last-child {
				text-align: center;
				overflow: hidden;
				text-overflow: ellipsis;
				white-space: nowrap;

				@media screen and (max-width: 780px) {
					min-width: unset;
				}
			}
		}

		&--value {
			color: #dc1c2c;
		}
	}

	&__time-value {
		width: 140px;
	}
}
</style>
