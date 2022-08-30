// TODO (DOMA-3868) Move this package to app/condo, remove this package and redeclare functions used in other packages locally
const nextCookie = require('next-cookies')
const { get } = require('lodash')

const conf = require('@condo/config')

/**
 * Get locale from Express request object or return conf.DEFAULT_LOCALE
 * @param req
 * @returns {string}
 */
const extractReqLocale = (req) => {
    if (!req) return conf.DEFAULT_LOCALE
    try {
        const cookieLocale = nextCookie({ req }).locale
        // NOTE: Necessary for the correct work of the locale on the share page in Telegram
        const queryLocale = get(req, 'query.locale')
        const headersLocale = get(req, 'headers.accept-language', '').slice(0, 2)
        const reqLocale = get(req, 'locale')

        return (cookieLocale || queryLocale || headersLocale || reqLocale || conf.DEFAULT_LOCALE).toLowerCase()
    } catch {
        return conf.DEFAULT_LOCALE
    }
}


module.exports = {
    extractReqLocale,
}