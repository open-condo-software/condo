import { getCookie, setCookie } from 'cookies-next'
import React, { createContext, useState, useCallback, useContext } from 'react'

import { isSSR } from './environment'

import { useEffectOnce } from '../hooks/useEffectOnce'

import type { IncomingMessage, ServerResponse } from 'http'
import type { Context, PropsWithChildren, FC, ComponentType as ReactComponentType } from 'react'


type Optional<T> = T | undefined

/**
 * Based on RFC5646: https://datatracker.ietf.org/doc/html/rfc5646
 */
export type LocaleInfo = {
    /** primary language tag, like "en", "zh", "ru", affects everything in messages */
    primary: string
    /** extended language tag, which specify language dialect like "gan" in Gan Chinese ("zh-gan"), affects almost nothing  */
    extended: Optional<string>
    /** region tag, like "US", "CN", which usually does not affect messages itself, but number / currency formatting */
    region: Optional<string>
    /** script tag, like "Latn", "Cyrl", which refers to used script / alphabet. Affects all messages */
    script: Optional<string>
}

export type AcceptLanguageInfo = LocaleInfo & {
    /** number in [0.0, 1.0] range to order languages by. The larger the number, the more locale is preferred */
    quality: number
}

export type LocaleSelection<AvailableLocale extends string> = {
    /** Locale from list of apps available locales, used for language selection and messages loading. Example: "en" */
    selectedLocale: AvailableLocale
    /** Full locale, which must be passed to tools such react-intl. Can be equal sub-locale of selectedLocale or equal to it. Example: "en-GB" */
    fullLocale: string
}

export type PrefetchResult<
    AvailableLocale extends string,
    MessagesShape extends Record<string, string>,
> = LocaleSelection<AvailableLocale> & { messages: MessagesShape }

type SSRResult<PropsType extends Record<string, unknown>> = {
    props: PropsType
}
type SSRResultWithI18N<
    AvailableLocale extends string,
    MessagesShape extends Record<string, string>,
    PropsType extends Record<string, unknown>,
> = {
    props: PropsType & {
        [I18N_SELECTED_LOCALE_PROP_NAME]?: AvailableLocale
        [I18N_FULL_LOCALE_PROP_NAME]?: string
        [I18N_MESSAGES_PROP_NAME]?: MessagesShape
    }
}

type AppInitialProps<PropsType extends Record<string, unknown>> = { pageProps: PropsType }

type AppContext = {
    ctx: {
        req: Optional<IncomingMessage>
        res: Optional<ServerResponse>
    }
}

type AppType<PropsType extends Record<string, unknown>, ComponentType, RouterType> =
    ReactComponentType<{ pageProps: PropsType, Component: ComponentType, router: RouterType }> & {
        getInitialProps?: (context: AppContext) => Promise<AppInitialProps<PropsType>> | AppInitialProps<PropsType>
    }

type TranslationsContextType<
    AvailableLocale extends string,
    MessagesShape extends Record<string, string>,
> = {
    /**
     * Selected locale, which is used to determine, what messages set to show to user.
     * For example: "en"
     * */
    selectedLocale: AvailableLocale
    /**
     * Original locale, from which `selectedLocale` was chosen. Sub-locale of `selectedLocale`.
     * Should be passed to tools such as `intl`, since it can contain additional info helping with number-formating and so on
     * For example: "en-GB"
     */
    fullLocale: string
    /** Extracted messages to pass into `intl` or any similar tools  */
    messages: MessagesShape | undefined
    /** Callback to change current language */
    switchLocale(newLocale: AvailableLocale): void
}

/**
 * Translations helper which is used to parse / stringify locales,
 * select most suitable locale based on user preferences, load partial translations with caching and many others
 *
 * @example Init helper inside your app and re-export utils
 * import fetch from 'cross-fetch'
 * import getConfig from 'next/config'
 * import { IntlProvider as DefaultIntlProvider } from 'react-intl'
 *
 * import { TranslationsHelper } from '@open-condo/miniapp-utils/helpers/i18n'
 * import type { TranslationsProviderProps } from '@open-condo/miniapp-utils/helpers/i18n'
 *
 * import { LOCALES, DEFAULT_LOCALE } from '@/domains/common/constants/locales'
 *
 * import type { MessagesKeysType } from '@/global'
 * import type { FC, PropsWithChildren } from 'react'
 *
 * const { publicRuntimeConfig: { serviceUrl } } = getConfig()
 *
 * export type AvailableLocale = typeof LOCALES[number]
 * export type MessagesShape = Record<MessagesKeysType, string>
 *
 * const translationsAPIEndpoint = `${serviceUrl}/api/translations`
 *
 * async function loadDefaultMessages (): Promise<MessagesShape> {
 *     return (await import(`@/lang/${DEFAULT_LOCALE}.json`)).default
 * }
 *
 * async function loadMessages (locale: AvailableLocale): Promise<MessagesShape> {
 *     const response = await fetch(`${translationsAPIEndpoint}/${locale}`)
 *     if (!response.ok) throw new Error(`Could not load translations for ${locale} locale`)
 *     return response.json()
 * }
 *
 * const translationsHelper = new TranslationsHelper({
 *     locales: LOCALES,
 *     defaultLocale: DEFAULT_LOCALE,
 *     loadMessages,
 *     loadDefaultMessages,
 * })
 *
 * export type { PrefetchResult } from '@open-condo/miniapp-utils/helpers/i18n'
 *
 * export const prefetchTranslations = translationsHelper.prefetchTranslations
 * export const extractI18NInfo = translationsHelper.extractI18NInfo
 * export const useTranslationsExtractor = translationsHelper.getUseTranslationsExtractorHook()
 * export const TranslationsProvider: FC<TranslationsProviderProps<AvailableLocale, MessagesShape>> = translationsHelper.getTranslationsProvider()
 * export const useTranslations = translationsHelper.getUseTranslationsHook()
 *
 * export const IntlProvider: FC<PropsWithChildren> = ({ children }) => {
 *     const { messages, fullLocale } = useTranslations()
 *
 *     return (
 *         <DefaultIntlProvider locale={fullLocale} messages={messages}>
 *             {children}
 *         </DefaultIntlProvider>
 *     )
 * }
 *
 * @example use in _app.tsx SSR to prefetch translations
 * const translationsData = await prefetchTranslations(req, res)
 *
 * return extractI18NInfo(translationsData, {
 *     props: {},
 * })
 *
 * @example use in _app.tsx global layout to provide translations
 * const { initialSelectedLocale, initialFullLocale, initialMessages } = useTranslationsExtractor(pageProps)
 *
 * return (
 *       <TranslationsProvider
 *                 initialSelectedLocale={initialSelectedLocale}
 *                 initialFullLocale={initialFullLocale}
 *                 initialMessages={initialMessages}
 *       >
 *          <IntlProvider>
 *              {children}
 *          </IntlProvider>
 *       </TranslationsProvider>
 * )
 * */
export type TranslationsProviderProps<
    AvailableLocale extends string,
    MessagesShape extends Record<string, string>,
> = PropsWithChildren<{
    initialSelectedLocale: AvailableLocale
    initialFullLocale: string
    initialMessages: MessagesShape | undefined
}>

type TranslationsHelperOptions<
    AvailableLocale extends string,
    MessagesShape extends Record<string, string>,
> = {
    locales: ReadonlyArray<AvailableLocale>
    defaultLocale: AvailableLocale
    loadDefaultMessages: () => Promise<MessagesShape>
    loadMessages: (locale: AvailableLocale) => Promise<Partial<MessagesShape>>
    localeCookieName?: string
    localeQueryParam?: string
}

type LocalePartMatcher = {
    part: 'primary' | 'extended' | 'script' | 'region'
    matcher: RegExp
}

const LOCALE_PARSING_OPTIONS: Array<LocalePartMatcher> = [
    { part: 'primary', matcher: /^[a-z]+$/ },
    { part: 'extended', matcher: /^[a-z]{3}$/ },
    { part: 'script', matcher: /^[A-Z][a-z]{3,}$/ },
    { part: 'region', matcher: /^([A-Z]{2,3}|[0-9]{3})$/ },
]

const LOCALE_RESOLVE_ORDER: Array<Array<keyof LocaleInfo>> = [
    // Full resolution first
    ['primary', 'extended', 'script', 'region'],
    // Extended usually does not affect message a lot, so it can be omitted first
    ['primary', 'script', 'region'],
    // Primary + script is more important, since script change alphabet
    ['primary', 'script'],
    ['primary', 'region'],
    ['primary', 'extended'],
    ['primary'],
]

const I18N_SELECTED_LOCALE_PROP_NAME = '__I18N_SELECTED_LOCALE__'
const I18N_FULL_LOCALE_PROP_NAME = '__I18N_FULL_LOCALE__'
const I18N_MESSAGES_PROP_NAME = '__I18N_MESSAGES__'

export class TranslationsHelper<
    AvailableLocale extends string,
    MessagesShape extends Record<string, string>,
> {
    private readonly _locales: Set<string>
    private readonly _defaultLocale: AvailableLocale
    private _context: Context<TranslationsContextType<AvailableLocale, MessagesShape>> | undefined
    private readonly _loadMessages: (locale: AvailableLocale) => Promise<Partial<MessagesShape>>
    private readonly _loadDefaultMessages: () => Promise<MessagesShape>
    private readonly _translations: Partial<Record<AvailableLocale, MessagesShape>> = {}
    private _defaultMessages: MessagesShape | undefined
    readonly localeCookieName: string = 'NEXT_LOCALE'
    readonly localeQueryParam: string | undefined = undefined

    constructor (options: TranslationsHelperOptions<AvailableLocale, MessagesShape>) {
        this._locales = new Set(options.locales)
        this._defaultLocale = options.defaultLocale
        this._loadMessages = options.loadMessages
        this._loadDefaultMessages = options.loadDefaultMessages

        if (options.localeCookieName) {
            this.localeCookieName = options.localeCookieName
        }
        if (options.localeQueryParam) {
            this.localeQueryParam = options.localeQueryParam
        }

        this.getTranslationsProvider = this.getTranslationsProvider.bind(this)
        this.getUseTranslationsHook = this.getUseTranslationsHook.bind(this)
        this.getUseTranslationsExtractorHook = this.getUseTranslationsExtractorHook.bind(this)
        this.getPreferredLocale = this.getPreferredLocale.bind(this)
        this.selectSupportedLocale = this.selectSupportedLocale.bind(this)
        this.getTranslations = this.getTranslations.bind(this)
        this.prefetchTranslations = this.prefetchTranslations.bind(this)
        this.getHOC = this.getHOC.bind(this)
    }

    /**
     * This util parses language-defining string according to RFC5646: https://datatracker.ietf.org/doc/html/rfc5646
     * It also automatically detect and accept-language header format by enhancing result with quality info
     */
    static parseLocaleString (localeString: string): AcceptLanguageInfo {
        const stringParts = localeString.trim().split(';')
        const localeParts = stringParts[0].split('-')

        const quality = stringParts.length > 1
            ? parseFloat(stringParts[1].split('=')[1])
            : 1.0

        const locale: AcceptLanguageInfo = {
            primary: localeParts[0],
            extended: undefined,
            script: undefined,
            region: undefined,
            quality,
        }

        let currentParser = 0
        localePartsLoop: for (const localePart of localeParts) {
            for (; currentParser < LOCALE_PARSING_OPTIONS.length; currentParser++) {
                const { part, matcher } = LOCALE_PARSING_OPTIONS[currentParser]
                if (matcher.test(localePart)) {
                    locale[part] = localePart
                    currentParser++
                    continue localePartsLoop
                }
            }
            break
        }

        return locale
    }

    /**
     * Parses "Accept-Language" header value using "parseLocaleString" util and returns array of AcceptLanguageInfo
     * sorted by descending quality.
     *
     * NOTE: Empty header or non-defined header is treated as "*"
     */
    static parseAcceptLanguageHeader (headerValue: Optional<string>): Array<AcceptLanguageInfo> {
        return (headerValue || '*')
            .split(',')
            .map(TranslationsHelper.parseLocaleString)
            .sort((a, b) => b.quality - a.quality)
    }

    /**
     * Generates locale-string from LocaleInfo or AcceptLanguageInfo
     */
    static toLocaleString (locale: LocaleInfo | AcceptLanguageInfo): string {
        return [locale.primary, locale.extended, locale.script, locale.region].filter(Boolean).join('-')
    }

    /**
     * Enrich selected locale by scanning through requested locales
     * and finding the first one, which is sub-locale of selected one.
     * For example: selectedLocale = "en", requestedLocales: ["en-GB", "fr", "en"] -> fullLocale = "en-GB"
     * If none of requested locales is valid sub-locales, returns selectedLocale as fallback
     */
    private _getFullLocale (selectedLocale: AvailableLocale, requestedLocales: Array<AcceptLanguageInfo | LocaleInfo>): string {
        let fullLocale: string = selectedLocale
        const selectedLocaleInfo = TranslationsHelper.parseLocaleString(selectedLocale)
        for (const locale of requestedLocales) {
            let isSubLocale = true
            for (const [fieldName, fieldValue] of Object.entries(selectedLocaleInfo)) {
                if (typeof fieldValue !== 'string') {
                    continue
                }
                if (locale[fieldName as keyof LocaleInfo] !== fieldValue) {
                    isSubLocale = false
                    break
                }
            }
            if (isSubLocale) {
                fullLocale = TranslationsHelper.toLocaleString(locale)
                break
            }
        }

        return fullLocale
    }

    /**
     * Takes list of locales and build traverse order according to LOCALE_RESOLVE_ORDER
     * Then select first available locale from that list defaulting to defaultLocale
     * After that enhancing it with first locale, matching selected one
     *
     * @example
     * const availableLocales = ["zh", "en"] // that's what we have
     * const locales = ["zh-Hans-CN", "en-GB", "zh"] // that's what user want
     * // During function execution we build order
     * const helper = new TranslationsHelper({ locales, defaultLocale: "zh" })
     * const { selectedLocale, fullLocale } = helper.selectSupportedLocale(locales.map(TranslationsHelper.parseLocaleString))
     * // ["zh-Hans-CN", "zh-Hans", "en-GB", "en", "zh"] - resolved order
     * // selectedLocale = "en" - first match, on which we can load messages
     * // fullLocale = "en-GB" - sub-locale, providing additional info
     */
    selectSupportedLocale (locales: Array<AcceptLanguageInfo | LocaleInfo>): LocaleSelection<AvailableLocale> {
        const reversedResolveOrder: Array<string> = []

        // NOTE: For each locale passed build resolve order starting from end
        // Order is important, since direct pass on "en-GB,fr,en-US" will produce ["en-GB", "en", "fr", "en-US"]
        // While reverse logic will produce ["en-GB", "fr", "en-US", "en"]
        for (let i = locales.length - 1; i >= 0; i--) {
            const localeToProcess = locales[i]
            for (let j = LOCALE_RESOLVE_ORDER.length - 1; j >= 0; j--) {
                const fields = LOCALE_RESOLVE_ORDER[j]
                const localeCandidate: LocaleInfo = {
                    primary: localeToProcess.primary,
                    extended: undefined,
                    script: undefined,
                    region: undefined,
                }
                let isValidCandidate = true
                for (const fieldName of fields) {
                    if (typeof localeToProcess[fieldName] === 'undefined') {
                        isValidCandidate = false
                        break
                    }
                    localeCandidate[fieldName] = localeToProcess[fieldName]
                }
                if (isValidCandidate) {
                    const stringCandidate = TranslationsHelper.toLocaleString(localeCandidate)
                    if (!reversedResolveOrder.includes(stringCandidate)) {
                        reversedResolveOrder.push(stringCandidate)
                    }
                }
            }
        }

        // NOTE: now convert it back to direct order
        reversedResolveOrder.reverse()

        let selectedLocale: AvailableLocale = this._defaultLocale

        for (const localeString of reversedResolveOrder) {
            if (this._locales.has(localeString)) {
                selectedLocale = localeString as AvailableLocale
                break
            }
        }

        // NOTE: We select the language from available ones,
        // but we need to enrich return value with first matching locale, which might affect currency display
        // and others non-related to message staff
        return {
            selectedLocale,
            fullLocale: this._getFullLocale(selectedLocale, locales),
        }
    }

    /**
     * Obtains locale preference from query parameter (if specified), cookie, request.headers['accept-language'] or window.navigator.languages
     * and then selects supported locale using selectSupportedLocale method
     */
    getPreferredLocale (req?: Optional<IncomingMessage>, res?: Optional<ServerResponse>): LocaleSelection<AvailableLocale> {
        // Step 1: Query must be resolved before any cookies, since it's more explicit
        if (this.localeQueryParam) {
            let paramValue: string | null = null
            if (req && req.url) {
                paramValue = new URL(req.url).searchParams.get(this.localeQueryParam)
            } else if (!isSSR()) {
                paramValue = new URLSearchParams(window.location.search).get(this.localeQueryParam)
            }
            if (paramValue) {
                const localeSelection = this.selectSupportedLocale([TranslationsHelper.parseLocaleString(paramValue)])
                if (localeSelection.fullLocale === paramValue) {
                    return localeSelection
                }
            }
        }

        // Step 2: Cookie must be parsed after query and before other preferences
        const cookieValue = getCookie(this.localeCookieName, { req, res })
        if (cookieValue) {
            const localeSelection = this.selectSupportedLocale([TranslationsHelper.parseLocaleString(cookieValue)])
            if (localeSelection.fullLocale === cookieValue) {
                return localeSelection
            }
        }

        // NOTE: on server extracts locale from accept-language
        if (req) {
            return this.selectSupportedLocale(TranslationsHelper.parseAcceptLanguageHeader(req.headers['accept-language']))
        } else if (!isSSR()) {
            return this.selectSupportedLocale(window.navigator.languages.map(TranslationsHelper.parseLocaleString))
        }

        return {
            selectedLocale: this._defaultLocale,
            fullLocale: this._defaultLocale,
        }
    }

    /**
     * Extracts prefetched translations to pageProps, so it can be available during SSR
     */
    extractI18NInfo<PropsType extends Record<string, unknown>> (
        translationsData: PrefetchResult<AvailableLocale, MessagesShape>,
        pageParams: SSRResult<PropsType>
    ): SSRResultWithI18N<AvailableLocale, MessagesShape, PropsType> {
        return {
            ...pageParams,
            props: {
                ...pageParams.props,
                [I18N_SELECTED_LOCALE_PROP_NAME]: translationsData.selectedLocale,
                [I18N_FULL_LOCALE_PROP_NAME]: translationsData.fullLocale,
                [I18N_MESSAGES_PROP_NAME]: translationsData.messages,
            },
        }
    }

    async getTranslations (locale: AvailableLocale): Promise<MessagesShape> {
        // Step 1. Load default messages once to have full set of messages
        if (!this._defaultMessages) {
            const existingMessages = this._translations[this._defaultLocale]
            // NOTE: translations can be prepopulated during SSR or other prefetches
            if (existingMessages) {
                this._defaultMessages = existingMessages
            } else {
                this._defaultMessages = await this._loadDefaultMessages()
            }

            this._translations[this._defaultLocale] = this._defaultMessages
        }

        // Step 2. If messages were already fetched - return existing one
        const existingMessages = this._translations[locale]
        if (existingMessages) {
            return existingMessages
        }

        // Step 3. Fetch language messages, which might be partially translated
        // and combined with default messages to build full message set
        const partialTranslatedMessages = await this._loadMessages(locale)
        const messages: MessagesShape = {
            ...this._defaultMessages,
            ...partialTranslatedMessages,
        }
        this._translations[locale] = messages

        return messages
    }

    async prefetchTranslations (req: Optional<IncomingMessage>, res: Optional<ServerResponse>): Promise<PrefetchResult<AvailableLocale, MessagesShape>> {
        const localeSelection = this.getPreferredLocale(req, res)
        const messages = await this.getTranslations(localeSelection.selectedLocale)

        return {
            selectedLocale: localeSelection.selectedLocale,
            fullLocale: localeSelection.fullLocale,
            messages,
        }
    }

    getTranslationsProvider (): FC<TranslationsProviderProps<AvailableLocale, MessagesShape>> {
        if (!this._context) {
            this._context = createContext<TranslationsContextType<AvailableLocale, MessagesShape>>({
                selectedLocale: this._defaultLocale,
                fullLocale: this._defaultLocale,
                messages: undefined,
                switchLocale: () => ({}),
            })
        }

        const Context = this._context
        const getFullLocale = this._getFullLocale
        const localeCookieName = this.localeCookieName
        const getTranslations = this.getTranslations
        const translationsObj = this._translations
        const getPreferredLocale = this.getPreferredLocale

        return function TranslationsProvider ({
            initialSelectedLocale,
            initialFullLocale,
            initialMessages,
            children,
        }) {
            const [selectedLocale, setSelectedLocale] = useState(initialSelectedLocale)
            const [fullLocale, setFullLocale] = useState(initialFullLocale)
            const [messages, setMessages] = useState(initialMessages)

            useEffectOnce(() => {
                if (!isSSR() && initialSelectedLocale && initialMessages) {
                    translationsObj[initialSelectedLocale] = initialMessages
                } else if (!isSSR() && (!initialSelectedLocale || !initialFullLocale || !initialMessages)) {
                    const localeSelection = getPreferredLocale()
                    setSelectedLocale(localeSelection.selectedLocale)
                    setFullLocale(localeSelection.fullLocale)
                    getTranslations(localeSelection.selectedLocale).then(setMessages)
                }
            })

            const switchLocale = useCallback(async (newLocale: AvailableLocale) => {
                const fullLocale = getFullLocale(newLocale, window.navigator.languages.map(TranslationsHelper.parseLocaleString))
                const messages = await getTranslations(newLocale)
                setSelectedLocale(newLocale)
                setFullLocale(fullLocale)
                setMessages(messages)
                setCookie(localeCookieName, fullLocale)
            }, [])

            return (
                <Context.Provider value={{ selectedLocale, fullLocale, messages, switchLocale }}>
                    {children}
                </Context.Provider>
            )
        }
    }

    getUseTranslationsExtractorHook () {
        const defaultLocale = this._defaultLocale

        return function useTranslationsExtractor<PropsType extends Record<string, unknown>> (
            pageProps: SSRResultWithI18N<AvailableLocale, MessagesShape, PropsType>['props']
        ) {
            return {
                initialSelectedLocale: pageProps[I18N_SELECTED_LOCALE_PROP_NAME] || defaultLocale,
                initialFullLocale: pageProps[I18N_FULL_LOCALE_PROP_NAME] || defaultLocale,
                initialMessages: pageProps[I18N_MESSAGES_PROP_NAME] || undefined,
            }
        }
    }

    getUseTranslationsHook () {
        if (!this._context) {
            this._context = createContext<TranslationsContextType<AvailableLocale, MessagesShape>>({
                selectedLocale: this._defaultLocale,
                fullLocale: this._defaultLocale,
                messages: undefined,
                switchLocale: () => ({}),
            })
        }
        const context = this._context

        return function useTranslations () {
            return useContext(context)
        }
    }

    getHOC () {
        const useTranslationsExtractor = this.getUseTranslationsExtractorHook()
        const TranslationsProvider = this.getTranslationsProvider()
        const prefetchTranslations = this.prefetchTranslations
        const extractI18NInfo = this.extractI18NInfo

        return function withTranslations<
            PropsType extends Record<string, unknown>,
            ComponentType,
            RouterType,
        > (App: AppType<PropsType, ComponentType, RouterType>): AppType<PropsType, ComponentType, RouterType> {
            const WithTranslations: AppType<PropsType, ComponentType, RouterType> = (props) => {
                const { pageProps } = props
                const { initialSelectedLocale, initialFullLocale, initialMessages } = useTranslationsExtractor(pageProps)

                return (
                    <TranslationsProvider
                        initialSelectedLocale={initialSelectedLocale}
                        initialFullLocale={initialFullLocale}
                        initialMessages={initialMessages}
                    >
                        <App {...props} />
                    </TranslationsProvider>
                )
            }

            const appGetInitialProps = App.getInitialProps
            if (appGetInitialProps) {
                WithTranslations.getInitialProps = async function (context) {
                    const appProps = await appGetInitialProps(context)
                    const { ctx } = context
                    const translationsData = await prefetchTranslations(ctx.req, ctx.res)
                    const { props } = extractI18NInfo(translationsData, { props: appProps.pageProps })

                    return { ...appProps, pageProps: props }
                }
            }

            return WithTranslations
        }
    }
}
