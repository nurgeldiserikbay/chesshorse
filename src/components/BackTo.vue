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
	width: 52px;
	height: 52px;
	flex: none;
	border: 3px solid #1a1033;
	border-radius: 14px;
	background: linear-gradient(180deg, #7c5ff0 0%, #5a3cc8 100%);
	display: flex;
	justify-content: center;
	align-items: center;
	cursor: pointer;
	box-shadow: inset 0 3px 0 rgba(255, 255, 255, 0.25), 0 4px 0 #1a1033;
	transition: transform 0.15s ease, box-shadow 0.15s ease;
}

.back-btn:hover {
	transform: scale(1.05);
}

.back-btn:active {
	transform: translateY(2px);
	box-shadow: inset 0 3px 0 rgba(255, 255, 255, 0.25), 0 2px 0 #1a1033;
}

.arrow-icon {
	width: 30px;
	height: 30px;
}
</style>
