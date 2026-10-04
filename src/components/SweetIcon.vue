<template>
	<!-- Сладости вместо монет: плоские, с тёмной обводкой, как конь -->
	<svg viewBox="0 0 100 100" aria-hidden="true">
		<template v-if="kind === 'candy'">
			<path d="M30 50 L8 34 L12 50 L8 66 Z" fill="#ff8fc0" stroke="#1a1033" stroke-width="5" stroke-linejoin="round" stroke-linecap="round" />
			<path d="M70 50 L92 34 L88 50 L92 66 Z" fill="#ff8fc0" stroke="#1a1033" stroke-width="5" stroke-linejoin="round" stroke-linecap="round" />
			<ellipse cx="50" cy="50" rx="24" ry="19" fill="#ff4f93" stroke="#1a1033" stroke-width="5" stroke-linejoin="round" stroke-linecap="round" />
			<path d="M40 34 C46 44 46 56 40 66 M56 33 C62 43 62 57 56 67" fill="none" stroke="#ffd1e5" stroke-width="5" />
			<ellipse cx="50" cy="50" rx="24" ry="19" fill="none" stroke="#1a1033" stroke-width="5" stroke-linejoin="round" stroke-linecap="round" />
		</template>
		<template v-else-if="kind === 'lollipop'">
			<rect x="46" y="58" width="9" height="38" rx="3" fill="#fff6e0" stroke="#1a1033" stroke-width="5" stroke-linejoin="round" stroke-linecap="round" />
			<circle cx="50" cy="40" r="30" fill="#ffdf3d" stroke="#1a1033" stroke-width="5" stroke-linejoin="round" stroke-linecap="round" />
			<path d="M50 40 m0 -4 a4 4 0 1 1 -4 4 a9 9 0 1 1 9 9 a14 14 0 1 1 -14 -14 a19 19 0 1 1 19 19" fill="none" stroke="#ff4f6e" stroke-width="5" stroke-linecap="round" />
			<circle cx="50" cy="40" r="30" fill="none" stroke="#1a1033" stroke-width="5" stroke-linejoin="round" stroke-linecap="round" />
		</template>
		<template v-else-if="kind === 'donut'">
			<circle cx="50" cy="52" r="38" fill="#e8a25a" stroke="#1a1033" stroke-width="5" stroke-linejoin="round" stroke-linecap="round" />
			<path d="M14 48 C16 26 32 14 50 14 C68 14 84 26 86 48 C82 56 76 50 72 58 C66 66 60 56 52 62 C44 68 38 58 30 62 C22 66 18 54 14 48 Z" fill="#ff7eb6" stroke="#1a1033" stroke-width="5" stroke-linejoin="round" stroke-linecap="round" />
			<circle cx="50" cy="44" r="10" fill="#7d8ce6" stroke="#1a1033" stroke-width="5" stroke-linejoin="round" stroke-linecap="round" />
			<path d="M28 34 l5 -3 M66 28 l5 3 M70 46 l3 5 M36 52 l-4 3 M48 24 l5 0" stroke="#fff" stroke-width="4" stroke-linecap="round" />
		</template>
		<template v-else>
			<path d="M22 56 L78 56 L70 94 L30 94 Z" fill="#5bc8f5" stroke="#1a1033" stroke-width="5" stroke-linejoin="round" stroke-linecap="round" />
			<path d="M38 58 L41 92 M50 58 L50 92 M62 58 L59 92" stroke="#1a1033" stroke-width="3.5" />
			<path d="M18 58 C12 48 20 38 30 40 C30 28 42 22 50 26 C58 22 70 28 70 40 C80 38 88 48 82 58 Z" fill="#fff4f8" stroke="#1a1033" stroke-width="5" stroke-linejoin="round" stroke-linecap="round" />
			<circle cx="50" cy="20" r="9" fill="#ff3b5c" stroke="#1a1033" stroke-width="5" stroke-linejoin="round" stroke-linecap="round" />
			<path d="M53 12 C55 6 60 4 64 4" fill="none" stroke="#1a1033" stroke-width="3.5" />
		</template>
	</svg>
</template>

<script lang="ts" setup>
import { SweetKind } from '@/game/sweets'

defineProps<{ kind: SweetKind }>()
</script>
