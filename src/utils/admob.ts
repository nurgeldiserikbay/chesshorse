import {
	AdMob,
	BannerAdSize,
	BannerAdPosition,
	BannerAdPluginEvents,
	AdMobBannerSize,
	BannerAdOptions,
	InterstitialAdPluginEvents,
	AdLoadInfo,
	AdOptions,
	MaxAdContentRating,
} from '@capacitor-community/admob'
import { App as CapacitorApp } from '@capacitor/app'
import { StatusBar } from '@capacitor/status-bar'
import { Fullscreen } from '@boengli/capacitor-fullscreen'

// Целевая аудитория игры в Google Play включает детей, поэтому действует
// Families Policy: каждый рекламный запрос должен быть помечен как детский,
// ограничен инвентарём с рейтингом G и неперсонализирован. Отключение любого из
// этих флагов ради eCPM — это отказ на ревью с формулировкой «ad content is not
// consistent with the app's content rating».
const AdMobInitializationOptions = {
	// testingDevices: ['8a1b4b83d67add00', '1f6e845f97c74f32'],
	// Тестовый режим инициализации зависит от режима сборки:
	// dev -> тестовые объявления, prod -> боевые.
	initializeForTesting: import.meta.env.DEV,
	tagForChildDirectedTreatment: true,
	tagForUnderAgeOfConsent: true,
	maxAdContentRating: MaxAdContentRating.General,
}

// Страховка от «зависшего» показа: если Dismissed не пришёл и приложение не
// сообщило о возврате на передний план, блокировка игрового потока снимается по
// таймеру. Системные панели этот путь НЕ трогает — объявление может быть ещё на
// экране, и возврат immersive-режима спрятал бы его кнопку закрытия под панель.
const INTERSTITIAL_WATCHDOG_MS = 25_000

// Резерв под баннер: примерно столько занимает adaptive-баннер на телефоне.
// Пока настоящая высота неизвестна, рекламная зона стоит на этом значении и
// никогда не бывает нулевой — иначе вёрстка прыгает при приходе объявления.
const BANNER_RESERVE_HEIGHT = 56

class Admob {
	/** Куда сообщать о состоянии слота. Ставится из App.vue до initialize(). */
	private bannerListener: ((live: boolean, height: number) => void) | null = null

	/**
	 * Стоит ли на экране настоящее объявление.
	 *
	 * Отдельный флаг нужен потому, что `SizeChanged` о наличии объявления не
	 * говорит ничего: плагин рассылает его и на загрузке — с настоящим
	 * размером, и на отказе, скрытии, снятии — с нулями. Если считать слот
	 * живым по любому из них, после снятия баннера слот останется «живым» с
	 * нулевой высотой: кросс-промо спрячется, а на его месте будет пустая
	 * полоса.
	 */
	private bannerLoaded = false
	/** Последняя известная высота объявления. */
	private bannerHeightPx = 0

	/** Подписка страницы на состояние слота. Ставится до initialize(). */
	onBannerChange(listener: (live: boolean, height: number) => void) {
		this.bannerListener = listener
	}

	private publishBanner(live: boolean, height = 0) {
		this.bannerListener?.(live, height)
	}

	/**
	 * Нативный баннер рисуется поверх вебвью, а не внутри вёрстки, поэтому
	 * сама страница о нём ничего не знает. Через эту переменную она узнаёт
	 * высоту объявления и держит под него место.
	 *
	 * Это же и есть защита от «реклама перекрывает управление»:
	 * adaptive-баннер на планшете вырастает почти вдвое против телефонного, и
	 * фиксированный отступ под него промахивается.
	 *
	 * `null` — вернуться к резерву из вёрстки. Место при этом не исчезает: в
	 * нём просто снова появляется кросс-промо.
	 */
	private setSlotHeight(px: number | null) {
		if (typeof document === 'undefined') return
		const root = document.documentElement.style
		if (px === null) root.removeProperty('--ad-slot')
		else root.setProperty('--ad-slot', `${Math.max(44, Math.round(px))}px`)
	}

	/**
	 * Добавляет к рекламной зоне системный инсет — туда же, куда система
	 * отодвинула баннер.
	 *
	 * Ставится и снимается вместе с самим объявлением, а не один раз при
	 * старте: когда баннера нет, отодвигать не подо что — в полосе стоит
	 * кросс-промо, и лишний инсет оставит под ним пустую кромку.
	 *
	 * Само число здесь не считается и не может: его знает браузер и отдаёт
	 * через `env(safe-area-inset-bottom)`. Переменной присваивается выражение,
	 * а не результат: инсет меняется вместе с системными панелями, и вычислять
	 * его должен CSS. Требует `viewport-fit=cover` в `index.html`.
	 */
	private setBannerInset(on: boolean) {
		if (typeof document === 'undefined') return
		const root = document.documentElement.style
		if (on) root.setProperty('--ad-inset', 'env(safe-area-inset-bottom, 0px)')
		else root.removeProperty('--ad-inset')
	}

	/** Слот пуст: место остаётся, но в нём снова кросс-промо. */
	private clearBanner() {
		this.bannerLoaded = false
		this.bannerHeightPx = 0
		this.setSlotHeight(null)
		this.setBannerInset(false)
		this.publishBanner(false)
	}

	// Флаги, чтобы не подписываться на события повторно (иначе утечка слушателей).
	private bannerListenersRegistered = false
	private interstitialListenersRegistered = false

	// Текущий колбэк закрытия интерстишла (обнуляется после срабатывания — дедуп).
	private onInterstitialClosed: (() => void) | null = null
	private interstitialClosed = true
	// Приложение уходило в фон во время показа. Activity объявления принадлежит
	// SDK, поэтому её открытие выглядит для нас как уход в фон, а возврат на
	// передний план после этого означает, что объявление закрыто.
	private sawBackgroundDuringShow = false
	private watchdogId: ReturnType<typeof setTimeout> | undefined
	// Состояние предзагруженного объявления.
	private interstitialReady = false
	private interstitialLoading = false
	// Системные панели подняты ради показа объявления и ждут обратной уборки.
	private barsShownForAd = false

	// Частотный кап интерстишла.
	private interstitialGameCount = 0
	private lastInterstitialAt = 0
	private readonly INTERSTITIAL_EVERY_N = 3 // показывать не чаще, чем каждую 3-ю партию
	private readonly INTERSTITIAL_MIN_INTERVAL_MS = 75_000 // и не чаще раза в ~75 c

	// Детская конфигурация запросов применяется именно в initialize(), поэтому ни
	// один запрос рекламы не должен уйти раньше. Промис кэшируется: точки показа
	// рекламы ждут этот же промис, повторная инициализация не происходит.
	private initPromise: Promise<void> | null = null
	private initialized = false

	initialize() {
		if (!this.initPromise) {
			this.initPromise = this.runInitialize()
		}
		return this.initPromise
	}

	private async runInitialize() {
		await AdMob.initialize(AdMobInitializationOptions)
		this.initialized = true

		this.registerInterstitialListeners()

		// Форму согласия UMP осознанно не запрашиваем. Запросы помечены
		// tagForUnderAgeOfConsent, а у пользователя ниже возраста согласия согласие
		// на персонализацию не спрашивают — показывать ему форму выбора
		// персонализации неверно и по GDPR, и по Families Policy.
		// Неперсонализированную выдачу обеспечивает npa: true в каждом запросе.
	}

	// Подписка на события баннера — только один раз за жизнь приложения.
	private registerBannerListeners() {
		if (this.bannerListenersRegistered) return
		this.bannerListenersRegistered = true

		AdMob.addListener(BannerAdPluginEvents.Loaded, () => {
			this.bannerLoaded = true
			this.setBannerInset(true)
			this.publishBanner(true, this.bannerHeightPx || BANNER_RESERVE_HEIGHT)
		})

		// Нет заполнения, нет сети, нет объявления: место остаётся за слотом,
		// но рисует в нём снова кросс-промо. Обнулять резерв нельзя — вёрстка
		// прыгнет ровно так же, как прыгала при появлении баннера.
		AdMob.addListener(BannerAdPluginEvents.FailedToLoad, () => {
			this.clearBanner()
		})

		AdMob.addListener(
			BannerAdPluginEvents.SizeChanged,
			(size: AdMobBannerSize) => {
				// Нули означают, что баннера на экране нет: отказ, скрытие или
				// снятие. Не «объявление нулевой высоты», а его отсутствие.
				if (!size.height) {
					this.clearBanner()
					return
				}

				// Настоящая высота заменяет резерв, как только стала известна. О
				// самом наличии объявления это событие не говорит, поэтому
				// состояние слота остаётся тем, какое было.
				this.bannerHeightPx = size.height
				this.setSlotHeight(size.height)
				this.setBannerInset(true)
				this.publishBanner(this.bannerLoaded, size.height)
			}
		)
	}

	async showBanner() {
		// Ждём детскую конфигурацию; если инициализация упала — баннер не
		// запрашиваем, показать нетегированный запрос хуже, чем не показать ничего.
		await this.initialize().catch((error) => console.log(error))
		if (!this.initialized) return

		this.registerBannerListeners()

		const options: BannerAdOptions = {
			adId: 'ca-app-pub-9702825788968948/5814818821',
			adSize: BannerAdSize.ADAPTIVE_BANNER,
			position: BannerAdPosition.BOTTOM_CENTER,
			margin: 0,
			isTesting: import.meta.env.VITE_APP_MODE === 'TEST',
			npa: true,
		}

		await AdMob.showBanner(options)

		// Греем интерстишл заранее, чтобы точка показа ничего не ждала.
		void this.preloadInterstitial()
	}

	async resumeBanner() {
		await AdMob.resumeBanner()
	}

	async hideBanner() {
		await AdMob.hideBanner()
		// Объявление ушло с экрана — слот снова наш.
		this.clearBanner()
	}

	async removeBanner() {
		await AdMob.removeBanner()
		// Объявление ушло с экрана — слот снова наш.
		this.clearBanner()
	}

	// Подписка на события интерстишла — только один раз за жизнь приложения.
	private registerInterstitialListeners() {
		if (this.interstitialListenersRegistered) return
		this.interstitialListenersRegistered = true

		AdMob.addListener(InterstitialAdPluginEvents.Loaded, (info: AdLoadInfo) => {
			console.log(info)
			this.interstitialReady = true
			this.interstitialLoading = false
		})
		AdMob.addListener(InterstitialAdPluginEvents.Dismissed, () => {
			console.log('Dismissed')
			this.interstitialReady = false
			this.handleInterstitialClosed()
		})
		AdMob.addListener(InterstitialAdPluginEvents.FailedToLoad, () => {
			console.log('FailedToLoad')
			this.interstitialReady = false
			this.interstitialLoading = false
			this.handleInterstitialClosed()
		})
		AdMob.addListener(InterstitialAdPluginEvents.FailedToShow, () => {
			console.log('FailedToShow')
			this.interstitialReady = false
			this.handleInterstitialClosed()
		})

		// Второй, независимый от SDK механизм закрытия: событие Dismissed на части
		// устройств теряется, а возврат приложения на передний план после ухода в
		// фон означает, что activity объявления уже завершилась.
		CapacitorApp.addListener('appStateChange', ({ isActive }) => {
			if (!isActive) {
				if (!this.interstitialClosed) this.sawBackgroundDuringShow = true
				return
			}

			if (!this.interstitialClosed && this.sawBackgroundDuringShow) {
				this.handleInterstitialClosed()
			} else {
				// Поток мог быть разблокирован страхующим таймером раньше, чем игрок
				// закрыл объявление — тогда панели всё ещё подняты.
				this.restoreBarsAfterAd()
			}
		})
	}

	// Объявление точно ушло с экрана.
	private handleInterstitialClosed() {
		this.releaseInterstitialFlow()
		this.restoreBarsAfterAd()
	}

	// Снимает только блокировку игрового потока, не касаясь системных панелей:
	// вызывается в том числе страхующим таймером, когда объявление, возможно, ещё
	// на экране. Колбэк гарантированно вызывается один раз на показ.
	private releaseInterstitialFlow() {
		if (this.interstitialClosed) return
		this.interstitialClosed = true
		this.sawBackgroundDuringShow = false
		if (this.watchdogId) {
			clearTimeout(this.watchdogId)
			this.watchdogId = undefined
		}
		const cb = this.onInterstitialClosed
		this.onInterstitialClosed = null
		if (cb) cb()

		void this.preloadInterstitial()
	}

	// Immersive-режим возвращается ровно один раз и только после того, как
	// объявление действительно закрылось.
	private restoreBarsAfterAd() {
		if (!this.barsShownForAd) return
		this.barsShownForAd = false
		void this.restoreImmersiveMode()
	}

	// Пока показывается полноэкранная реклама, системные панели должны быть видны.
	// Activity объявления принадлежит SDK, а с Android 15 система рисует его
	// edge-to-edge: если игра держит immersive-режим, кнопка закрытия может
	// оказаться под навигационной панелью или вырезом — ровно то, что ревью
	// описывает как «unclosable ads».
	private async showSystemBars() {
		this.barsShownForAd = true

		try {
			await Fullscreen.deactivateImmersiveMode()
			await StatusBar.show()
		} catch (error) {
			console.log(error)
		}
	}

	private async restoreImmersiveMode() {
		try {
			await Fullscreen.activateImmersiveMode()
			await StatusBar.hide()
		} catch (error) {
			console.log(error)
		}
	}

	// Грузит объявление заранее, вне точки показа. initialize() здесь не
	// ожидается намеренно: метод вызывается и из самой инициализации.
	async preloadInterstitial() {
		if (!this.initialized) return
		if (this.interstitialReady || this.interstitialLoading) return

		this.interstitialLoading = true

		try {
			await AdMob.prepareInterstitial(this.interstitialOptions())
			this.interstitialReady = true
		} catch (error) {
			console.log(error)
			this.interstitialReady = false
		} finally {
			this.interstitialLoading = false
		}
	}

	private interstitialOptions(): AdOptions {
		return {
			adId: 'ca-app-pub-9702825788968948/5638576464',
			isTesting: import.meta.env.VITE_APP_MODE === 'TEST',
			npa: true,
			// immersiveMode осознанно не выставляем: с Android 15 (edge-to-edge)
			// он уводит кнопку закрытия рекламы под системные панели/вырез, и
			// объявление становится незакрываемым — это отказ по Families Policy.
		}
	}

	async interstitial({
		isFirst = false,
		onInterstitialAdClosed,
	}: {
		isFirst?: boolean
		onInterstitialAdClosed: () => void
	}) {
		// Во всех отказных ветках колбэк вызывается сразу же: точка показа никогда
		// не остаётся висеть в ожидании рекламы.
		if (!this.initialized) {
			onInterstitialAdClosed()
			return
		}

		this.registerInterstitialListeners()

		// Первая партия и частотный кап — реклама не показывается. Раньше при
		// isFirst === true объявление готовилось, но не показывалось, и колбэк не
		// вызывался вообще: вызывающий код ждал его вечно.
		this.interstitialGameCount += 1
		const now = Date.now()
		const capByCount = this.interstitialGameCount % this.INTERSTITIAL_EVERY_N !== 0
		const capByTime =
			now - this.lastInterstitialAt < this.INTERSTITIAL_MIN_INTERVAL_MS

		if (isFirst || capByCount || capByTime) {
			onInterstitialAdClosed()
			void this.preloadInterstitial()
			return
		}

		// Объявление не готово — ждать загрузку нельзя, это и есть «реклама мешает
		// пользоваться приложением». Пропускаем показ и греем следующее.
		if (!this.interstitialReady) {
			onInterstitialAdClosed()
			void this.preloadInterstitial()
			return
		}

		this.interstitialReady = false
		this.onInterstitialClosed = onInterstitialAdClosed
		this.interstitialClosed = false
		this.sawBackgroundDuringShow = false
		this.lastInterstitialAt = now

		await this.showSystemBars()
		this.watchdogId = setTimeout(() => {
			console.log('Interstitial dismiss watchdog fired')
			this.releaseInterstitialFlow()
		}, INTERSTITIAL_WATCHDOG_MS)

		try {
			await AdMob.showInterstitial()
		} catch (error) {
			console.log(error)
			this.handleInterstitialClosed()
		}
	}
}

export default new Admob()
