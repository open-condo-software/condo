
// TODO(mrfoxpro): typescript enum is good here
const defaultLocale = 'en'

const extractReqLocale = (req) => {
    const headersLocale = req.headers['accept-language'] && req.headers['accept-language'].slice(0, 2)
    return headersLocale || defaultLocale
}

module.exports = {
    defaultLocale,
    extractReqLocale,
}