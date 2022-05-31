const nextCookie = require('next-cookies')

/**
 * @param req
 * @returns {null|string}
 */
const extractReqLocale = (req) => {
    try {
        const cookieLocale = nextCookie({ req }).locale
        // TODO(leonid-d): Necessary for the correct work of the locale on the share page in Telegram
        const queryLocale = req.query && req.query.locale
        const isTelegram = req.headers && req.headers['user-agent'] && req.headers['user-agent'].includes('Telegram')

        const headersLocale = req.headers && req.headers['accept-language'] && req.headers['accept-language'].slice(0, 2)

        const reqLocale = req.locale

        return cookieLocale || (isTelegram && queryLocale) || headersLocale || reqLocale
    }
    catch {
        return null
    }
}


module.exports = {
    extractReqLocale,
}
