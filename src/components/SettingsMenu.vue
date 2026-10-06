<script lang="ts" setup>
import { ref } from 'vue'

import settingsImg from '@/assets/img/game/ui/settings.webp'
import soundImg from '@/assets/img/game/ui/sound.webp'
import muteImg from '@/assets/img/game/ui/mute.webp'
import hintImg from '@/assets/img/game/ui/hint.webp'

import UiToggle from '@/components/UiToggle.vue'

import { useGameSettings } from '@/store/gameSettings'

import { useAudio } from '@/composables/useAudio'

const gameSettings = useGameSettings()
const { audioActive, toggleAudio, musicActive, toggleMusic } = useAudio()

const isActive = ref(false)
</script>

<template>
	<div class="settings-menu">
		<button class="settings-menu__btn" @click="isActive = true">
			<img :src="settingsImg" alt="Settings" />
		</button>

		<Teleport to="body">
			<div
				v-if="isActive"
				class="settings-menu__overlay"
				@click="isActive = false"
			>
				<div class="settings-menu__modal" @click.stop>
					<div class="settings-menu__ribbon">Settings</div>
					<button
						class="settings-menu__close"
						aria-label="Close"
						@click="isActive = false"
					>
						<svg viewBox="0 0 20 20" aria-hidden="true">
							<path d="M5 5l10 10M15 5L5 15" />
						</svg>
					</button>

					<div class="settings-menu__body">
						<div class="settings-menu__option" @click="toggleAudio">
							<img
								class="settings-menu__icon"
								:src="audioActive ? soundImg : muteImg"
								alt=""
							/>
							<span class="settings-menu__title">Sound</span>
							<UiToggle :modelValue="audioActive" />
						</div>

						<div class="settings-menu__option" @click="toggleMusic">
							<span class="settings-menu__icon settings-menu__icon--music">♫</span>
							<span class="settings-menu__title">Music</span>
							<UiToggle :modelValue="musicActive" />
						</div>

						<div
							class="settings-menu__option"
							@click="gameSettings.toggleShowPossibleMoves"
						>
							<img class="settings-menu__icon" :src="hintImg" alt="" />
							<span class="settings-menu__title">Show moves</span>
							<UiToggle :modelValue="gameSettings.showPossibleMoves" />
						</div>
					</div>

					<button class="settings-menu__ok" @click="isActive = false">OK</button>
				</div>
			</div>
		</Teleport>
	</div>
</template>

<style lang="scss" scoped>
.settings-menu {
	display: inline-block;
	flex-shrink: 0;

	/* Кнопка — готовая картинка из набора */
	&__btn {
		width: 56px;
		height: 56px;
		padding: 0;
		border: none;
		background: none;
		box-shadow: none;
		cursor: pointer;
		transition: transform 0.12s ease;

		img {
			width: 100%;
			height: 100%;
			object-fit: contain;
			display: block;
			filter: drop-shadow(0 3px 0 rgba(26, 16, 51, 0.5));
		}

		&:active {
			transform: translateY(3px) scale(0.96);
		}
	}

	/* Плотное затемнение: игра под окном не отвлекает */
	&__overlay {
		position: fixed;
		inset: 0;
		z-index: 1000;
		background: rgba(16, 23, 61, 0.7);
		display: flex;
		justify-content: center;
		align-items: center;
		padding: 16px;
		box-sizing: border-box;
	}

	/* Окно в стиле итогов уровня: светлая карточка в золотой рамке */
	&__modal {
		position: relative;
		width: min(88vw, 360px);
		box-sizing: border-box;
		padding: 40px 16px 18px;
		background: #fcf3e5;
		border: 5px solid #fecb23;
		border-radius: 20px;
		box-shadow: inset 0 0 0 2px #fff, 0 0 0 4px #1a1033, 0 8px 0 4px #1a1033;
		color: #2a2457;
		animation: pop 0.25s ease-out both;
	}

	&__ribbon {
		position: absolute;
		top: -24px;
		left: 50%;
		transform: translateX(-50%);
		padding: 7px 28px;
		white-space: nowrap;
		background: linear-gradient(180deg, #8c6cf5 0%, #5a3cc8 100%);
		border: 4px solid #1a1033;
		border-radius: 14px;
		box-shadow: inset 0 3px 0 rgba(255, 255, 255, 0.3), 0 4px 0 #1a1033;
		color: #fff;
		font-size: 22px;
		font-weight: 800;
		letter-spacing: 1px;
		text-shadow: 0 2px 0 #1a1033;
	}

	&__close {
		position: absolute;
		top: -18px;
		right: -18px;
		width: 42px;
		height: 42px;
		padding: 0;
		border: 3px solid #1a1033;
		border-radius: 50%;
		background: linear-gradient(180deg, #ff6b6b 0%, #d6303a 100%);
		box-shadow: inset 0 3px 0 rgba(255, 255, 255, 0.3), 0 3px 0 #1a1033;
		display: grid;
		place-items: center;
		cursor: pointer;

		&:active {
			transform: translateY(2px);
		}

		svg {
			width: 18px;
			height: 18px;
			stroke: #fff;
			stroke-width: 3.5;
			stroke-linecap: round;
		}
	}

	&__body {
		display: flex;
		flex-direction: column;
		gap: 10px;
		margin-bottom: 16px;
	}

	/* Вся строка — переключатель: по ней удобнее попасть пальцем */
	&__option {
		display: flex;
		align-items: center;
		gap: 12px;
		padding: 8px 12px 8px 8px;
		background: #ece2f7;
		border-radius: 14px;
		cursor: pointer;
		user-select: none;

		:deep(.ui-toggle) {
			pointer-events: none;
		}
	}

	&__icon {
		width: 42px;
		height: 42px;
		flex: none;
		object-fit: contain;

		/* Для музыки нет готовой иконки — рисуем такую же фиолетовую плитку */
		&--music {
			display: grid;
			place-items: center;
			box-sizing: border-box;
			border: 3px solid #1a1033;
			border-radius: 10px;
			background: linear-gradient(180deg, #8c6cf5 0%, #5a3cc8 100%);
			color: #fecb23;
			font-size: 22px;
			font-weight: 800;
			text-shadow: 0 2px 0 #1a1033;
		}
	}

	&__title {
		flex: 1 1 auto;
		font-size: 18px;
		font-weight: 800;
		letter-spacing: 0.5px;
	}

	&__ok {
		display: block;
		width: 100%;
		height: 50px;
		border: 3px solid #1a1033;
		border-radius: 16px;
		background: linear-gradient(180deg, #ffe680 0%, #fecb23 55%, #f5a400 100%);
		box-shadow: inset 0 3px 0 rgba(255, 255, 255, 0.5), 0 5px 0 #1a1033;
		color: #1a1033;
		font-family: inherit;
		font-size: 20px;
		font-weight: 800;
		letter-spacing: 1px;
		cursor: pointer;

		&:active {
			transform: translateY(3px);
			box-shadow: inset 0 3px 0 rgba(255, 255, 255, 0.5), 0 2px 0 #1a1033;
		}
	}
}

@keyframes pop {
	from {
		transform: scale(0.85);
		opacity: 0;
	}
	to {
		transform: scale(1);
		opacity: 1;
	}
}
</style>
