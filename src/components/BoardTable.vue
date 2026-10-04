<template>
	<div ref="tableRef" class="table">
		<div
			id="captureBlock"
			class="table__inner"
			:class="{ isHide: isHide }"
			:style="{ gap: `${GAP}px`, padding: `${FRAME_PAD}px` }"
		>
			<span
				v-for="corner in CORNERS"
				:key="corner"
				class="table__corner"
				:class="`table__corner--${corner}`"
			></span>
			<div
				class="horse"
				:class="{ hide: isHide }"
				:style="{
					...getHorseDefStyle,
					...getHorsePosStyle,
				}"
			>
				<div :key="hopKey" class="horse__body" :class="{ hop: hopKey > 0 }">
					<KnightPiece class="horse__piece" />
				</div>
			</div>
			<div
				v-for="(row, rowInd) in board"
				:key="rowInd"
				class="table__row"
				:style="{ gap: `${GAP}px` }"
			>
				<div
					v-for="(col, colInd) in row"
					:key="colInd"
					class="table__col"
					:style="getCellStyle"
					:class="{
						'is-dark': (rowInd + colInd) % 2 === 1,
						active: !isHide && isPossibleMove(rowInd, colInd),
						is_hole: col.type === BOARD_ITEM.brick,
						is_visited: !canToBack && col.type === BOARD_ITEM.cell,
					}"
					@click="move(rowInd, colInd)"
				>
					<Transition name="coin">
						<CoinIcon
							v-if="col.type === BOARD_ITEM.pill"
							class="coin"
							:class="{ hide: isHide }"
						/>
					</Transition>
				</div>
			</div>
		</div>
	</div>
</template>

<script lang="ts" setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'

import { BOARD_ITEM } from '@/game/consts'
import { TypeBoard } from '@/game/types'

import { useGameSettings } from '@/store/gameSettings'

import KnightPiece from '@/components/KnightPiece.vue'
import CoinIcon from '@/components/CoinIcon.vue'

const $props = withDefaults(
	defineProps<{
		board: TypeBoard
		possibleMoves?: number[][]
		horsePos: number[]
		isHide?: boolean
		canToBack?: boolean
	}>(),
	{
		isHide: false,
		canToBack: true,
	}
)

const $emits = defineEmits(['move'])

// Зазор между клетками и внутренний отступ золотой рамки — участвуют
// и в расчёте размера клетки, и в позиционировании коня.
const GAP = 2
const FRAME_PAD = 6
const FRAME_BORDER = 5
const CORNERS = ['tl', 'tr', 'bl', 'br']

const gameSettings = useGameSettings()

const tableRef = ref<HTMLDivElement | null>(null)
const boardWidth = ref(80)
const hopKey = ref(0)

const isPossibleMove = computed(() => (row: number, col: number) => {
	return (
		gameSettings.showPossibleMoves &&
		$props.possibleMoves?.some((p) => p[0] === row && p[1] === col)
	)
})

const getCellStyle = computed(() => {
	return {
		width: `${boardWidth.value}px`,
		minWidth: `${boardWidth.value}px`,
		height: `${boardWidth.value}px`,
		minHeight: `${boardWidth.value}px`,
	}
})

const getHorseDefStyle = computed(() => {
	return {
		width: `${boardWidth.value}px`,
		height: `${boardWidth.value}px`,
		left: `${FRAME_PAD}px`,
		top: `${FRAME_PAD}px`,
	}
})

const getHorsePosStyle = computed(() => {
	const step = boardWidth.value + GAP
	return {
		transform: `translate(${step * $props.horsePos[1]}px, ${
			step * $props.horsePos[0]
		}px)`,
	}
})

// Каждый ход перезапускает анимацию прыжка: новый key пересоздаёт элемент.
watch(
	() => [$props.horsePos[0], $props.horsePos[1]],
	(val, old) => {
		if (old && (val[0] !== old[0] || val[1] !== old[1])) hopKey.value++
	}
)

onMounted(() => {
	calculateBoardWidth()

	window.addEventListener('resize', calculateBoardWidth)
})

onBeforeUnmount(() => {
	window.removeEventListener('resize', calculateBoardWidth)
})

function move(row: number, col: number) {
	$emits('move', { row, col })
}

function calculateBoardWidth() {
	if (tableRef.value) {
		const style = getComputedStyle(tableRef.value)
		const width = Math.floor(parseInt(style.width))
		const height = Math.floor(tableRef.value.clientHeight) || width
		const length = $props.board.length
		// Board is square: fit into the smaller of available width/height,
		// minus the gold frame around it.
		const available =
			Math.min(width, height) - 2 * (FRAME_PAD + FRAME_BORDER)
		boardWidth.value = Math.floor((available - GAP * (length - 1)) / length)
	}
}
</script>

<style lang="scss" scoped>
.table {
	width: 100%;
	flex: 1 1 auto;
	display: flex;
	flex-direction: column;
	justify-content: center;
	align-items: center;
	margin: 0 auto;
	box-sizing: border-box;

	&__inner {
		position: relative;
		display: flex;
		flex-direction: column;
		align-items: stretch;
		background: #2a3a8f;
		border: 5px solid #fecb23;
		border-radius: 12px;
		box-shadow: inset 0 0 0 2px #c98a00, 0 0 0 3px #1a1033, 0 7px 0 3px #1a1033;
	}

	/* Золотые накладки на углах рамки, как в макете */
	&__corner {
		position: absolute;
		z-index: 60;
		width: 22px;
		height: 22px;
		background: linear-gradient(135deg, #fff1a8 0%, #fecb23 45%, #d99a00 100%);
		border: 3px solid #1a1033;
		border-radius: 6px;
		pointer-events: none;

		&--tl {
			top: -12px;
			left: -12px;
		}
		&--tr {
			top: -12px;
			right: -12px;
		}
		&--bl {
			bottom: -12px;
			left: -12px;
		}
		&--br {
			bottom: -12px;
			right: -12px;
		}
	}

	&__row {
		display: flex;
		justify-content: center;
		align-items: center;
		position: relative;
	}

	&__col {
		display: flex;
		flex-shrink: 0;
		justify-content: center;
		align-items: center;
		cursor: pointer;
		position: relative;
		/* Плоские клетки в два тона, только жёсткий нижний край */
		border-radius: 6px;
		background: #c3cbfa;
		box-shadow: inset 0 -4px 0 rgba(26, 16, 51, 0.18);

		&.is-dark {
			background: #7d8ce6;
		}

		/* One Way: клетка пройдена — притушенная, без нижнего края */
		&.is_visited {
			background: #4a5598;
			box-shadow: inset 0 4px 0 rgba(26, 16, 51, 0.3);
		}

		/* Дырка в доске */
		&.is_hole {
			background: #16204f;
			box-shadow: inset 0 5px 0 rgba(0, 0, 0, 0.45);
			cursor: default;
		}

		/* Возможный ход: светящаяся голубая клетка в золотой обводке */
		&.active {
			&::before {
				content: '';
				position: absolute;
				inset: 1px;
				z-index: 5;
				border: 3px solid #fecb23;
				border-radius: 6px;
				background: #7fd0ff;
				animation: move-glow 1.2s ease-in-out infinite;
				pointer-events: none;
			}

			&::after {
				content: '';
				position: absolute;
				z-index: 6;
				width: 22%;
				height: 22%;
				border-radius: 50%;
				background: #e9fbff;
				box-shadow: 0 0 6px #fff;
				pointer-events: none;
			}
		}

		.coin {
			position: relative;
			z-index: 15;
			width: 64%;
			height: 64%;
			display: block;
			pointer-events: none;
		}
	}

	.hide {
		opacity: 0;
	}

	.horse {
		pointer-events: none;
		position: absolute;
		transition: transform 0.3s ease-out;
		z-index: 50;

		&__body {
			position: absolute;
			inset: 0;

			&.hop {
				animation: hop 0.3s ease-out;
			}
		}

		/* Конь стоит основанием в нижней части клетки, голова выходит выше */
		&__piece {
			position: absolute;
			height: 118%;
			width: auto;
			aspect-ratio: 100 / 120;
			left: 50%;
			bottom: 8%;
			transform: translateX(-50%);
			display: block;
			filter: drop-shadow(0 3px 0 rgba(0, 0, 0, 0.45));
		}
	}
}

.coin-leave-active {
	transition: transform 0.3s ease-out, opacity 0.3s ease-out;
}

.coin-leave-to {
	transform: translateY(-40%) scale(1.5);
	opacity: 0;
}

@keyframes hop {
	0% {
		transform: translateY(0) scale(1);
	}
	45% {
		transform: translateY(-30%) scale(1.08);
	}
	80% {
		transform: translateY(0) scale(1, 0.92);
	}
	100% {
		transform: translateY(0) scale(1);
	}
}

@keyframes move-glow {
	0%,
	100% {
		box-shadow: 0 0 6px rgba(120, 210, 255, 0.6);
	}
	50% {
		box-shadow: 0 0 16px rgba(120, 210, 255, 1);
	}
}
</style>
