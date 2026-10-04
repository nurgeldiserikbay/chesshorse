<template>
	<button v-if="pageStore.backLink" class="back-btn" @click="click">
		<img :src="backImg" alt="Back" />
	</button>
</template>

<script lang="ts" setup>
import { usePageStore } from '@/store/pageStore'

import backImg from '@/assets/img/game/ui/back.webp'

const pageStore = usePageStore()

function click() {
	pageStore.toBackLink()
}
</script>

<style lang="scss" scoped>
/* Кнопка — готовая картинка из набора: рамка и стрелка уже нарисованы */
.back-btn {
	width: 56px;
	height: 56px;
	flex: none;
	padding: 0;
	border: none;
	background: none;
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
</style>
