<template>
	<div class="result-table">
		<div class="result-table__modal-head">
			<div class="title result-table__head">Game End</div>
		</div>
		<div class="result-table__body">
			<div class="result-table__values">
				<div v-if="showTime" class="result-table__time">
					<span>Time:</span>
					<span>{{ gameStore.curGameStat.time }}</span>
				</div>
				<div class="result-table__move">
					<span v-if="showTime">Moves:</span>
					<span v-else>Pills:</span>
					<span v-if="gameStore.curGameStat">{{
						gameStore.curGameStat.moves
					}}</span>
				</div>
			</div>
			<div class="result-table__controls">
				<button class="btn result-table__menu" @click="routeTo(PAGES.LEVELS)">
					<IconMenu />
				</button>
				<button class="btn result-table__reload" @click="reload">
					<IconReload />
				</button>
				<button
					v-if="nextLevel !== undefined"
					class="btn result-table__next"
					@click="next"
				>
					<IconNext />
				</button>
			</div>
		</div>
	</div>
</template>

<script lang="ts" setup>
import { toRefs } from 'vue'

import { PAGES } from '@/utils/conts'

import IconMenu from '@/assets/img/menu.svg'
import IconReload from '@/assets/img/reload.svg'
import IconNext from '@/assets/img/next.svg'

import { usePageStore } from '@/store/pageStore'
import { useGameStore } from '@/store/gameStore'

const { routeTo } = usePageStore()

defineProps<{
	showTime: boolean
}>()

const $emits = defineEmits(['reload'])

const gameStore = useGameStore()
const { nextLevel, selectLevel } = toRefs(useGameStore())

function reload() {
	$emits('reload')
}

function next() {
	if (nextLevel.value === undefined) return
	selectLevel.value(nextLevel.value)
}
</script>

<style lang="scss" scoped>
.result-table {
	position: relative;
	inset: 0;
	margin: auto;
	width: min(92vw, 440px);
	background: radial-gradient(
		120% 120% at 20% 10%,
		var(--panel-2) 0%,
		var(--panel-1) 60%
	);
	color: var(--ink);
	border-radius: 18px;
	box-shadow: 0 12px 28px rgba(0, 0, 0, 0.55),
		inset 2px 2px 6px rgba(0, 0, 0, 0.55),
		inset -2px -2px 6px rgba(255, 255, 255, 0.06);
	padding: 16px 16px 12px;
	transform: translateY(6px);
	animation: pop 0.22s ease-out forwards;

	&__modal-head {
		padding: 15px 18px;
		display: flex;
		justify-content: center;
		align-items: center;
	}

	&__head {
		font-size: 25px;
		font-weight: 600;
		line-height: 1;
		text-align: center;
		color: #ffd54f;
		text-shadow: 0 0 10px rgba(255, 213, 79, 0.45);
		text-transform: uppercase;
	}

	&__body {
		padding: 20px 30px 35px;
	}

	&__values {
		display: flex;
		flex-direction: column;
		gap: 15px;
		font-size: 1.4rem;
		margin-bottom: 45px;
		color: #fff;
	}

	&__time,
	&__move {
		display: flex;
		justify-content: space-between;

		span {
			&:last-child {
				color: #fecb23;
			}
		}
	}

	&__controls {
		display: flex;
		justify-content: center;
		gap: 30px;
		margin-top: 25px;
		margin-bottom: 15px;
		padding: 0 22px;

		button {
			width: 54px;
			height: 54px;
			border: none;
			border-radius: 12px;
			background: #1d1036;
			display: flex;
			justify-content: center;
			align-items: center;
			cursor: pointer;
			box-shadow: 4px 4px 10px rgba(0, 0, 0, 0.6),
				-4px -4px 10px rgba(255, 255, 255, 0.05),
				inset 0 2px 0 0 rgba(255, 255, 255, 0.1),
				inset 0 -2px 0 0 rgba(0, 0, 0, 0.1);
			cursor: pointer;

			&:nth-child(1) {
				border-radius: 12px 8px 19px 4px;
			}

			&:nth-child(2) {
				border-radius: 5px 8px 16px 11px;
			}

			&:nth-child(3) {
				border-radius: 12px 8px 16px 11px;
			}

			svg {
				fill: #fecb23;
				width: 35px;
				height: 35px;

				@media screen and (max-width: 780px) {
					width: 25px;
					height: 25px;
				}
			}
		}
	}

	&__time,
	&__move {
		display: flex;
		gap: 8px;

		span {
			&:last-child {
				min-width: 80px;
				text-align: center;
				overflow: hidden;
				text-overflow: ellipsis;
				white-space: nowrap;

				@media screen and (max-width: 780px) {
					min-width: unset;
				}
			}
		}
	}
}
</style>
