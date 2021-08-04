const nextCookie = require('next-cookies')

const extractReqLocale = (req) => {
    try {
        const cookieLocale = nextCookie({ req }).locale
        const headersLocale = req.headers['accept-language'] && req.headers['accept-language'].slice(0, 2)
        return cookieLocale || headersLocale
    }
    catch {
        return null
    }
}

module.exports = {
    extractReqLocale,
}