<script lang="ts" setup>
import { PAGES, GAME_TYPE, GAME_TYPES } from '@/utils/conts'

import HeadMain from '@/components/HeadMain.vue'

import { useGameStore } from '@/store/gameStore'
import { usePageStore } from '@/store/pageStore'

const gameStore = useGameStore()
const { routeTo } = usePageStore()

function clickOnType(type: GAME_TYPE) {
	gameStore.setGameType(type)
	routeTo(PAGES.LEVELS)
}
</script>

<template>
	<HeadMain :settings="false" />
	<div class="page level-types-page">
		<div class="level-types">
			<div class="level-type">
				<button
					class="level-type__title"
					@click="clickOnType(GAME_TYPES.COLLECT_ALL)"
				>
					<span>Classic</span>
				</button>
				<div class="level-type__desc">
					Collect all the tokens, progressing through levels in order
				</div>
			</div>
			<div class="level-type">
				<button
					class="level-type__title"
					@click="clickOnType(GAME_TYPES.NO_WAY_BACK)"
				>
					<span>One Way</span>
				</button>
				<div class="level-type__desc">
					Every move is final — there’s no way back
				</div>
			</div>
			<div class="level-type">
				<button
					class="level-type__title"
					@click="clickOnType(GAME_TYPES.BY_TIME)"
				>
					<span>Time Attack</span>
				</button>
				<div class="level-type__desc">
					Collect as many tokens as possible within the time limit
				</div>
			</div>
		</div>
	</div>
</template>

<style lang="scss" scoped>
.level-types-page {
	display: flex;
	flex-direction: column;
	justify-content: flex-start;
	align-items: center;
}

.level-types {
	display: flex;
	flex-direction: column;
	justify-content: space-around;
	align-items: center;
	max-height: 480px;
	flex-grow: 1;
}

.level-type {
	width: 80%;
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 12px;

	&__title {
		position: relative;
		padding: 12px 25px;
		font-size: 22px;
		font-weight: bold;
		color: #fff;
		display: flex;
		justify-content: center;
		align-items: center;
		text-align: center;
		outline: none;
		box-shadow: inset 0 0 8px 0 rgba(255, 255, 255, 0.5),
			0 5px 15px 0 rgba(0, 0, 0, 0.5);
		white-space: nowrap;
		letter-spacing: 2px;
		line-height: 1;
		cursor: pointer;
	}

	&:nth-child(1) &__title {
		border: 2px solid #ffffff55;
		background: #c10202;
		background: linear-gradient(
			25deg,
			rgba(231, 106, 106, 1) 0%,
			rgba(193, 2, 2, 1) 100%
		);
		border-radius: 15px 15px 15px 15px;
	}

	&:nth-child(2) &__title {
		border: 2px solid #ffffff55;
		background: #00c72b;
		background: linear-gradient(
			20deg,
			rgba(100, 244, 131, 1) 0%,
			rgba(0, 199, 43, 1) 100%
		);
		border-radius: 15px 15px 15px 15px;
	}

	&:nth-child(3) &__title {
		border: 2px solid #ffffff55;
		background: #192363;
		background: linear-gradient(
			35deg,
			rgba(130, 145, 241, 1) 0%,
			rgba(25, 35, 99, 1) 100%
		);
		border-radius: 15px 15px 15px 15px;
	}

	&__desc {
		width: 100%;
		background: rgba(0, 0, 0, 0.3);
		padding: 15px 18px;
		text-align: center;
		line-height: 1.2;
		font-size: 14px;
		font-weight: 300;
		color: #ffffffef;
	}
}
</style>
