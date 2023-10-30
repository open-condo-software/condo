// TODO (DOMA-3868) Move this package to app/condo, remove this package and redeclare functions used in other packages locally
const get = require('lodash/get')
const nextCookie = require('next-cookies')

const ACCEPT_LANGUAGE_REGEXP = /((([a-zA-Z]+(-[a-zA-Z0-9]+){0,2})|\*)(;q=[0-1](\.[0-9]+)?)?)*/g
// TODO: Take it from @open-condo/config (right now it's not working and all apps implements only 2 locales, so maybe it's overhead)
const ACCEPT_LOCALES = ['ru', 'en']

// SRC: https://github.com/opentable/accept-language-parser
// Reason for fork: MIT + last release = 6 years ago
function parseAcceptLanguage (headerValue) {
    const matches = (headerValue || '*').match(ACCEPT_LANGUAGE_REGEXP)

    return matches.map(match => {
        if (!match) {
            return null
        }
        const bits = match.split(';')
        const ietf = bits[0].split('-')
        const hasScript = ietf.length === 3

        return {
            code: ietf[0].toLowerCase(),
            script: hasScript ? ietf[1] : null,
            region: hasScript ? ietf[2] : ietf[1],
            quality: bits[1] ? parseFloat(bits[1].split('=')[1]) : 1.0,
        }
    }).filter(result => Boolean(result)).sort((a, b) => b.quality - a.quality)
}

/**
 * Get locale from Express request object or return conf.DEFAULT_LOCALE
 * @param req
 * @returns {string | null}
 */
const extractReqLocale = (req) => {
    if (!req) return null
    try {
        const cookies = nextCookie({ req })
        // NOTE: Used in KS apps
        const ksCookieLocale = cookies['locale']
        // NOTE: Used in standalone next apps with i18n
        const nextCookieLocale = cookies['NEXT_LOCALE']

        if (ksCookieLocale && ACCEPT_LOCALES.includes(ksCookieLocale.toLowerCase())) {
            return ksCookieLocale.toLowerCase()
        }
        if (nextCookieLocale && ACCEPT_LOCALES.includes(nextCookieLocale.toLowerCase())) {
            return nextCookieLocale.toLowerCase()
        }

        // NOTE: Necessary for the correct work of the locale on the share page in Telegram
        const queryLocale = get(req, 'query.locale')
        if (queryLocale && ACCEPT_LOCALES.includes(queryLocale.toLowerCase())) {
            return queryLocale
        }

        const headersLocales = parseAcceptLanguage(get(req, 'headers.accept-language'))
        for (const localeConfig of headersLocales) {
            if (ACCEPT_LOCALES.includes(localeConfig.code)) {
                return localeConfig.code
            }
        }

        const reqLocale = get(req, 'locale')
        if (reqLocale && ACCEPT_LOCALES.includes(reqLocale.toLowerCase())) {
            return reqLocale
        }

        return null
    } catch {
        return null
    }
}


module.exports = {
    extractReqLocale,
}
