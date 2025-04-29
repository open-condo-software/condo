import { getCookie, setCookie } from 'cookies-next'
import React, { createContext, useState, useCallback, useContext } from 'react'

import { isSSR } from './environment'

import { useEffectOnce } from '../hooks/useEffectOnce'

import type { IncomingMessage, ServerResponse } from 'http'
import type { Context, PropsWithChildren, FC } from 'react'


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
    selectedLocale: AvailableLocale
    matchingLocale: string
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
        [I18N_MATCHING_LOCALE_PROP_NAME]?: string
        [I18N_MESSAGES_PROP_NAME]?: MessagesShape
    }
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
    matchingLocale: string
    /** Extracted messages to pass into `intl` or any similar tools  */
    messages: MessagesShape | undefined
    /** Callback to change current language */
    switchLocale(newLocale: AvailableLocale): void
}

export type TranslationsProviderProps<
    AvailableLocale extends string,
    MessagesShape extends Record<string, string>,
> = PropsWithChildren<{
    initialSelectedLocale: AvailableLocale
    initialMatchingLocale: string
    initialMessages: MessagesShape | undefined
}>

type TranslationsHelperOptions<
    AvailableLocale extends string,
    MessagesShape extends Record<string, string>,
> = {
    locales: ReadonlyArray<AvailableLocale>
    defaultLocale: AvailableLocale
    loadDefaultMessages(): Promise<MessagesShape>
    loadMessages(locale: AvailableLocale): Promise<Partial<MessagesShape>>
    localeCookieName?: string
}

type LocalePartMatcher = {
    part: 'primary' | 'extended' | 'script' | 'region'
    matcher: RegExp
}

const LOCALE_PARSING_OPTIONS: Array<LocalePartMatcher> = [
    { part: 'primary', matcher: /^[a-z]+$/ },
    { part: 'extended', matcher: /^[a-z]{3}$/ },
    { part: 'script', matcher: /^[A-Z][a-z]{3,}$/ },
    { part: 'region', matcher: /^[A-Z]{2,3}$/ },
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
const I18N_MATCHING_LOCALE_PROP_NAME = '__I18N_MATCHING_LOCALE__'
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

    constructor (options: TranslationsHelperOptions<AvailableLocale, MessagesShape>) {
        this._locales = new Set(options.locales)
        this._defaultLocale = options.defaultLocale
        this._loadMessages = options.loadMessages
        this._loadDefaultMessages = options.loadDefaultMessages

        if (options.localeCookieName) {
            this.localeCookieName = options.localeCookieName
        }

        this.getTranslationsProvider = this.getTranslationsProvider.bind(this)
        this.getUseTranslationsHook = this.getUseTranslationsHook.bind(this)
        this.getUseTranslationsExtractorHook = this.getUseTranslationsExtractorHook.bind(this)
        this.getPreferredLocale = this.getPreferredLocale.bind(this)
        this.selectSupportedLocale = this.selectSupportedLocale.bind(this)
        this.getTranslations = this.getTranslations.bind(this)
        this.prefetchTranslations = this.prefetchTranslations.bind(this)
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
     * For example: selectedLocale = "en", requestedLocales: ["en-GB", "fr", "en"] -> matchingLocale = "en-GB"
     * If none of requested locales is valid sub-locales, returns selectedLocale as fallback
     */
    private _getMatchingLocale (selectedLocale: AvailableLocale, requestedLocales: Array<AcceptLanguageInfo | LocaleInfo>): string {
        let matchingLocale: string = selectedLocale
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
                matchingLocale = TranslationsHelper.toLocaleString(locale)
                break
            }
        }

        return matchingLocale
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
     * const { selectedLocale, matchingLocale } = helper.selectSupportedLocale(locales.map(TranslationsHelper.parseLocaleString))
     * // ["zh-Hans-CN", "zh-Hans", "en-GB", "en", "zh"] - resolved order
     * // selectedLocale = "en" - first match, on which we can load messages
     * // matchingLocale = "en-GB" - sub-locale, proving additiona info
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
            matchingLocale: this._getMatchingLocale(selectedLocale, locales),
        }
    }

    /**
     * Obtains locale preference from cookie, request.headers['accept-language'] or window.navigator.languages
     * and then selects supported locale using selectSupportedLocale method
     */
    getPreferredLocale (req: Optional<IncomingMessage>, res: Optional<ServerResponse>): LocaleSelection<AvailableLocale> {
        const cookieValue = getCookie(this.localeCookieName, { req, res })
        if (cookieValue) {
            const selection = this.selectSupportedLocale([TranslationsHelper.parseLocaleString(cookieValue)])
            // NOTE: this will not be equal in case of "default-locale" fallback
            if (selection.matchingLocale === cookieValue) {
                return selection
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
            matchingLocale: this._defaultLocale,
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
                [I18N_MATCHING_LOCALE_PROP_NAME]: translationsData.matchingLocale,
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
            matchingLocale: localeSelection.matchingLocale,
            messages,
        }
    }

    getTranslationsProvider (): FC<TranslationsProviderProps<AvailableLocale, MessagesShape>> {
        if (!this._context) {
            this._context = createContext<TranslationsContextType<AvailableLocale, MessagesShape>>({
                selectedLocale: this._defaultLocale,
                matchingLocale: this._defaultLocale,
                messages: undefined,
                switchLocale: () => ({}),
            })
        }

        const Context = this._context
        const getMatchingLocale = this._getMatchingLocale
        const localeCookieName = this.localeCookieName
        const getTranslations = this.getTranslations
        const translationsObj = this._translations

        return function TranslationsProvider ({
            initialSelectedLocale,
            initialMatchingLocale,
            initialMessages,
            children,
        }) {
            const [selectedLocale, setSelectedLocale] = useState(initialSelectedLocale)
            const [matchingLocale, setMatchingLocale] = useState(initialMatchingLocale)
            const [messages, setMessages] = useState(initialMessages)

            useEffectOnce(() => {
                if (!isSSR() && initialMessages) {
                    translationsObj[initialSelectedLocale] = initialMessages
                }
            })

            const switchLocale = useCallback(async (newLocale: AvailableLocale) => {
                const matchingLocale = getMatchingLocale(newLocale, window.navigator.languages.map(TranslationsHelper.parseLocaleString))
                const messages = await getTranslations(newLocale)
                setSelectedLocale(newLocale)
                setMatchingLocale(matchingLocale)
                setMessages(messages)
                setCookie(localeCookieName, matchingLocale)
            }, [])

            return (
                <Context.Provider value={{ selectedLocale, matchingLocale, messages, switchLocale }}>
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
                initialMatchingLocale: pageProps[I18N_MATCHING_LOCALE_PROP_NAME] || defaultLocale,
                initialMessages: pageProps[I18N_MESSAGES_PROP_NAME] || undefined,
            }
        }
    }

    getUseTranslationsHook () {
        if (!this._context) {
            this._context = createContext<TranslationsContextType<AvailableLocale, MessagesShape>>({
                selectedLocale: this._defaultLocale,
                matchingLocale: this._defaultLocale,
                messages: undefined,
                switchLocale: () => ({}),
            })
        }
        const context = this._context

        return function useTranslations () {
            return useContext(context)
        }
    }
}
