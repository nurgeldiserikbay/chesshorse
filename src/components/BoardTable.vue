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

			<!-- Золотой след прыжка по букве «Г» -->
			<svg v-if="trail" :key="trail.id" class="trail" aria-hidden="true">
				<polyline class="trail__glow" :points="trail.points" />
				<polyline class="trail__line" :points="trail.points" />
			</svg>

			<div
				ref="horseRef"
				class="horse"
				:class="{ hide: isHide }"
				:style="{
					...getHorseDefStyle,
					...getHorsePosStyle,
				}"
			>
				<div :key="hopKey" class="horse__body" :class="{ hop: hopKey > 0 }">
					<img
						class="horse__piece"
						:class="`horse__piece--${jumping ? 'jump' : mood}`"
						:src="jumping ? KNIGHT_IMG.jump : KNIGHT_IMG[mood]"
						alt="knight"
						draggable="false"
					/>
				</div>
				<img
					v-if="landKey > 0"
					:key="`dust${landKey}`"
					class="horse__dust"
					:src="cloudImg"
					alt=""
				/>
			</div>

			<div
				v-for="p in popups"
				:key="p.id"
				class="popup"
				:class="`popup--${p.group}`"
				:style="getPopupStyle(p.row, p.col)"
			>
				<img class="popup__burst" :src="BURST_IMG[p.group]" alt="" />
				<span class="popup__text">+{{ p.points }}</span>
			</div>

			<div v-if="banner" :key="banner.id" class="banner">
				<span class="banner__word">{{ banner.text }}</span>
				<span class="banner__mult">×{{ banner.mult }}</span>
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
					:data-cell="`${rowInd}:${colInd}`"
					:class="{
						'is-dark': (rowInd + colInd) % 2 === 1,
						active: !isHide && isPossibleMove(rowInd, colInd),
						is_hole: col.type === BOARD_ITEM.brick,
						is_visited: !canToBack && col.type === BOARD_ITEM.cell,
						land: landed === `${rowInd}:${colInd}`,
					}"
					@click="move(rowInd, colInd)"
				>
					<Transition name="item">
						<img
							v-if="col.type === BOARD_ITEM.pill"
							class="item"
							:class="[
								{ hide: isHide },
								`item--${itemGroup(itemAt(rowInd, colInd))}`,
							]"
							:style="{ animationDelay: `${((rowInd * 3 + colInd) % 8) * -0.25}s` }"
							:src="ITEM_IMG[itemAt(rowInd, colInd)]"
							alt=""
							draggable="false"
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
import {
	ItemKind,
	ItemGroup,
	IBoardPopup,
	KnightMood,
	ITEM_IMG,
	itemGroup,
} from '@/game/items'

import { useGameSettings } from '@/store/gameSettings'

import knightHappy from '@/assets/img/game/knight/happy.webp'
import knightThink from '@/assets/img/game/knight/think.webp'
import knightJump from '@/assets/img/game/knight/jump.webp'
import knightCheer from '@/assets/img/game/knight/cheer.webp'
import cloudImg from '@/assets/img/game/fx/cloud.webp'
import starburstImg from '@/assets/img/game/fx/starburst.webp'
import starExplodeImg from '@/assets/img/game/fx/star-explode.webp'
import coinburstImg from '@/assets/img/game/fx/coinburst.webp'

const KNIGHT_IMG = {
	happy: knightHappy,
	think: knightThink,
	jump: knightJump,
	cheer: knightCheer,
}

// Чем ценнее предмет, тем сильнее вспышка
const BURST_IMG: Record<ItemGroup, string> = {
	candy: starburstImg,
	star: starburstImg,
	crystal: starExplodeImg,
	crown: coinburstImg,
}

const $props = withDefaults(
	defineProps<{
		board: TypeBoard
		possibleMoves?: number[][]
		horsePos: number[]
		isHide?: boolean
		canToBack?: boolean
		items?: Record<string, ItemKind>
		popups?: IBoardPopup[]
		banner?: { id: number; text: string; mult: number } | null
		mood?: KnightMood
	}>(),
	{
		isHide: false,
		canToBack: true,
		items: () => ({}),
		popups: () => [],
		banner: null,
		mood: 'happy',
	}
)

const $emits = defineEmits(['move'])

// Зазор между клетками и внутренний отступ золотой рамки — участвуют
// и в расчёте размера клетки, и в позиционировании коня.
const GAP = 2
const FRAME_PAD = 6
const FRAME_BORDER = 5
const CORNERS = ['tl', 'tr', 'bl', 'br']
const JUMP_MS = 380

const gameSettings = useGameSettings()

const tableRef = ref<HTMLDivElement | null>(null)
const horseRef = ref<HTMLDivElement | null>(null)
const boardWidth = ref(80)
const hopKey = ref(0)
const landKey = ref(0)
const jumping = ref(false)
const landed = ref<string | null>(null)
const trail = ref<{ id: number; points: string } | null>(null)
let timers: ReturnType<typeof setTimeout>[] = []

const itemAt = (row: number, col: number): ItemKind =>
	$props.items[`${row}:${col}`] || 'candy-pink'

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

const cellOffset = (row: number, col: number) => {
	const step = boardWidth.value + GAP
	return `translate(${step * col}px, ${step * row}px)`
}

const getHorsePosStyle = computed(() => ({
	transform: cellOffset($props.horsePos[0], $props.horsePos[1]),
}))

// «+очки» всплывают над клеткой, где взят предмет
const getPopupStyle = computed(() => (row: number, col: number) => {
	const step = boardWidth.value + GAP
	return {
		width: `${boardWidth.value}px`,
		height: `${boardWidth.value}px`,
		left: `${FRAME_PAD + col * step}px`,
		top: `${FRAME_PAD + row * step}px`,
	}
})

// Ход конём: сначала длинная сторона «Г», потом короткая — по углу, со следом.
// flush: 'post' — к этому моменту в DOM уже конечная позиция, а анимация
// лишь проводит коня к ней через угол.
watch(
	() => [$props.horsePos[0], $props.horsePos[1]],
	(val, old) => {
		if (!old) return
		const dr = val[0] - old[0]
		const dc = val[1] - old[1]
		const isKnightMove =
			(Math.abs(dr) === 2 && Math.abs(dc) === 1) ||
			(Math.abs(dr) === 1 && Math.abs(dc) === 2)
		if (!isKnightMove) return

		const corner =
			Math.abs(dr) === 2 ? [val[0], old[1]] : [old[0], val[1]]
		playJump(old, corner, val)
	},
	{ flush: 'post' }
)

function playJump(from: number[], corner: number[], to: number[]) {
	timers.forEach(clearTimeout)
	timers = []

	const step = boardWidth.value + GAP
	const center = (p: number[]) =>
		`${FRAME_PAD + p[1] * step + boardWidth.value / 2},${
			FRAME_PAD + p[0] * step + boardWidth.value / 2
		}`
	trail.value = {
		id: Date.now(),
		points: [from, corner, to].map(center).join(' '),
	}

	hopKey.value++
	jumping.value = true
	horseRef.value?.animate(
		[
			{ transform: cellOffset(from[0], from[1]) },
			{ transform: cellOffset(corner[0], corner[1]), offset: 0.55 },
			{ transform: cellOffset(to[0], to[1]) },
		],
		{ duration: JUMP_MS, easing: 'ease-in-out' }
	)

	timers.push(
		setTimeout(() => {
			jumping.value = false
			landKey.value++
			landed.value = null
			requestAnimationFrame(() => {
				landed.value = `${to[0]}:${to[1]}`
			})
		}, JUMP_MS - 40),
		setTimeout(() => {
			trail.value = null
		}, JUMP_MS + 450)
	)
}

onMounted(() => {
	calculateBoardWidth()

	window.addEventListener('resize', calculateBoardWidth)
})

onBeforeUnmount(() => {
	timers.forEach(clearTimeout)
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

	/* Золотые накладки на углах рамки */
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

		/* Клетка «принимает» коня: короткое приседание */
		&.land {
			animation: cell-land 0.28s ease-out;
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

		.item {
			position: relative;
			z-index: 15;
			width: 74%;
			height: 74%;
			object-fit: contain;
			display: block;
			pointer-events: none;
			user-select: none;
			animation: item-bob 2s ease-in-out infinite;

			/* Редкие предметы покачиваются заметнее и светятся */
			&--crystal,
			&--crown {
				filter: drop-shadow(0 0 5px rgba(255, 245, 170, 0.95));
				animation: item-float 1.6s ease-in-out infinite;
			}

			/* Предмет «съеден»: подскок и исчезновение, вспышку рисует popup.
			   Последним в блоке: иначе его перебивают item-bob и item-float. */
			&.item-leave-active {
				animation: eat 0.28s ease-in forwards;
			}
		}
	}

	.hide {
		opacity: 0;
	}

	.trail {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		z-index: 40;
		pointer-events: none;
		overflow: visible;

		polyline {
			fill: none;
			stroke-linecap: round;
			stroke-linejoin: round;
		}

		&__glow {
			stroke: rgba(255, 230, 120, 0.55);
			stroke-width: 12;
		}

		&__line {
			stroke: #fff6c4;
			stroke-width: 4;
			stroke-dasharray: 2 9;
		}

		animation: trail-fade 0.8s ease-out forwards;
	}

	.horse {
		pointer-events: none;
		position: absolute;
		z-index: 50;

		&__body {
			position: absolute;
			inset: 0;

			&.hop {
				animation: hop 0.38s ease-out;
			}
		}

		/* Маскот стоит на клетке, голова чуть выше её края */
		&__piece {
			position: absolute;
			height: 112%;
			left: 50%;
			bottom: 3%;
			transform: translateX(-50%);
			display: block;
			user-select: none;
			filter: drop-shadow(0 3px 0 rgba(26, 16, 51, 0.45));

			&--think {
				animation: think 1.4s ease-in-out infinite;
			}

			&--cheer {
				animation: cheer 0.6s ease-in-out infinite;
			}
		}

		/* Облачко пыли при приземлении */
		&__dust {
			position: absolute;
			left: 50%;
			bottom: -12%;
			width: 95%;
			transform: translateX(-50%);
			opacity: 0;
			animation: dust 0.45s ease-out;
		}
	}
}

.popup {
	position: absolute;
	z-index: 70;
	pointer-events: none;
	display: flex;
	align-items: center;
	justify-content: center;

	&__burst {
		position: absolute;
		width: 170%;
		height: 170%;
		object-fit: contain;
		animation: burst 0.5s ease-out forwards;
	}

	&--crystal &__burst,
	&--crown &__burst {
		width: 240%;
		height: 240%;
		animation-duration: 0.7s;
	}

	&__text {
		position: relative;
		color: #fff;
		font-weight: 800;
		font-size: 20px;
		white-space: nowrap;
		text-shadow: 2px 0 0 #1a1033, -2px 0 0 #1a1033, 0 2px 0 #1a1033,
			0 -2px 0 #1a1033, 0 3px 0 #1a1033;
		animation: float-up 0.9s ease-out forwards;
	}

	&--crystal &__text,
	&--crown &__text {
		color: #ffe14f;
		font-size: 26px;
	}
}

/* Слово серии над доской: Nice! → Great! → Amazing! → Awesome! */
.banner {
	position: absolute;
	z-index: 80;
	left: 50%;
	top: 42%;
	display: flex;
	flex-direction: column;
	align-items: center;
	pointer-events: none;
	animation: banner 1s ease-out forwards;

	&__word,
	&__mult {
		font-weight: 800;
		color: #fff;
		white-space: nowrap;
		text-shadow: 3px 0 0 #1a1033, -3px 0 0 #1a1033, 0 3px 0 #1a1033,
			0 -3px 0 #1a1033, 2px 2px 0 #1a1033, -2px -2px 0 #1a1033,
			2px -2px 0 #1a1033, -2px 2px 0 #1a1033, 0 6px 0 #1a1033;
	}

	&__word {
		font-size: 44px;
		color: #ffe14f;
	}

	&__mult {
		font-size: 26px;
		color: #ff7eb6;
	}
}

@keyframes eat {
	0% {
		transform: scale(1);
		opacity: 1;
	}
	40% {
		transform: scale(1.25);
		opacity: 1;
	}
	100% {
		transform: scale(0.3);
		opacity: 0;
	}
}

@keyframes burst {
	0% {
		transform: scale(0.3) rotate(0);
		opacity: 1;
	}
	100% {
		transform: scale(1.1) rotate(25deg);
		opacity: 0;
	}
}

@keyframes float-up {
	0% {
		transform: translateY(0) scale(0.6);
		opacity: 0;
	}
	20% {
		transform: translateY(-20%) scale(1.15);
		opacity: 1;
	}
	70% {
		opacity: 1;
	}
	100% {
		transform: translateY(-120%) scale(1);
		opacity: 0;
	}
}

@keyframes banner {
	0% {
		transform: translate(-50%, -50%) scale(0.3) rotate(-8deg);
		opacity: 0;
	}
	18% {
		transform: translate(-50%, -50%) scale(1.15) rotate(3deg);
		opacity: 1;
	}
	30% {
		transform: translate(-50%, -50%) scale(1) rotate(0);
	}
	75% {
		transform: translate(-50%, -60%) scale(1);
		opacity: 1;
	}
	100% {
		transform: translate(-50%, -80%) scale(0.9);
		opacity: 0;
	}
}

@keyframes trail-fade {
	0%,
	55% {
		opacity: 1;
	}
	100% {
		opacity: 0;
	}
}

@keyframes dust {
	0% {
		transform: translateX(-50%) scale(0.4);
		opacity: 0.95;
	}
	100% {
		transform: translateX(-50%) scale(1.2);
		opacity: 0;
	}
}

@keyframes cell-land {
	0% {
		transform: scale(1);
	}
	40% {
		transform: scale(0.9, 0.86);
	}
	100% {
		transform: scale(1);
	}
}

@keyframes item-bob {
	0%,
	100% {
		transform: translateY(0);
	}
	50% {
		transform: translateY(-5%);
	}
}

@keyframes item-float {
	0%,
	100% {
		transform: translateY(0) rotate(-4deg) scale(1);
	}
	50% {
		transform: translateY(-9%) rotate(4deg) scale(1.06);
	}
}

/* Прыжок: присед, взлёт с наклоном, приземление с «приседанием» */
@keyframes hop {
	0% {
		transform: translateY(0) scale(1);
	}
	15% {
		transform: translateY(0) scale(1.08, 0.88);
	}
	50% {
		transform: translateY(-50%) scale(0.95, 1.08) rotate(-8deg);
	}
	84% {
		transform: translateY(0) scale(1.12, 0.86);
	}
	100% {
		transform: translateY(0) scale(1);
	}
}

@keyframes think {
	0%,
	100% {
		transform: translateX(-50%) rotate(0);
	}
	50% {
		transform: translateX(-50%) rotate(-5deg);
	}
}

@keyframes cheer {
	0%,
	100% {
		transform: translateX(-50%) translateY(0);
	}
	50% {
		transform: translateX(-50%) translateY(-10%);
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
