<script lang="ts" setup>
import { ref } from 'vue'

import OtherGames from '@/components/OtherGames.vue'

import { PAGES } from '@/utils/conts'

import { usePageStore } from '@/store/pageStore'

const { routeTo } = usePageStore()

const isOtherGames = ref(false)
</script>

<template>
	<div class="page start-page">
		<div class="start-page__head">
			<div class="logo start-page__logo">
				<img src="@/assets/img/logo.png" alt="logo" />
				<span>CHESS</span>
				<span>KNIGHT</span>
				<span class="highlight">PUZZLES</span>
			</div>
			<button class="start-page__btn" @click="routeTo(PAGES.LEVELTYPES)">
				Play
			</button>
		</div>

		<button class="start-page__more" @click="isOtherGames = true">
			Other games
		</button>

		<div class="privacy">
			<a
				href="https://docs.google.com/document/d/1Hk88865_6yvWeWvi25jErXQOD6Oi5-h2qEHW5d8P25Y"
				target="_blank"
				>Privacy Policy</a
			>
		</div>

		<OtherGames v-if="isOtherGames" @close="isOtherGames = false" />
	</div>
</template>

<style lang="scss" scoped>
.start-page {
	display: flex;
	flex-direction: column;
	justify-content: space-between;
	align-items: center;
	height: 100dvh;

	&__head {
		margin-top: 10vh;
		display: flex;
		flex-direction: column;
		align-items: center;
	}

	&__more {
		padding: 10px 20px;
		border: none;
		border-radius: 13px;
		background: linear-gradient(180deg, #9280f7, #6246d6);
		box-shadow: 0 3px 0 #3f2ba0;
		cursor: pointer;
		font-size: 13px;
		font-weight: 900;
		letter-spacing: 0.8px;
		text-transform: uppercase;
		color: #fff;

		&:active {
			transform: translateY(2px);
			box-shadow: 0 1px 0 #3f2ba0;
		}
	}

	&__logo {
		max-width: 200px;
		align-items: center;
		margin-bottom: 15px;
		display: flex;
		flex-direction: column;
		align-items: center;
		text-align: center;
		font-family: 'NotoSans', 'Arial Black', sans-serif;
		font-weight: 800;
		text-align: center;
		line-height: 1.2;
		font-size: 38px;
		letter-spacing: 4px;
		color: #f5f5dc;
		text-shadow: 0 2px 4px rgba(0, 0, 0, 0.6);

		img {
			width: 100%;
			height: auto;
			max-width: 120px;
			display: block;
			margin-bottom: 5px;
		}

		span {
			display: block;
		}

		.highlight {
			color: #ffd54f;
			font-size: 32px;
		}
	}

	&__btn {
		background: linear-gradient(180deg, #ffd54f 0%, #e6a800 100%);
		border: none;
		border-radius: 16px;
		padding: 12px 40px;
		font-family: 'Noto Sans', 'Open Sans', sans-serif;
		font-size: 34px;
		font-weight: 800;
		color: #1e1a3a;
		cursor: pointer;
		box-shadow: 0 4px 8px 0 rgba(0, 0, 0, 0.8),
			inset 0 -4px 6px 0 rgba(0, 0, 0, 0.5),
			inset 0 4px 6px 0 rgba(255, 255, 255, 0.4);
		transition: transform 0.15s, box-shadow 0.15s;
		text-transform: uppercase;
		letter-spacing: 2px;

		&:hover {
			transform: scale(1.05);
			box-shadow: 0 6px 12px rgba(0, 0, 0, 0.5),
				inset 0 -4px 6px rgba(0, 0, 0, 0.3),
				inset 0 4px 6px rgba(255, 255, 255, 0.25);
		}

		&:active {
			transform: scale(0.97);
			box-shadow: 0 2px 4px rgba(0, 0, 0, 0.5),
				inset 0 2px 4px rgba(0, 0, 0, 0.4);
		}
	}

	.privacy {
		margin-bottom: 85px;

		a {
			color: #fff;
			text-decoration: none;
			font-size: 20px;
			font-weight: 500;

			&:visited,
			&:active {
				color: #fff;
			}
		}
	}
}
</style>
