<template>
	<div class="result-table">
		<img class="result-table__knight" :src="KNIGHT_IMG[mood]" alt="" />
		<div class="result-table__ribbon">{{ title }}</div>

		<div v-if="stars !== null" class="result-table__stars">
			<img
				v-for="i in 3"
				:key="i"
				class="result-table__star"
				:class="`result-table__star--${i}`"
				:src="i <= stars ? starFullImg : starEmptyImg"
				alt=""
			/>
		</div>

		<div class="result-table__values">
			<div class="result-table__row result-table__row--score">
				<span>Score</span>
				<span class="result-table__total">{{
					shownTotal.toLocaleString('en-US')
				}}</span>
			</div>
			<div
				v-for="(b, i) in bonuses"
				v-show="i < bonusesShown"
				:key="b.label"
				class="result-table__bonus"
			>
				<span>+ {{ b.label }}</span>
				<span>+{{ b.points }}</span>
			</div>
			<!-- Ходы, время и серия — одной строкой плашек, чтобы окно
			     помещалось на телефон вместе с маскотом -->
			<div class="result-table__stats">
				<div class="result-table__stat">
					<small>{{ showTime ? 'Moves' : 'Items' }}</small>
					<b
						>{{ gameStore.curGameStat?.moves
						}}<i v-if="par !== null">/{{ par }}</i></b
					>
				</div>
				<div v-if="showTime" class="result-table__stat">
					<small>Time</small>
					<b>{{ gameStore.curGameStat.time.replace(/\s/g, '') }}</b>
				</div>
				<div v-if="maxCombo >= 2" class="result-table__stat">
					<small>Combo</small>
					<b>×{{ maxCombo }}</b>
				</div>
			</div>
			<div class="result-table__loot">
				<div
					v-for="g in lootGroups"
					:key="g.group"
					class="result-table__loot-item"
				>
					<img :src="g.img" alt="" />
					<span>×{{ g.count }}</span>
				</div>
			</div>
			<div v-if="goal !== null" class="result-table__goal">
				<img :src="starFullImg" alt="" />×3 — no more than {{ goal }} moves
			</div>
		</div>

		<div class="result-table__controls">
			<button
				v-if="nextLevel !== undefined"
				class="pill-btn pill-btn--gold"
				@click="next"
			>
				Next Level
			</button>
			<div class="result-table__row-btns">
				<button class="img-btn" aria-label="Levels" @click="routeTo(PAGES.LEVELS)">
					<img :src="homeImg" alt="" />
				</button>
				<button class="pill-btn pill-btn--purple" @click="reload">
					Replay
				</button>
			</div>
		</div>
	</div>
</template>

<script lang="ts" setup>
import { ref, computed, toRefs, onMounted, onBeforeUnmount } from 'vue'

import { PAGES } from '@/utils/conts'
import { ItemGroup, KnightMood, ITEM_IMG } from '@/game/items'

import starFullImg from '@/assets/img/game/star-full.webp'
import starEmptyImg from '@/assets/img/game/star-empty.webp'
import homeImg from '@/assets/img/game/ui/home.webp'
import knightHappy from '@/assets/img/game/knight/happy.webp'
import knightThink from '@/assets/img/game/knight/think.webp'
import knightCheer from '@/assets/img/game/knight/cheer.webp'

import { usePageStore } from '@/store/pageStore'
import { useGameStore } from '@/store/gameStore'

const KNIGHT_IMG: Record<KnightMood, string> = {
	happy: knightHappy,
	think: knightThink,
	cheer: knightCheer,
}

const LOOT_IMG: Record<ItemGroup, string> = {
	candy: ITEM_IMG['candy-pink'],
	star: ITEM_IMG.star,
	crystal: ITEM_IMG.crystal,
	crown: ITEM_IMG.crown,
}

const { routeTo } = usePageStore()

const $props = withDefaults(
	defineProps<{
		showTime: boolean
		title?: string
		// null — режим без звёзд (One Way, Time Attack)
		stars?: number | null
		// норма ходов на три звезды; показываем, если её не уложились
		goal?: number | null
		par?: number | null
		baseScore?: number
		bonuses?: { label: string; points: number }[]
		maxCombo?: number
		collected?: Record<ItemGroup, number>
		mood?: KnightMood
	}>(),
	{
		title: 'Game End',
		stars: null,
		goal: null,
		par: null,
		baseScore: 0,
		bonuses: () => [],
		maxCombo: 0,
		collected: () => ({ candy: 0, star: 0, crystal: 0, crown: 0 }),
		mood: 'cheer',
	}
)

const $emits = defineEmits(['reload'])

const gameStore = useGameStore()
const { nextLevel, selectLevel } = toRefs(useGameStore())

const lootGroups = computed(() =>
	(Object.keys(LOOT_IMG) as ItemGroup[])
		.filter((g) => $props.collected[g] > 0)
		.map((g) => ({ group: g, img: LOOT_IMG[g], count: $props.collected[g] }))
)

// Итог «собирается» на глазах: базовый счёт, затем по одному бонусы,
// и общая сумма докручивается после каждого.
const shownTotal = ref(0)
const bonusesShown = ref(0)
let timers: ReturnType<typeof setTimeout>[] = []
let raf = 0

function countTo(target: number, ms: number) {
	cancelAnimationFrame(raf)
	const from = shownTotal.value
	const start = performance.now()
	const step = (now: number) => {
		const t = Math.min(1, (now - start) / ms)
		shownTotal.value = Math.round(from + (target - from) * t)
		if (t < 1) raf = requestAnimationFrame(step)
	}
	raf = requestAnimationFrame(step)
}

onMounted(() => {
	timers.push(setTimeout(() => countTo($props.baseScore, 500), 500))
	let total = $props.baseScore
	$props.bonuses.forEach((b, i) => {
		timers.push(
			setTimeout(() => {
				bonusesShown.value = i + 1
				total += b.points
				countTo(total, 350)
			}, 1150 + i * 450)
		)
	})
})

onBeforeUnmount(() => {
	timers.forEach(clearTimeout)
	cancelAnimationFrame(raf)
})

function reload() {
	$emits('reload')
}

function next() {
	if (nextLevel.value === undefined) return
	selectLevel.value(nextLevel.value)
}
</script>

<style lang="scss" scoped>
/* Окно итогов: светлая карточка в золотой рамке, маскот над лентой,
   звёзды выскакивают по очереди, бонусы прилетают строками. */
.result-table {
	position: relative;
	margin: 96px auto 0;
	width: min(88vw, 380px);
	box-sizing: border-box;
	padding: 34px 18px 18px;
	background: #fcf3e5;
	border: 5px solid #fecb23;
	border-radius: 20px;
	box-shadow: inset 0 0 0 2px #fff, 0 0 0 4px #1a1033, 0 8px 0 4px #1a1033;
	color: #2a2457;
	animation: pop 0.28s ease-out both;

	&__knight {
		position: absolute;
		top: -104px;
		left: 50%;
		height: 92px;
		transform: translateX(-50%);
		filter: drop-shadow(0 4px 0 rgba(26, 16, 51, 0.4));
		animation: knight-bounce 0.9s ease-in-out infinite;
	}

	&__ribbon {
		position: absolute;
		top: -24px;
		left: 50%;
		transform: translateX(-50%);
		padding: 7px 26px;
		white-space: nowrap;
		background: linear-gradient(180deg, #ff6b6b 0%, #d6303a 100%);
		border: 4px solid #1a1033;
		border-radius: 14px;
		box-shadow: inset 0 3px 0 rgba(255, 255, 255, 0.3), 0 4px 0 #1a1033;
		color: #fff;
		font-size: 22px;
		font-weight: 800;
		letter-spacing: 1px;
		text-shadow: 0 2px 0 #1a1033;
	}

	&__stars {
		display: flex;
		justify-content: center;
		align-items: flex-end;
		gap: 4px;
		margin: 6px 0 6px;
	}

	&__star {
		width: 50px;
		height: 50px;
		opacity: 0;
		animation: star-pop 0.35s ease-out forwards;

		&--2 {
			width: 66px;
			height: 66px;
			margin-bottom: 10px;
		}

		&--1 {
			animation-delay: 0.25s;
		}
		&--2 {
			animation-delay: 0.45s;
		}
		&--3 {
			animation-delay: 0.65s;
		}
	}

	&__values {
		display: flex;
		flex-direction: column;
		gap: 6px;
		margin-bottom: 16px;
	}

	&__row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 5px 14px;
		background: #ece2f7;
		border-radius: 12px;
		font-size: 16px;
		font-weight: 700;

		span:last-child {
			font-size: 19px;
			font-weight: 800;
			color: #2a2457;
		}

		small {
			font-size: 14px;
			color: #8a86b5;
		}

		&--score {
			background: #2a2457;
			color: #fff;
			padding: 8px 14px;

			span:last-child {
				font-size: 26px;
				color: #ffe14f;
			}
		}
	}

	&__total {
		display: inline-block;
		font-variant-numeric: tabular-nums;
	}

	&__stats {
		display: flex;
		gap: 6px;
	}

	&__stat {
		flex: 1 1 0;
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 4px 2px;
		background: #ece2f7;
		border-radius: 12px;

		small {
			font-size: 12px;
			font-weight: 700;
			color: #5b5788;
		}

		b {
			font-size: 18px;
			font-weight: 800;
			white-space: nowrap;
			letter-spacing: 0;
		}

		i {
			font-style: normal;
			font-size: 13px;
			color: #8a86b5;
		}
	}

	&__bonus {
		display: flex;
		justify-content: space-between;
		padding: 0 14px;
		font-size: 14px;
		font-weight: 800;
		color: #d6303a;
		animation: bonus-in 0.35s ease-out;
	}

	&__loot {
		display: flex;
		justify-content: center;
		gap: 14px;
		margin-top: 2px;
	}

	&__loot-item {
		display: flex;
		flex-direction: column;
		align-items: center;
		font-size: 15px;
		font-weight: 800;

		img {
			width: 30px;
			height: 30px;
			object-fit: contain;
		}
	}

	&__goal {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 2px;
		font-size: 12px;
		font-weight: 700;
		color: #5b5788;

		img {
			width: 15px;
			height: 15px;
		}
	}

	&__controls {
		display: flex;
		flex-direction: column;
		align-items: stretch;
		gap: 10px;
	}

	&__row-btns {
		display: flex;
		gap: 10px;

		.pill-btn {
			flex: 1 1 auto;
		}
	}
}

/* Кнопки-«таблетки» с жёсткой тенью, как в макете */
.pill-btn {
	display: flex;
	align-items: center;
	justify-content: center;
	height: 50px;
	padding: 0 18px;
	border: 3px solid #1a1033;
	border-radius: 16px;
	font-family: inherit;
	font-size: 20px;
	font-weight: 800;
	letter-spacing: 1px;
	cursor: pointer;
	box-shadow: inset 0 3px 0 rgba(255, 255, 255, 0.4), 0 5px 0 #1a1033;

	&:active {
		transform: translateY(3px);
		box-shadow: inset 0 3px 0 rgba(255, 255, 255, 0.4), 0 2px 0 #1a1033;
	}

	&--gold {
		background: linear-gradient(180deg, #ffe680 0%, #fecb23 55%, #f5a400 100%);
		color: #1a1033;
		animation: next-pulse 1.4s ease-in-out 1.5s infinite;
	}

	&--purple {
		background: linear-gradient(180deg, #8c6cf5 0%, #5a3cc8 100%);
		color: #fff;
		text-shadow: 0 2px 0 #1a1033;
	}
}

.img-btn {
	flex: none;
	width: 56px;
	height: 56px;
	padding: 0;
	border: none;
	background: none;
	cursor: pointer;

	img {
		width: 100%;
		height: 100%;
		object-fit: contain;
		display: block;
	}

	&:active {
		transform: translateY(3px);
	}
}

@keyframes pop {
	from {
		transform: scale(0.8);
		opacity: 0;
	}
	to {
		transform: scale(1);
		opacity: 1;
	}
}

@keyframes star-pop {
	0% {
		transform: scale(0.2) rotate(-25deg);
		opacity: 0;
	}
	70% {
		transform: scale(1.2) rotate(6deg);
		opacity: 1;
	}
	100% {
		transform: scale(1) rotate(0);
		opacity: 1;
	}
}

@keyframes bump {
	0% {
		transform: scale(1);
	}
	40% {
		transform: scale(1.2);
	}
	100% {
		transform: scale(1);
	}
}

@keyframes bonus-in {
	from {
		transform: translateX(30px);
		opacity: 0;
	}
	to {
		transform: translateX(0);
		opacity: 1;
	}
}

@keyframes knight-bounce {
	0%,
	100% {
		transform: translateX(-50%) translateY(0);
	}
	50% {
		transform: translateX(-50%) translateY(-8px);
	}
}

@keyframes next-pulse {
	0%,
	100% {
		transform: scale(1);
	}
	50% {
		transform: scale(1.04);
	}
}
</style>
