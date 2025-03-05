const DEFAULT_NUMBER_OF_DECIMAL_PLACES = 2

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
        return DEFAULT_NUMBER_OF_DECIMAL_PLACES
    }
}

module.exports = { getCurrencyDecimalPlaces }
