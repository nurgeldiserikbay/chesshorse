<script lang="ts" setup>
import { ref, computed, onBeforeUnmount } from 'vue'

import IconLock from '@/assets/img/lock.svg'

import { LEVELS, PAGES, GAME_TYPES } from '@/utils/conts'

import HeadMain from '@/components/HeadMain.vue'

import { usePageStore } from '@/store/pageStore'
import { useGameStore } from '@/store/gameStore'

const { routeTo } = usePageStore()
const gameStore = useGameStore()

// Без деструктуризации: она снимает снимок стора, и загруженная позже
// статистика на экран уровней уже не попадала.
const gameType = computed(() => gameStore.gameType)
const levelStat = computed(
	() => (level: number) =>
		gameType.value ? gameStore.gameStats[gameType.value]?.[level] : undefined
)

const isLevelActive = computed(() => (level: number) => {
	return (
		level === 0 || !!gameStore.gameStats[GAME_TYPES.COLLECT_ALL]?.[level - 1]
	)
})

const modalActive = ref(false)
let timerId: ReturnType<typeof setTimeout>

function clickLevel(levelInd: number) {
	if (!isLevelActive.value(levelInd)) {
		modalActive.value = true
		if (timerId) clearTimeout(timerId)
		timerId = setTimeout(() => {
			modalActive.value = false
		}, 1500)
	} else {
		gameStore.selectLevel(levelInd)
		routeTo(PAGES.PLAYGROUND)
	}
}

onBeforeUnmount(() => {
	if (timerId) clearTimeout(timerId)
})
</script>

<template>
	<HeadMain :settings="false" />
	<div class="page levels-page">
		<div v-show="modalActive" class="levels-page__modal">
			This level has not yet been opened. You must complete the previous level
			in classic
		</div>
		<div class="levels-page__list">
			<button
				v-for="level in LEVELS"
				:key="level.level"
				class="levels-page__item level"
				:class="{ 'level--disaled': !isLevelActive(level.level) }"
				@click="clickLevel(level.level)"
			>
				<div class="level__img">
					<span class="level__row level__row--level">{{
						level.level + 1
					}}</span>
					<!-- <img :src="`./img/levels/${level.img}.png`" alt="" /> -->
				</div>
				<IconLock v-if="!isLevelActive(level.level)" class="level__icon" />
				<div v-else-if="levelStat(level.level)" class="level__info">
					<div class="level__stat">
						<span
							v-if="gameType === GAME_TYPES.COLLECT_ALL"
							class="level__row level__row--small"
							><span>{{ levelStat(level.level)?.time }}</span></span
						>
						<span class="level__row level__row--small">
							<span>&#9679 {{ levelStat(level.level)?.moves }}</span></span
						>
					</div>
				</div>
			</button>
		</div>
	</div>
</template>

<style lang="scss" scoped>
.levels-page {
	position: relative;

	&__modal {
		position: fixed;
		left: 50%;
		bottom: 120px;
		z-index: 1000;
		text-align: center;
		transform: translateX(-50%);
		width: 90%;
		max-width: 280px;
		color: #fff;
		padding: 12px 25px;
		background: radial-gradient(
			circle,
			rgb(210, 45, 59) 0%,
			rgb(237, 30, 30) 60%
		);
		box-sizing: border-box;

		@media screen and (max-width: 380px) {
			font-size: 12px;
			padding: 8px 15px;
			bottom: 80px;
		}
	}

	&__list {
		width: 100%;
		display: flex;
		justify-content: space-around;
		flex-wrap: wrap;
		gap: 25px;
		align-items: stretch;
		padding-bottom: 30px;

		@media screen and (max-width: 780px) {
			gap: 15px;
			justify-content: space-around;
		}

		@media screen and (max-width: 380px) {
			gap: 10px;
		}
	}

	.level {
		position: relative;
		width: 104px;
		border-radius: 14px;
		box-sizing: border-box;
		box-shadow: inset 0 4px 0 rgba(255, 255, 255, 0.45), 0 5px 0 #1a1033;
		transition: transform 0.12s ease, box-shadow 0.12s ease,
			background 0.12s ease;
		display: flex;
		flex-direction: column;
		justify-content: space-between;
		align-items: center;
		/* Открытый уровень — светлая плитка доски, закрытый — тёмная */
		background: linear-gradient(180deg, #c3cbfa 0%, #8f9cf0 100%);
		border: 3px solid #1a1033;
		height: 124px;
		padding: 0;
		overflow: hidden;

		&:hover {
			transform: translateY(-2px);
		}

		&:active {
			transform: translateY(3px);
			box-shadow: inset 0 4px 0 rgba(255, 255, 255, 0.45), 0 2px 0 #1a1033;
		}

		&--disaled {
			cursor: auto;
			background: linear-gradient(180deg, #5a6cc8 0%, #3a4a9e 100%);
			box-shadow: inset 0 4px 0 rgba(255, 255, 255, 0.15), 0 5px 0 #1a1033;

			&:hover,
			&:active {
				transform: none;
			}
		}

		&__img {
			position: relative;
			max-width: 100%;
			align-items: flex-start;
			display: flex;
			margin-top: 5px;

			img {
				max-width: 50%;
				height: auto;
				display: block;
			}
		}

		&__icon {
			width: 26px;
			height: 26px;
			margin-bottom: 22px;
			filter: brightness(0) invert(0.85) sepia(0.3) hue-rotate(190deg);
		}

		&__info {
			display: flex;
			flex-direction: column;
			align-items: center;
			width: 100%;
			box-sizing: border-box;
			background: #fcf3e5;
			border-top: 3px solid #1a1033;
			color: #2a2457;
			padding: 5px 0;
			white-space: no-wrap;
			overflow: hidden;
			font-weight: 600;
		}

		&__row {
			width: 100%;
			display: flex;
			justify-content: center;
			gap: 8px;
			text-align: center;

			&--small {
				font-size: 14px;

				&:first-child {
					margin-bottom: 2px;
				}

				span {
					&:last-child {
						color: #2a2457;
					}
				}
			}

			&--level {
				width: 100%;
				font-size: 32px;
				text-align: center;
				font-weight: 800;
				color: #fff;
				display: none;
				text-shadow: 2px 0 0 #1a1033, -2px 0 0 #1a1033, 0 2px 0 #1a1033,
					0 -2px 0 #1a1033, 0 4px 0 #1a1033;
			}
		}

		&__img .level__row--level,
		&--disaled .level__row--level {
			display: block;
		}

		&__stat {
			display: flex;
			justify-content: center;
			align-items: center;
			flex-wrap: wrap;
			gap: 0 18px;
			text-align: center;
		}

		&__stat &__row {
			flex-grow: 1;
		}
	}
}
</style>
