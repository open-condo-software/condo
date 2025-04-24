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

type TranslationsHelperOptions<AvailableLocale extends string> = {
    locales: Array<AvailableLocale>
    defaultLocale: AvailableLocale
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

export class TranslationsHelper<
    AvailableLocale extends string,
> {
    private readonly _locales: Set<string>
    private readonly _defaultLocale: AvailableLocale

    constructor (options: TranslationsHelperOptions<AvailableLocale>) {
        this._locales = new Set(options.locales)
        this._defaultLocale = options.defaultLocale
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
        let matchingLocale: string = selectedLocale
        const selectedLocaleInfo = TranslationsHelper.parseLocaleString(selectedLocale)
        for (const locale of locales) {
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

        return {
            selectedLocale,
            matchingLocale,
        }
    }
}
