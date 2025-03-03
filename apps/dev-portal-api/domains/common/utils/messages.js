const get = require('lodash/get')

const { extractReqLocale: defaultExtractReqLocale } = require('@open-condo/locales/extractReqLocale')

const { DEFAULT_LOCALE, SUPPORTED_LOCALES } = require('@dev-portal-api/domains/common/constants/locales')

const MESSAGES = Object.assign({}, ...SUPPORTED_LOCALES.map(locale => ({
    [locale]: require(`@app/dev-portal-api/lang/${locale}.json`),
})))

function getLocalizedMessage (key, opts) {
    const locale = get(opts, 'locale', DEFAULT_LOCALE)
    const values = get(opts, 'values', {})

    let message = get(MESSAGES, [locale, key], key)

    for (const replaceKey of Object.keys(values)) {
        message = message.replaceAll(`{${replaceKey}}`, values[replaceKey])
    }

    return message
}

function extractReqLocale (req) {
    const extractedLocale = defaultExtractReqLocale(req)
    if (!extractedLocale || !SUPPORTED_LOCALES.includes(extractedLocale)) {
        return DEFAULT_LOCALE
    }

    return extractedLocale
}

module.exports = {
    getLocalizedMessage,
    extractReqLocale,
}