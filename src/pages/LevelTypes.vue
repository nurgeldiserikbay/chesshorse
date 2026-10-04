<script lang="ts" setup>
import { PAGES, GAME_TYPE, GAME_TYPES } from '@/utils/conts'

import HeadMain from '@/components/HeadMain.vue'

import { useGameStore } from '@/store/gameStore'
import { usePageStore } from '@/store/pageStore'

import crownImg from '@/assets/img/game/items/crown.webp'
import signpostImg from '@/assets/img/game/map/signpost.webp'
import stopwatchImg from '@/assets/img/game/ui/stopwatch.webp'

const gameStore = useGameStore()
const { routeTo } = usePageStore()

const MODES: {
	type: GAME_TYPE
	title: string
	desc: string
	icon: string
	color: string
}[] = [
	{
		type: GAME_TYPES.COLLECT_ALL,
		title: 'Classic',
		desc: 'Collect every item, earn 3 stars',
		icon: crownImg,
		color: 'green',
	},
	{
		type: GAME_TYPES.NO_WAY_BACK,
		title: 'One Way',
		desc: 'Every move is final — no way back',
		icon: signpostImg,
		color: 'purple',
	},
	{
		type: GAME_TYPES.BY_TIME,
		title: 'Time Attack',
		desc: 'Collect as many as you can in time',
		icon: stopwatchImg,
		color: 'blue',
	},
]

function clickOnType(type: GAME_TYPE) {
	gameStore.setGameType(type)
	routeTo(PAGES.LEVELS)
}
</script>

<template>
	<HeadMain :settings="false" />
	<div class="page level-types-page">
		<h1 class="level-types-page__title">Select Mode</h1>
		<div class="level-types">
			<button
				v-for="(mode, i) in MODES"
				:key="mode.type"
				class="mode-card"
				:class="`mode-card--${mode.color}`"
				:style="{ animationDelay: `${i * 0.08}s` }"
				@click="clickOnType(mode.type)"
			>
				<img class="mode-card__icon" :src="mode.icon" alt="" />
				<span class="mode-card__text">
					<span class="mode-card__title">{{ mode.title }}</span>
					<span class="mode-card__desc">{{ mode.desc }}</span>
				</span>
			</button>
		</div>
	</div>
</template>

<style lang="scss" scoped>
.level-types-page {
	display: flex;
	flex-direction: column;
	align-items: center;

	&__title {
		margin: 0 0 22px;
		font-size: 34px;
		font-weight: 800;
		color: #fff;
		letter-spacing: 1px;
		text-shadow: 3px 0 0 #1a1033, -3px 0 0 #1a1033, 0 3px 0 #1a1033,
			0 -3px 0 #1a1033, 2px 2px 0 #1a1033, -2px -2px 0 #1a1033,
			2px -2px 0 #1a1033, -2px 2px 0 #1a1033, 0 6px 0 #1a1033;
	}
}

.level-types {
	width: 100%;
	max-width: 420px;
	display: flex;
	flex-direction: column;
	gap: 18px;
}

/* Карточка режима: иконка из набора, жёсткая обводка и тень */
.mode-card {
	display: flex;
	align-items: center;
	gap: 14px;
	width: 100%;
	min-height: 96px;
	padding: 10px 16px 10px 12px;
	box-sizing: border-box;
	border: 4px solid #1a1033;
	border-radius: 20px;
	font-family: inherit;
	text-align: left;
	cursor: pointer;
	box-shadow: inset 0 4px 0 rgba(255, 255, 255, 0.35), 0 6px 0 #1a1033;
	animation: card-in 0.4s ease-out backwards;
	transition: transform 0.12s ease;

	&:active {
		transform: translateY(4px);
		box-shadow: inset 0 4px 0 rgba(255, 255, 255, 0.35), 0 2px 0 #1a1033;
	}

	&--green {
		background: linear-gradient(180deg, #6fe36a 0%, #2fb24a 100%);
	}

	&--purple {
		background: linear-gradient(180deg, #a07cff 0%, #6a43d8 100%);
	}

	&--blue {
		background: linear-gradient(180deg, #5cb4ff 0%, #2a6fe0 100%);
	}

	&__icon {
		width: 72px;
		height: 72px;
		flex: none;
		object-fit: contain;
		filter: drop-shadow(0 3px 0 rgba(26, 16, 51, 0.4));
	}

	&__text {
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	&__title {
		font-size: 26px;
		font-weight: 800;
		color: #fff;
		letter-spacing: 1px;
		text-shadow: 2px 0 0 #1a1033, -2px 0 0 #1a1033, 0 2px 0 #1a1033,
			0 -2px 0 #1a1033, 0 4px 0 #1a1033;
	}

	&__desc {
		font-size: 14px;
		font-weight: 700;
		color: #fff;
		letter-spacing: 0.5px;
		line-height: 1.25;
		text-shadow: 0 2px 0 rgba(26, 16, 51, 0.6);
	}
}

@keyframes card-in {
	from {
		transform: translateY(20px);
		opacity: 0;
	}
	to {
		transform: translateY(0);
		opacity: 1;
	}
}
</style>
