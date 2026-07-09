<template>
	<div class="head-main">
		<BackTo />
		<ScoreTable
			v-if="pageStore.currentPage === PAGES.PLAYGROUND"
			:isGameEnd="isGameEnd"
			@timeend="timeend"
		/>
		<SettingsMenu v-if="settings" />
	</div>
</template>

<script lang="ts" setup>
import BackTo from '@/components/BackTo.vue'
import SettingsMenu from '@/components/SettingsMenu.vue'
import ScoreTable from '@/components/ScoreTable.vue'

import { PAGES } from '@/utils/conts'

import { usePageStore } from '@/store/pageStore'

const pageStore = usePageStore()

defineProps<{
	isGameEnd?: boolean
	settings: boolean
}>()

const $emits = defineEmits(['timeend'])

function timeend() {
	$emits('timeend')
}
</script>

<style lang="scss" scoped>
.head-main {
	width: 100%;
	height: 65px;
	padding: 13px 15px;
	box-sizing: border-box;
	background-size: cover;
	display: flex;
	justify-content: space-between;
	align-items: center;
	flex-shrink: 0;
	gap: 15px;

	@media screen and (max-width: 780px) {
		padding: 8px 15px;
	}
}
</style>
