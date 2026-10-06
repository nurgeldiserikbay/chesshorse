<template>
	<div
		class="ui-toggle"
		@click="update"
		:class="{ 'ui-toggle--active': modelValue }"
	>
		<div class="ui-toggle__circle"></div>
	</div>
</template>

<script lang="ts" setup>
const $props = defineProps<{
	modelValue: boolean
}>()

const $emits = defineEmits(['update:modelValue'])

function update() {
	$emits('update:modelValue', !$props.modelValue)
}
</script>

<style lang="scss" scoped>
/* Крупный переключатель в стиле игры: тёмная обводка, жёсткие края */
$h: 30px;

.ui-toggle {
	position: relative;
	flex: none;
	width: 2 * $h;
	height: $h;
	box-sizing: border-box;
	border: 3px solid #1a1033;
	border-radius: $h;
	background: #b9b3d6;
	box-shadow: inset 0 3px 0 rgba(26, 16, 51, 0.25);
	transition: background 0.2s ease;
	cursor: pointer;

	&--active {
		background: #3ccf5a;
	}

	&__circle {
		position: absolute;
		top: 1px;
		left: 1px;
		width: $h - 8px;
		height: $h - 8px;
		box-sizing: border-box;
		border: 3px solid #1a1033;
		border-radius: 50%;
		background: #fff;
		transition: transform 0.18s ease;
	}

	&--active &__circle {
		transform: translateX($h);
	}
}
</style>
