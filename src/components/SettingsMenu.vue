<script lang="ts" setup>
import { ref, computed } from 'vue'

import IconSettings from '@/assets/img/settings.svg'
import IconClose from '@/assets/img/close.svg'

import UiToggle from '@/components/UiToggle.vue'

import { useGameSettings } from '@/store/gameSettings'

import { useAudio } from '@/composables/useAudio'

// import { GAME_SETTINGS } from '@/utils/conts'

const gameSettings = useGameSettings()
const { audioActive, toggleAudio } = useAudio()

const isActive = ref(false)

// const isWhiteKnigt = computed(() => {
// 	return gameSettings.horseColor === 'white'
// })

// const getHorseImage = computed(() => {
// 	return `./img/board/${gameSettings.getGameSettings.horse}-${gameSettings.horseColor}.png`
// })

// function selectTheme(id: number) {
// 	gameSettings.setGameSettings(id)
// }
</script>

<template>
	<div class="settings-menu">
		<button class="btn settings-menu__btn" @click="isActive = true">
			<IconSettings />
		</button>

		<Teleport to="body">
			<div
				v-if="isActive"
				class="settings-menu__overlay"
				@click="isActive = false"
			>
				<div class="settings-menu__modal" @click.stop.prevent="">
					<div class="settings-menu__modal-head">
						<div class="title settings-menu__head">Settings</div>
						<button
							class="btn btn--second settings-menu__close"
							@click="isActive = false"
						>
							<IconClose />
						</button>
					</div>
					<div class="settings-menu__body">
						<div class="settings-menu__option settings-menu__option--row">
							<div class="settings-menu__option-title">Sound</div>
							<div class="settings-menu__option-body">
								<UiToggle
									:modelValue="audioActive"
									@update:modelValue="toggleAudio"
								/>
							</div>
						</div>
						<div class="settings-menu__option settings-menu__option--row">
							<div class="settings-menu__option-title">Show possible moves</div>
							<div class="settings-menu__option-body">
								<UiToggle
									:modelValue="gameSettings.showPossibleMoves"
									@update:modelValue="gameSettings.toggleShowPossibleMoves"
								/>
							</div>
						</div>
						<!-- <div class="settings-menu__option settings-menu__option--row">
							<div class="settings-menu__option-title">Knight</div>
							<div class="settings-menu__option-body">
								<img :src="getHorseImage" alt="knight" class="horse" />
								<UiToggle
									:modelValue="isWhiteKnigt"
									@update:modelValue="gameSettings.toggleHorseColor"
								/>
							</div>
						</div> -->
						<!-- <div class="settings-menu__option">
							<div class="settings-menu__option-title">Themes</div>
							<div class="settings-menu__option-body">
								<button
									v-for="setting in GAME_SETTINGS"
									:key="setting.id"
									class="theme"
									:class="{
										'theme--active':
											setting.id === gameSettings.getGameSettings.id,
									}"
									:style="{
										background: `${setting.board1}`,
									}"
									@click="selectTheme(setting.id)"
								></button>
							</div>
						</div> -->
					</div>
				</div>
			</div>
		</Teleport>
	</div>
</template>

<style lang="scss" scoped>
:root {
	--bg: #1e1a3a;
	--tile: #241e48;
	--tile-hi: #2c235c;
	--gold-ghost: rgba(255, 213, 79, 0.2);
	--ink: #0b0920;
	--text: #f7f7fb;
	--muted: #cfcfe6;
}

.settings-menu {
	display: inline-block;
	flex-shrink: 0;

	&__btn {
		width: 46px;
		height: 46px;
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

	&__overlay {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		z-index: 1000;
		background: rgba(0, 0, 0, 0.3);
		display: flex;
		justify-content: center;
		align-items: flex-start;
		padding-top: 5px;
	}

	&__modal {
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
	}

	&__modal-head {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 6px 6px 10px;
	}

	&__head {
		margin: 0;
		font-size: 24px;
		font-weight: 600;
		letter-spacing: 0.5px;
		color: #ffd54f;
		text-shadow: 0 0 10px rgba(255, 213, 79, 0.45);
		text-transform: uppercase;
		letter-spacing: 4px;
	}

	&__close {
		width: 36px;
		height: 36px;
		border: none;
		border-radius: 50%;
		box-shadow: 0 2px 6px rgba(0, 0, 0, 0.35),
			inset 0 0 0 1px rgba(255, 255, 255, 0.35);
		display: grid;
		place-items: center;
		cursor: pointer;
		transition: transform 0.12s ease, box-shadow 0.12s ease;

		&:hover {
			transform: scale(1.06);
			box-shadow: 0 4px 12px rgba(0, 0, 0, 0.45);
		}

		svg {
			display: block;
			fill: #ffffff;
			width: 15px;
			height: 15px;
		}
	}

	&__body {
		display: grid;
		gap: 14px;
		padding: 8px 6px 14px;
	}

	&__option {
		margin-bottom: 15px;

		&--row {
			display: flex;
			align-items: center;
			justify-content: space-between;
			gap: 16px;
			padding: 10px 12px;
			border-radius: 12px;
			background: rgba(8, 6, 22, 0.28);
			box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.05);
			font-size: 16px;
		}
	}

	&__option-title {
		font-size: 18px;
		font-weight: 600;
		margin-bottom: 14px;
		color: #fff;
	}

	&__option-body {
		display: flex;
		justify-content: space-between;
		align-items: center;
		flex-wrap: wrap;
		gap: 15px;

		.theme {
			position: relative;
			cursor: pointer;
			display: flex;
			justify-content: center;
			align-items: center;
			width: 45px;
			height: 45px;
			background: transparent;
			border: none;
			outline: none;
			padding: 0;
			border-radius: 10px;
			box-shadow: inset 0 0 5px 3px rgba(0, 0, 0, 0.4),
				0 0 2px 1px rgba(0, 0, 0, 0.3);

			img {
				display: block;
				width: 100%;
				height: 100%;
			}

			&--active {
				transform: scale(1.2);
				border: 3px solid rgba(225, 255, 0, 0.9);
			}
		}

		.horse {
			display: block;
			width: 50px;
		}
	}
}
</style>
