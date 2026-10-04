import levels from './levels'
import bgValley from '@/assets/img/game/bg-valley.webp'

export type GAME_TYPE = 'COLLECT_ALL' | 'NO_WAY_BACK' | 'BY_TIME'

export const GAME_TYPES: { [key in GAME_TYPE]: GAME_TYPE } = {
	COLLECT_ALL: 'COLLECT_ALL',
	NO_WAY_BACK: 'NO_WAY_BACK',
	BY_TIME: 'BY_TIME',
}

export type PagesType = 'START' | 'LEVELS' | 'PLAYGROUND' | 'LEVELTYPES'

export const PAGES: { [key in PagesType]: PagesType } = {
	START: 'START',
	LEVELS: 'LEVELS',
	PLAYGROUND: 'PLAYGROUND',
	LEVELTYPES: 'LEVELTYPES',
}

export const LEVELS = levels

export const GAME_SETTINGS = [
	{
		id: 0,
		board1: '#2C235C',
		board2: '#2C235C',
		// Сказочная долина из макета; цвет под картинкой — небо, на случай
		// пока она грузится.
		bodyBg: `#1c9dfd url(${bgValley}) center / cover no-repeat`,
		boardBorder: 'linear-gradient(135deg, #000d2e 0%, #000d2e 100%)',
		horse: 'horse-1',
		board: 'board-1',
		coinBg:
			'radial-gradient(circle, rgba(255,143,143,1) 0%, rgba(255,0,0,1) 36%, rgba(111,18,18,1) 76%)',
		mainColor: '#2156d6',
	},
	{
		id: 1,
		board1: '#E47702',
		board2: '#E47702',
		bodyBg:
			'radial-gradient(circle, rgba(83, 101, 210, 1) 0%, rgba(3, 34, 110, 1) 100%)',
		boardBorder: '#713f09',
		horse: 'horse-2',
		board: 'board-2',
		coinBg:
			'radial-gradient(circle, rgba(132,168,255,1) 0%, rgba(33,86,214,1) 46%, rgba(16,50,133,1) 73%)',
		mainColor: '#E47702',
	},
	{
		id: 2,
		board1: '#FA3C3C',
		board2: '#FA3C3C',
		bodyBg:
			'radial-gradient(circle, rgba(83, 101, 210, 1) 0%, rgba(3, 34, 110, 1) 100%)',
		boardBorder: '#c10202',
		horse: 'horse-3',
		board: 'board-3',
		coinBg:
			'radial-gradient(circle, rgba(79,235,113,1) 0%, rgba(20,120,42,1) 46%, rgba(20,120,42,1) 73%)',
		mainColor: '#FA3C3C',
	},
	{
		id: 3,
		board1: '#14782A',
		board2: '#14782A',
		bodyBg:
			'radial-gradient(circle, rgba(83, 101, 210, 1) 0%, rgba(3, 34, 110, 1) 100%)',
		boardBorder: '#00c72b',
		horse: 'horse-4',
		board: 'board-4',
		coinBg:
			'radial-gradient(circle, rgba(255,194,129,1) 0%, rgba(228,119,2,1) 46%, rgba(131,73,11,1) 73%)',
		mainColor: '#14782A',
	},
]
