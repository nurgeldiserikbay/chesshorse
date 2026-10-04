<template>
	<div class="result-table">
		<div class="result-table__ribbon">{{ title }}</div>
		<div v-if="stars !== null" class="result-table__stars">
			<img
				v-for="i in 3"
				:key="i"
				class="result-table__star"
				:class="[`result-table__star--${i}`, { 'is-on': i <= stars }]"
				:src="i <= stars ? starFullImg : starEmptyImg"
				alt=""
			/>
		</div>
		<SweetIcon v-else class="result-table__coin" kind="cupcake" />
		<div class="result-table__body">
			<div class="result-table__values">
				<div v-if="showTime" class="result-table__time">
					<span>Time</span>
					<span>{{ gameStore.curGameStat.time }}</span>
				</div>
				<div class="result-table__move">
					<span v-if="showTime">Moves</span>
					<span v-else>Sweets</span>
					<span v-if="gameStore.curGameStat">{{
						gameStore.curGameStat.moves
					}}</span>
				</div>
				<div class="result-table__move">
					<span>Score</span>
					<span>{{ gameStore.curGameStat?.score || 0 }}</span>
				</div>
				<div v-if="goal !== null" class="result-table__goal">
					<img :src="starFullImg" alt="" />×3 — no more than {{ goal }} moves
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
import SweetIcon from '@/components/SweetIcon.vue'
import starFullImg from '@/assets/img/game/star-full.webp'
import starEmptyImg from '@/assets/img/game/star-empty.webp'

import { usePageStore } from '@/store/pageStore'
import { useGameStore } from '@/store/gameStore'

const { routeTo } = usePageStore()

withDefaults(
	defineProps<{
		showTime: boolean
		title?: string
		// null — режим без звёзд (One Way, Time Attack)
		stars?: number | null
		// норма ходов на три звезды; показываем, если её не уложились
		goal?: number | null
	}>(),
	{ title: 'Game End', stars: null, goal: null }
)

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
/* Окно итогов в стиле игрового экрана: светлая карточка в золотой рамке,
   лента с заголовком, звёзды выскакивают по очереди. */
.result-table {
	position: relative;
	margin: auto;
	width: min(88vw, 380px);
	box-sizing: border-box;
	padding: 34px 18px 18px;
	background: #fcf3e5;
	border: 5px solid #fecb23;
	border-radius: 20px;
	box-shadow: inset 0 0 0 2px #fff, 0 0 0 4px #1a1033, 0 8px 0 4px #1a1033;
	color: #2a2457;
	animation: pop 0.28s ease-out both;

	&__ribbon {
		position: absolute;
		top: -26px;
		left: 50%;
		transform: translateX(-50%);
		padding: 8px 26px;
		white-space: nowrap;
		background: linear-gradient(180deg, #7c5ff0 0%, #5a3cc8 100%);
		border: 4px solid #1a1033;
		border-radius: 14px;
		box-shadow: inset 0 3px 0 rgba(255, 255, 255, 0.25), 0 4px 0 #1a1033;
		color: #fff;
		font-size: 22px;
		font-weight: 800;
		letter-spacing: 1px;
		text-shadow: 0 2px 0 #1a1033;
	}

	&__stars {
		display: flex;
		justify-content: center;
		align-items: flex-end;
		gap: 4px;
		margin: 8px 0 4px;
	}

	&__star {
		width: 64px;
		height: 64px;
		opacity: 0;
		animation: star-pop 0.35s ease-out forwards;

		/* средняя звезда крупнее и выше, как в «тройке» мобильных игр */
		&--2 {
			width: 84px;
			height: 84px;
			margin-bottom: 14px;
		}

		&--1 {
			animation-delay: 0.25s;
		}
		&--2 {
			animation-delay: 0.45s;
		}
		&--3 {
			animation-delay: 0.65s;
		}
	}

	&__coin {
		display: block;
		width: 76px;
		height: 76px;
		margin: 6px auto 4px;
		animation: star-pop 0.35s ease-out 0.2s both;
	}

	&__body {
		padding: 4px 6px 0;
	}

	&__values {
		display: flex;
		flex-direction: column;
		gap: 8px;
		margin-bottom: 20px;
	}

	&__time,
	&__move {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 6px 14px;
		background: #ece2f7;
		border-radius: 12px;
		font-size: 18px;
		font-weight: 700;

		span:last-child {
			font-size: 22px;
			font-weight: 800;
			color: #f5a400;
			-webkit-text-stroke: 1px #1a1033;
		}
	}

	&__goal {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 2px;
		font-size: 13px;
		font-weight: 700;
		color: #5b5788;

		img {
			width: 16px;
			height: 16px;
		}
	}

	&__controls {
		display: flex;
		justify-content: center;
		gap: 18px;

		button {
			width: 58px;
			height: 58px;
			padding: 0;
			border: 3px solid #1a1033;
			border-radius: 14px;
			background: linear-gradient(180deg, #7c5ff0 0%, #5a3cc8 100%);
			display: flex;
			justify-content: center;
			align-items: center;
			cursor: pointer;
			box-shadow: inset 0 3px 0 rgba(255, 255, 255, 0.25), 0 4px 0 #1a1033;

			&:active {
				transform: translateY(2px);
				box-shadow: inset 0 3px 0 rgba(255, 255, 255, 0.25), 0 2px 0 #1a1033;
			}

			svg {
				fill: #fecb23;
				width: 28px;
				height: 28px;
			}
		}

		/* «Дальше» — главное действие: золотая кнопка */
		.result-table__next {
			width: 76px;
			background: linear-gradient(180deg, #ffe680 0%, #fecb23 55%, #f5a400 100%);
			box-shadow: inset 0 3px 0 rgba(255, 255, 255, 0.5), 0 4px 0 #1a1033;

			svg {
				fill: #1a1033;
			}
		}
	}
}

@keyframes pop {
	from {
		transform: scale(0.8);
		opacity: 0;
	}
	to {
		transform: scale(1);
		opacity: 1;
	}
}

@keyframes star-pop {
	0% {
		transform: scale(0.2) rotate(-25deg);
		opacity: 0;
	}
	70% {
		transform: scale(1.2) rotate(6deg);
		opacity: 1;
	}
	100% {
		transform: scale(1) rotate(0);
		opacity: 1;
	}
}
</style>
