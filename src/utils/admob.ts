import {
	AdMob,
	AdmobConsentStatus,
	BannerAdSize,
	BannerAdPosition,
	BannerAdPluginEvents,
	AdMobBannerSize,
	BannerAdOptions,
	InterstitialAdPluginEvents,
	AdLoadInfo,
	AdOptions,
} from '@capacitor-community/admob'

const AdMobInitializationOptions = {
	// testingDevices: ['8a1b4b83d67add00', '1f6e845f97c74f32'],
	// Тестовый режим инициализации зависит от режима сборки:
	// dev -> тестовые объявления, prod -> боевые.
	initializeForTesting: import.meta.env.DEV,
	// Было true. Выключено, чтобы не ограничивать форматы/персонализацию.
	// TODO: владельцу — сверить с декларацией целевой аудитории в Google Play Console.
	tagForChildDirectedTreatment: false,
}

class Admob {
	// Флаги, чтобы не подписываться на события повторно (иначе утечка слушателей).
	private bannerListenersRegistered = false
	private interstitialListenersRegistered = false

	// Текущий колбэк закрытия интерстишла (обнуляется после срабатывания — дедуп).
	private onInterstitialClosed: (() => void) | null = null

	// Частотный кап интерстишла.
	private interstitialGameCount = 0
	private lastInterstitialAt = 0
	private readonly INTERSTITIAL_EVERY_N = 3 // показывать не чаще, чем каждую 3-ю партию
	private readonly INTERSTITIAL_MIN_INTERVAL_MS = 75_000 // и не чаще раза в ~75 c

	async initialize() {
		await AdMob.initialize(AdMobInitializationOptions)

		const [trackingInfo, consentInfo] = await Promise.all([
			AdMob.trackingAuthorizationStatus(),
			AdMob.requestConsentInfo(),
		])

		if (trackingInfo.status === 'notDetermined') {
			// console.log('Display information before ads load first time')
		} else if (
			trackingInfo.status === 'authorized' &&
			consentInfo.isConsentFormAvailable &&
			consentInfo.status === AdmobConsentStatus.REQUIRED
		) {
			await AdMob.showConsentForm()
		}
	}

	// Подписка на события баннера — только один раз за жизнь приложения.
	private registerBannerListeners() {
		if (this.bannerListenersRegistered) return
		this.bannerListenersRegistered = true

		AdMob.addListener(BannerAdPluginEvents.Loaded, () => {
			// Subscribe Banner Event Listener
		})

		AdMob.addListener(
			BannerAdPluginEvents.SizeChanged,
			(size: AdMobBannerSize) => {
				console.log(size)
				// Subscribe Change Banner Size
			}
		)
	}

	async showBanner() {
		this.registerBannerListeners()

		const options: BannerAdOptions = {
			adId: 'ca-app-pub-9702825788968948/5814818821',
			adSize: BannerAdSize.ADAPTIVE_BANNER,
			position: BannerAdPosition.BOTTOM_CENTER,
			margin: 0,
			isTesting: import.meta.env.VITE_APP_MODE === 'TEST',
			// npa: true
		}

		await AdMob.showBanner(options)
	}

	async resumeBanner() {
		await AdMob.resumeBanner()
	}

	async hideBanner() {
		await AdMob.hideBanner()
	}

	async removeBanner() {
		await AdMob.removeBanner()
	}

	// Подписка на события интерстишла — только один раз за жизнь приложения.
	private registerInterstitialListeners() {
		if (this.interstitialListenersRegistered) return
		this.interstitialListenersRegistered = true

		const handleClose = () => {
			if (this.onInterstitialClosed) {
				const cb = this.onInterstitialClosed
				this.onInterstitialClosed = null
				cb()
			}
		}

		AdMob.addListener(InterstitialAdPluginEvents.Loaded, (info: AdLoadInfo) => {
			console.log(info)
		})
		AdMob.addListener(InterstitialAdPluginEvents.Dismissed, () => {
			console.log('Dismissed')
			handleClose()
		})
		AdMob.addListener(InterstitialAdPluginEvents.FailedToLoad, () => {
			console.log('FailedToLoad')
			handleClose()
		})
		AdMob.addListener(InterstitialAdPluginEvents.FailedToShow, () => {
			console.log('FailedToShow')
			handleClose()
		})
	}

	async interstitial({
		isFirst,
		onInterstitialAdClosed,
	}: {
		isFirst: boolean
		onInterstitialAdClosed: () => void
	}) {
		this.registerInterstitialListeners()

		// Частотный кап: реклама вызывается на каждый старт/рестарт партии,
		// но реально показываем не чаще, чем каждую N-ю партию и не чаще
		// одного раза в INTERSTITIAL_MIN_INTERVAL_MS.
		this.interstitialGameCount += 1
		const now = Date.now()
		const capByCount = this.interstitialGameCount % this.INTERSTITIAL_EVERY_N !== 0
		const capByTime =
			now - this.lastInterstitialAt < this.INTERSTITIAL_MIN_INTERVAL_MS

		if (!isFirst && (capByCount || capByTime)) {
			// Показ пропускаем — сразу продолжаем игру.
			onInterstitialAdClosed()
			return
		}

		this.onInterstitialClosed = onInterstitialAdClosed

		const options: AdOptions = {
			adId: 'ca-app-pub-9702825788968948/5638576464',
			isTesting: import.meta.env.VITE_APP_MODE === 'TEST',
			// npa: true
		}

		try {
			await AdMob.prepareInterstitial(options)
			if (!isFirst) {
				await AdMob.showInterstitial()
				this.lastInterstitialAt = Date.now()
			}
		} catch (error) {
			// Если реклама не подготовилась/не показалась — не блокируем игру.
			if (this.onInterstitialClosed) {
				const cb = this.onInterstitialClosed
				this.onInterstitialClosed = null
				cb()
			}
		}
	}
}

export default new Admob()
