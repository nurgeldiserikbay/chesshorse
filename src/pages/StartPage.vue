<script lang="ts" setup>
import { ref } from 'vue'

import OtherGames from '@/components/OtherGames.vue'
import OtherGamesIcon from '@/components/OtherGamesIcon.vue'

import { PAGES } from '@/utils/conts'

import { usePageStore } from '@/store/pageStore'

const { routeTo } = usePageStore()

const isOtherGames = ref(false)
</script>

<template>
	<div class="page start-page">
		<!-- Вход в «Другие игры»: небольшой значок в углу. Приглушён намеренно —
		     раздел не должен спорить за внимание с кнопкой Play. -->
		<button
			class="promo-games"
			aria-label="Other games"
			@click="isOtherGames = true"
		>
			<OtherGamesIcon />
		</button>

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
		color: #fff;
		/* Жёсткая тёмная обводка: на светлой долине иначе не читается */
		text-shadow: 3px 0 0 #1a1033, -3px 0 0 #1a1033, 0 3px 0 #1a1033,
			0 -3px 0 #1a1033, 2px 2px 0 #1a1033, -2px -2px 0 #1a1033,
			2px -2px 0 #1a1033, -2px 2px 0 #1a1033, 0 6px 0 #1a1033;

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
		border: 4px solid #1a1033;
		box-shadow: inset 0 4px 0 rgba(255, 255, 255, 0.45),
			inset 0 -4px 0 rgba(0, 0, 0, 0.2), 0 6px 0 #1a1033;
		transition: transform 0.15s, box-shadow 0.15s;
		text-transform: uppercase;
		letter-spacing: 2px;

		&:hover {
			transform: scale(1.05);
		}

		&:active {
			transform: translateY(4px);
			box-shadow: inset 0 4px 0 rgba(255, 255, 255, 0.45),
				inset 0 -4px 0 rgba(0, 0, 0, 0.2), 0 2px 0 #1a1033;
		}
	}

	.privacy {
		margin-bottom: 85px;

		a {
			display: inline-block;
			padding: 6px 18px;
			border-radius: 999px;
			background: rgba(26, 16, 51, 0.72);
			color: #fff;
			text-decoration: none;
			font-size: 18px;
			font-weight: 700;

			&:visited,
			&:active {
				color: #fff;
			}
		}
	}
}

/*
   Вход в «Другие игры».

   position: fixed, а не absolute: экран одностраничный и на весь вьюпорт, и так
   значок не зависит от того, позиционирован ли предок.
*/
.promo-games {
	position: fixed;
	top: 12px;
	right: 12px;
	z-index: 5;
	display: flex;
	align-items: center;
	justify-content: center;
	width: 36px;
	height: 36px;
	padding: 0;
	border: none;
	border-radius: 50%;
	background: rgba(0, 0, 0, 0.28);
	opacity: 0.55;
	cursor: pointer;
	color: #fff;
}

.promo-games svg {
	width: 20px;
	height: 20px;
}

.promo-games:active {
	opacity: 0.85;
}
</style>
