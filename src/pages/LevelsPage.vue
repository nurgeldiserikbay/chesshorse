<script lang="ts" setup>
import { ref, computed, onBeforeUnmount } from 'vue'

import IconLock from '@/assets/img/lock.svg'

import { LEVELS, PAGES, GAME_TYPES } from '@/utils/conts'

import HeadMain from '@/components/HeadMain.vue'

import { usePageStore } from '@/store/pageStore'
import { useGameStore } from '@/store/gameStore'

const { routeTo } = usePageStore()
const { gameType, gameStats, selectLevel } = useGameStore()

const isLevelActive = computed(() => (level: number) => {
	return level === 0 || gameStats[GAME_TYPES.COLLECT_ALL][level - 1]
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
		selectLevel(levelInd)
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
				<div
					v-else-if="gameType && gameStats[gameType][level.level]"
					class="level__info"
				>
					<div
						v-if="gameType && gameStats[gameType][level.level]"
						class="level__stat"
					>
						<span
							v-if="gameType === GAME_TYPES.COLLECT_ALL"
							class="level__row level__row--small"
							><span>{{ gameStats[gameType][level.level].time }}</span></span
						>
						<span class="level__row level__row--small">
							<span>&#9679 {{ gameStats[gameType][level.level].moves }}</span></span
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
		border-radius: 10px;
		box-sizing: border-box;
		background: linear-gradient(180deg, var(--tile-1), var(--tile-2));
		box-shadow: inset 2px 2px 4px rgba(0, 0, 0, 0.55),
			inset -2px -2px 4px rgba(255, 255, 255, 0.05),
			4px 4px 30px rgba(0, 0, 0, 0.6);
		transition: transform 0.12s ease, box-shadow 0.12s ease,
			background 0.12s ease;
		display: flex;
		flex-direction: column;
		justify-content: space-between;
		align-items: center;
		background: #0f0826;
		border: 2px solid #1c0f37;
		height: 124px;
		padding: 0;

		&:hover {
			transform: translateY(-1px);
			box-shadow:
				0 0 4px #ffcc33,
				0 0 5px rgba(255, 204, 51, 0.9),
				0 0 10px rgba(255, 204, 51, 0.7);
			border: 2px solid #ffcc33;
		}

		&--disaled {
			cursor: auto;
		}

		&:after {
			content: '';
			position: absolute;
			left: 0;
			top: 0;
			bottom: 0;
			right: 0;
			z-index: -1;
			background: rgba(0, 0, 0, 0.8);
			opacity: 0;
		}

		&--disaled:after {
			opacity: 1;
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
			width: 24px;
			height: 24px;
			margin-bottom: 24px;
		}

		&__info {
			display: flex;
			flex-direction: column;
			align-items: center;
			width: 96%;
			margin: 0 2px 2px;
			box-sizing: border-box;
			background: #231618;
			border: 2px solid #362528;
			color: #fff;
			padding: 5px 0;
			border-top-left-radius: 6px;
			border-top-right-radius: 6px;
			border-bottom-left-radius: 10px;
			border-bottom-right-radius: 10px;
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
						color: #fecb23;
					}
				}
			}

			&--level {
				width: 100%;
				font-size: 32px;
				text-align: center;
				color: #fecb23;
				display: none;
				text-shadow: #aa1e05 0 0 25px;
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
