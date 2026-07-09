<template>
	<button v-if="pageStore.backLink" class="back-btn" @click="click">
		<IconBack class="arrow-icon" />
	</button>
</template>

<script lang="ts" setup>
import { usePageStore } from '@/store/pageStore'

import IconBack from '@/assets/img/back.svg'

const pageStore = usePageStore()

function click() {
	pageStore.toBackLink()
}
</script>

<style lang="scss" scoped>
.back-btn {
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
	transition: transform 0.15s ease, box-shadow 0.15s ease;
}

.back-btn:hover {
	transform: scale(1.05);
	box-shadow: 0 0 12px rgba(255, 213, 79, 0.8), 4px 4px 12px rgba(0, 0, 0, 0.5),
		-4px -4px 12px rgba(255, 255, 255, 0.05);
}

.arrow-icon {
	width: 30px;
	height: 30px;
}
</style>
