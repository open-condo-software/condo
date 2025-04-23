// import { getCookie, setCookie } from 'cookies-next'
import { getCookie } from 'cookies-next'
// import { createContext, useState, useCallback } from 'react'


import { nonNull } from './collections'
import { isSSR } from './environment'

import type { IncomingMessage, ServerResponse } from 'http'
// import type { PropsWithChildren, Context, FC } from 'react'

const ACCEPT_LANGUAGE_REGEXP = /((([a-zA-Z]+(-[a-zA-Z0-9]+){0,2})|\*)(;q=[0-1](\.[0-9]+)?)?)*/g

type Optional<T> = T | undefined
type TranslationsHelperOptions<AvailableLanguage extends string> = {
    languages: Array<AvailableLanguage>
    defaultLanguage: AvailableLanguage
    localeCookieName?: string
}

// type TranslationsContextType<
//     AvailableLanguage extends string,
//     MessagesShape extends Record<string, string>,
// > = {
//     locale: string
//     language: AvailableLanguage
//     messages: MessagesShape | undefined
//     switchLanguage(newLanguage: AvailableLanguage): void
// }

// type TranslationsProviderProps<
//     AvailableLanguage extends string,
//     MessagesShape extends Record<string, string>,
// > = PropsWithChildren<{
//     initialLocale: AvailableLanguage
//     initialMessages: MessagesShape
// }>

export type AcceptLanguageInfo = {
    code: string
    region: string | undefined
    script: string | null
    quality: number
}

export type LocaleInfo<AvailableLanguage extends string> = {
    /** Language code: en, es... */
    code: AvailableLanguage
    /** Optional region code: GB, US, DE... */
    region?: string
}

export class TranslationsHelper<
    AvailableLanguage extends string,
    // MessagesShape extends Record<string, string>,
> {
    private readonly _languages: Set<AvailableLanguage>
    private readonly _defaultLanguage: AvailableLanguage
    private readonly _localeCookieName: string = 'NEXT_LOCALE'
    // private _context: Context<TranslationsContextType<AvailableLanguage, MessagesShape>> | null

    constructor (options: TranslationsHelperOptions<AvailableLanguage>) {
        this._languages = new Set(options.languages)
        this._defaultLanguage = options.defaultLanguage
        // this._context = null

        if (options.localeCookieName) {
            this._localeCookieName = options.localeCookieName
        }

        this.isAvailableLanguage = this.isAvailableLanguage.bind(this)
        this.getPreferredLocale = this.getPreferredLocale.bind(this)
        this.getPreferredLanguage = this.getPreferredLanguage.bind(this)
    }

    static parseLanguageString (language: string): AcceptLanguageInfo {
        const bits = language.split(';')
        const ietf = bits[0].split('-') // lang-region or lang-script-region
        const hasScript = ietf.length === 3

        return {
            code: ietf[0].toLowerCase(),
            script: hasScript ? ietf[1] : null,
            region: hasScript ? ietf[2] : ietf[1],
            quality: bits[1] ? parseFloat(bits[1].split('=')[1]) : 1.0,
        }
    }

    static parseAcceptLanguageHeader (headerValue: Optional<string>): Array<AcceptLanguageInfo> {
        const matches = (headerValue || '*').match(ACCEPT_LANGUAGE_REGEXP) || []

        return matches.map(match => {
            if (!match) {
                return null
            }

            return TranslationsHelper.parseLanguageString(match)
        }).filter(nonNull).sort((a, b) => b.quality - a.quality)
    }

    isAvailableLanguage (language: string): language is AvailableLanguage {
        // NOTE: typecast here, so set will not throw error
        return this._languages.has(language as AvailableLanguage)
    }

    getPreferredLocale (req: Optional<IncomingMessage>, res: Optional<ServerResponse>): LocaleInfo<AvailableLanguage> {
        const cookieValue = getCookie(this._localeCookieName, { req, res })
        if (cookieValue) {
            const [code, region] = cookieValue.split('-')
            if (this.isAvailableLanguage(code)) {
                return {
                    code,
                    region,
                }
            }
        }

        // NOTE: on server-side we should parse 'accept-language' header to get the locale
        if (req) {
            const preferredLocales = TranslationsHelper.parseAcceptLanguageHeader(req.headers['accept-language'])
            for (const locale of preferredLocales) {
                if (this.isAvailableLanguage(locale.code)) {
                    return {
                        code: locale.code,
                        region: locale.region,
                    }
                }
            }
        } else if (!isSSR()) {
            const preferredLanguages = window.navigator.languages
            for (const languageString of preferredLanguages) {
                const locale = TranslationsHelper.parseLanguageString(languageString)
                if (this.isAvailableLanguage(locale.code)) {
                    return {
                        code: locale.code,
                        region: locale.region,
                    }
                }
            }
        }

        return {
            code: this._defaultLanguage,
        }
    }

    getPreferredLanguage (req: Optional<IncomingMessage>, res: Optional<ServerResponse>): AvailableLanguage {
        return this.getPreferredLocale(req, res).code
    }

    // getTranslationsProvider () {
    //     if (!this._context) {
    //         this._context = createContext<TranslationsContextType<AvailableLanguage, MessagesShape>>({
    //             locale: this._defaultLanguage,
    //             language: this._defaultLanguage,
    //             messages: undefined,
    //             switchLanguage () {
    //                 return
    //             },
    //         })
    //     }
    //
    //     const Context = this._context
    //     const localeCookieName = this._localeCookieName
    //     const getTranslations = () => ({})
    //
    //     const TranslationsProvider: FC<TranslationsProviderProps<AvailableLanguage, MessagesShape>> = (props) => {
    //         const { children, initialLocale, initialMessages } = props
    //
    //         const [locale, setLocale] = useState(initialLocale)
    //         const [language, setLanguage] = useState(TranslationsHelper.parseLanguageString(locale).code)
    //         const [messages, setMessages] = useState(initialMessages)
    //
    //         const switchLanguage = useCallback(async (locale: AvailableLocale) => {
    //             const newMessages = await getTranslations(locale)
    //
    //             setCookie(localeCookieName, locale)
    //             setLocale(locale)
    //             setMessages(newMessages)
    //         }, [])
    //
    //         return (
    //             <Context.Provider value={{ locale, language, messages }}>
    //                 {children}
    //             </Context.Provider>
    //         )
    //     }
    //
    //     return TranslationsProvider
    // }
}
