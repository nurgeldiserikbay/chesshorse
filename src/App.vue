<script lang="ts" setup>
import { onBeforeMount, onMounted } from 'vue'
import { Capacitor } from '@capacitor/core'
import { StatusBar } from '@capacitor/status-bar'
import { SplashScreen } from '@capacitor/splash-screen'
import { Fullscreen } from '@boengli/capacitor-fullscreen'

import { useGameSettings } from '@/store/gameSettings'
import { usePageStore } from '@/store/pageStore'
import { useGameStore } from '@/store/gameStore'

import Admob from '@/utils/admob'

const gameSettings = useGameSettings()
const pageStore = usePageStore()
const gameStore = useGameStore()

onBeforeMount(() => {
	gameStore.loadData()
})

onMounted(async () => {
	gameSettings.setBodyBG()

	if (Capacitor.getPlatform() === 'android') {
		Admob.initialize()
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
