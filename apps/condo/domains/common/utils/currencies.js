const { getLogger } = require('@open-condo/keystone/logging')
const DEFAULT_NUMBER_OF_DECIMAL_PLACES = 2

const logger = getLogger()

/**
 * @param {string} locale
 * @param {string} currencyCode
 * @returns {number}
 */
function getCurrencyDecimalPlaces (locale, currencyCode) {
    try {
        const formattedCurrencyParts = Intl.NumberFormat(locale, {
            style: 'currency',
            currency: currencyCode,
            currencyDisplay: 'code',
        })

        return formattedCurrencyParts.formatToParts(1).find(part => part.type === 'fraction')?.value.length || 0
    } catch (err) {
        logger.error({ msg: 'cannot get decimal places for currency', err, data: { locale, currencyCode } })

        return DEFAULT_NUMBER_OF_DECIMAL_PLACES
    }
}

module.exports = { getCurrencyDecimalPlaces }
