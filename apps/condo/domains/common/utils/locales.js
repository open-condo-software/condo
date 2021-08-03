const extractReqLocale = (req, defaultLocale) => {
    const headersLocale = req.headers['accept-language'] && req.headers['accept-language'].slice(0, 2)
    return headersLocale
}

module.exports = {
    extractReqLocale,
}