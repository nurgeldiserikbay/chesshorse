<script lang="ts" setup>
import { ref, computed, onMounted, onBeforeUnmount, nextTick } from 'vue'

import { LEVELS, PAGES, GAME_TYPES } from '@/utils/conts'

import HeadMain from '@/components/HeadMain.vue'

import { usePageStore } from '@/store/pageStore'
import { useGameStore } from '@/store/gameStore'

import nodeLockImg from '@/assets/img/game/map/node-lock.webp'
import nodeCoinImg from '@/assets/img/game/map/node-coin.webp'
import nodeGlowImg from '@/assets/img/game/map/node-glow.webp'
import castleImg from '@/assets/img/game/map/castle.webp'
import signpostImg from '@/assets/img/game/map/signpost.webp'
import knightImg from '@/assets/img/game/knight/happy.webp'
import starFullImg from '@/assets/img/game/star-full.webp'
import starEmptyImg from '@/assets/img/game/star-empty.webp'

const { routeTo } = usePageStore()
const gameStore = useGameStore()

// Карта: уровни снизу вверх по извилистой тропинке к замку.
const ROW = 104 // шаг узлов по вертикали, px
const TOP = 230 // место под замок
const BOTTOM = 150 // место под указатель у первого уровня

const MODE_TITLE: Record<string, string> = {
	[GAME_TYPES.COLLECT_ALL]: 'Classic',
	[GAME_TYPES.NO_WAY_BACK]: 'One Way',
	[GAME_TYPES.BY_TIME]: 'Time Attack',
}

const gameType = computed(() => gameStore.gameType)
const isClassic = computed(() => gameType.value === GAME_TYPES.COLLECT_ALL)
const levelStat = (level: number) =>
	gameType.value ? gameStore.gameStats[gameType.value]?.[level] : undefined

const isLevelActive = (level: number) =>
	level === 0 || !!gameStore.gameStats[GAME_TYPES.COLLECT_ALL]?.[level - 1]

// Текущий — первый открытый, но ещё не пройденный в этом режиме
const currentLevel = computed(() => {
	const found = LEVELS.find(
		(l) => isLevelActive(l.level) && !levelStat(l.level)
	)
	return found ? found.level : LEVELS[LEVELS.length - 1].level
})

const mapHeight = computed(() => TOP + LEVELS.length * ROW + BOTTOM)

const nodePos = (i: number) => ({
	x: 50 + 27 * Math.sin(i * 0.75),
	y: mapHeight.value - BOTTOM - i * ROW - ROW / 2,
})

const nodes = computed(() =>
	LEVELS.map((l, i) => {
		const stat = levelStat(l.level)
		const active = isLevelActive(l.level)
		return {
			level: l.level,
			...nodePos(i),
			state: !active
				? 'locked'
				: l.level === currentLevel.value
				? 'current'
				: stat
				? 'done'
				: 'open',
			stars: isClassic.value ? stat?.stars || 0 : null,
			score: stat?.score,
		}
	})
)

// Тропинка через центры узлов; x в процентах, поэтому viewBox 100 по ширине
const pathPoints = computed(() =>
	nodes.value.map((n) => `${n.x},${n.y}`).join(' ')
)

const totalStars = computed(() =>
	isClassic.value
		? LEVELS.reduce((acc, l) => acc + (levelStat(l.level)?.stars || 0), 0)
		: 0
)
const doneCount = computed(
	() => LEVELS.filter((l) => !!levelStat(l.level)).length
)

const modalActive = ref(false)
const pageRef = ref<HTMLDivElement | null>(null)
let timerId: ReturnType<typeof setTimeout>

function clickLevel(levelInd: number) {
	if (!isLevelActive(levelInd)) {
		modalActive.value = true
		if (timerId) clearTimeout(timerId)
		timerId = setTimeout(() => {
			modalActive.value = false
		}, 1500)
	} else {
		gameStore.selectLevel(levelInd)
		routeTo(PAGES.PLAYGROUND)
	}
}

// Сразу показываем текущий уровень, а не начало карты
onMounted(async () => {
	await nextTick()
	const el = pageRef.value
	const node = nodes.value.find((n) => n.state === 'current')
	if (el && node) el.scrollTop = node.y - el.clientHeight / 2
})

onBeforeUnmount(() => {
	if (timerId) clearTimeout(timerId)
})
</script>

<template>
	<HeadMain :settings="false" />
	<div ref="pageRef" class="page levels-page">
		<div class="levels-page__head">
			<span class="levels-page__mode">{{ MODE_TITLE[gameType || ''] }}</span>
			<span class="levels-page__progress">
				<template v-if="isClassic">
					<img :src="starFullImg" alt="" />{{ totalStars }} / {{ LEVELS.length * 3 }}
				</template>
				<template v-else>{{ doneCount }} / {{ LEVELS.length }}</template>
			</span>
		</div>

		<div v-show="modalActive" class="levels-page__modal">
			Finish the previous level in Classic to open this one
		</div>

		<div class="map" :style="{ height: `${mapHeight}px` }">
			<svg
				class="map__path"
				:viewBox="`0 0 100 ${mapHeight}`"
				preserveAspectRatio="none"
				aria-hidden="true"
			>
				<polyline class="map__path-edge" :points="pathPoints" />
				<polyline class="map__path-road" :points="pathPoints" />
				<polyline class="map__path-dots" :points="pathPoints" />
			</svg>

			<img class="map__castle" :src="castleImg" alt="" />
			<img class="map__sign" :src="signpostImg" alt="" />

			<button
				v-for="n in nodes"
				:key="n.level"
				class="node"
				:class="`node--${n.state}`"
				:style="{ left: `${n.x}%`, top: `${n.y}px` }"
				@click="clickLevel(n.level)"
			>
				<div v-if="n.stars !== null && n.state === 'done'" class="node__stars">
					<img
						v-for="i in 3"
						:key="i"
						:src="i <= (n.stars || 0) ? starFullImg : starEmptyImg"
						alt=""
					/>
				</div>
				<img
					class="node__base"
					:src="
						n.state === 'locked'
							? nodeLockImg
							: n.state === 'current'
							? nodeGlowImg
							: nodeCoinImg
					"
					alt=""
				/>
				<span v-if="n.state !== 'locked'" class="node__num">{{
					n.level + 1
				}}</span>
				<span
					v-if="n.stars === null && n.score && n.state === 'done'"
					class="node__score"
					>{{ n.score }}</span
				>
				<img
					v-if="n.state === 'current'"
					class="node__knight"
					:src="knightImg"
					alt=""
				/>
			</button>
		</div>
	</div>
</template>

<style lang="scss" scoped>
$outline: 2px 0 0 #1a1033, -2px 0 0 #1a1033, 0 2px 0 #1a1033, 0 -2px 0 #1a1033,
	0 4px 0 #1a1033;

.levels-page {
	position: relative;
	padding-top: 0;

	&__head {
		position: sticky;
		top: 0;
		z-index: 30;
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin: 0 auto;
		max-width: 420px;
		padding: 8px 18px;
		background: #fcf3e5;
		border: 4px solid #fecb23;
		border-radius: 16px;
		box-shadow: 0 0 0 3px #1a1033, 0 6px 0 3px #1a1033;
	}

	&__mode {
		font-size: 22px;
		font-weight: 800;
		color: #2a2457;
	}

	&__progress {
		display: flex;
		align-items: center;
		gap: 4px;
		padding: 2px 12px;
		border-radius: 999px;
		background: #2a2457;
		color: #ffe14f;
		font-size: 17px;
		font-weight: 800;

		img {
			width: 22px;
			height: 22px;
		}
	}

	&__modal {
		position: fixed;
		left: 50%;
		bottom: calc(var(--ad-band) + 30px);
		z-index: 1000;
		transform: translateX(-50%);
		width: 86%;
		max-width: 300px;
		padding: 12px 18px;
		box-sizing: border-box;
		text-align: center;
		font-weight: 800;
		color: #2a2457;
		background: #fcf3e5;
		border: 3px solid #1a1033;
		border-radius: 14px;
		box-shadow: 0 5px 0 #1a1033;
	}
}

.map {
	position: relative;
	width: 100%;
	max-width: 420px;
	margin: 0 auto;

	&__path {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		overflow: visible;

		polyline {
			fill: none;
			stroke-linejoin: round;
			stroke-linecap: round;
			vector-effect: non-scaling-stroke;
		}
	}

	&__path-edge {
		stroke: #1a1033;
		stroke-width: 30;
	}

	&__path-road {
		stroke: #f3dfb0;
		stroke-width: 22;
	}

	&__path-dots {
		stroke: #d9bf84;
		stroke-width: 6;
		stroke-dasharray: 2 14;
	}

	&__castle {
		position: absolute;
		top: 0;
		left: 50%;
		width: 220px;
		transform: translateX(-50%);
		filter: drop-shadow(0 6px 0 rgba(26, 16, 51, 0.35));
	}

	&__sign {
		position: absolute;
		bottom: 20px;
		left: 12%;
		width: 86px;
	}
}

/* Узел уровня: монета на островке; закрытый — замок, текущий — светится */
.node {
	position: absolute;
	width: 92px;
	height: 88px;
	padding: 0;
	border: none;
	background: none;
	transform: translate(-50%, -50%);
	cursor: pointer;

	&:active {
		transform: translate(-50%, -46%) scale(0.95);
	}

	&__base {
		width: 100%;
		height: 100%;
		object-fit: contain;
		display: block;
		filter: drop-shadow(0 4px 0 rgba(26, 16, 51, 0.35));
	}

	&__num {
		position: absolute;
		left: 0;
		right: 0;
		top: 22%;
		text-align: center;
		font-size: 26px;
		font-weight: 800;
		color: #fff;
		letter-spacing: 0;
		text-shadow: $outline;
	}

	&__stars {
		position: absolute;
		top: -20px;
		left: 50%;
		display: flex;
		align-items: flex-end;
		transform: translateX(-50%);

		img {
			width: 24px;
			height: 24px;

			&:nth-child(2) {
				width: 30px;
				height: 30px;
				margin-bottom: 5px;
			}
		}
	}

	&__score {
		position: absolute;
		left: 50%;
		bottom: -14px;
		transform: translateX(-50%);
		padding: 0 8px;
		border: 2px solid #1a1033;
		border-radius: 999px;
		background: #ffe14f;
		color: #1a1033;
		font-size: 12px;
		font-weight: 800;
		letter-spacing: 0;
	}

	&--current {
		width: 104px;
		height: 96px;
		animation: node-pulse 1.4s ease-in-out infinite;
	}

	&--locked &__base {
		filter: grayscale(0.2) drop-shadow(0 4px 0 rgba(26, 16, 51, 0.35));
	}

	/* Маскот ждёт у текущего уровня */
	&__knight {
		position: absolute;
		right: -40px;
		bottom: 30px;
		height: 72px;
		pointer-events: none;
		filter: drop-shadow(0 3px 0 rgba(26, 16, 51, 0.4));
		animation: knight-wait 0.9s ease-in-out infinite;
	}
}

@keyframes node-pulse {
	0%,
	100% {
		transform: translate(-50%, -50%) scale(1);
	}
	50% {
		transform: translate(-50%, -50%) scale(1.06);
	}
}

@keyframes knight-wait {
	0%,
	100% {
		transform: translateY(0);
	}
	50% {
		transform: translateY(-8px);
	}
}
</style>
