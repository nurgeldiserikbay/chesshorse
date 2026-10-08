<script lang="ts" setup>
import { onBeforeMount, onMounted, watch } from 'vue'
import { Capacitor } from '@capacitor/core'
import { StatusBar } from '@capacitor/status-bar'
import { SplashScreen } from '@capacitor/splash-screen'
import { Fullscreen } from '@boengli/capacitor-fullscreen'

import { useGameSettings } from '@/store/gameSettings'
import { usePageStore } from '@/store/pageStore'
import { useGameStore } from '@/store/gameStore'

import Admob from '@/utils/admob'
import { useAudio, type MusicTrack } from '@/composables/useAudio'
import { PAGES, GAME_TYPES } from '@/utils/conts'

import { useAdsStore } from '@/store/adsStore'

const gameSettings = useGameSettings()
const adsStore = useAdsStore()
const pageStore = usePageStore()
const gameStore = useGameStore()

onBeforeMount(() => {
	gameStore.loadData()
})

// Браузер и WebView дают включить звук только после касания — музыка
// стартует с первого же нажатия в любом месте.
const { startMusic, setMusicTrack } = useAudio()

// Своя мелодия у меню, у партии и у забега на время
watch(
	() => [pageStore.currentPage, gameStore.gameType],
	() => {
		let track: MusicTrack = 'menu'
		if (pageStore.currentPage === PAGES.PLAYGROUND)
			track = gameStore.gameType === GAME_TYPES.BY_TIME ? 'rush' : 'game'
		setMusicTrack(track)
	},
	{ immediate: true }
)
window.addEventListener('pointerdown', () => startMusic(), { once: true })

onMounted(async () => {
	gameSettings.setBodyBG()

	if (Capacitor.getPlatform() === 'android') {
		// Подписку ставим до initialize(): первое событие баннера может прийти
		// раньше, чем страница успеет смонтироваться, и потеряться.
		Admob.onBannerChange((live, height) => adsStore.setBanner(live, height))

		void Admob.initialize().catch(() => {})
	}

	if (Capacitor.getPlatform() === 'android') {
		await Fullscreen.activateImmersiveMode()
		await StatusBar.hide()
		await StatusBar.setOverlaysWebView({ overlay: true })
		await SplashScreen.hide()
	}
})
</script>

<template>
	<component :is="pageStore.currentPageComponent" />
</template>

<style scoped></style>
