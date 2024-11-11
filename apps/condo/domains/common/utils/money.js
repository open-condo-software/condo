/**
* Formats a numeric value as a currency value.
*
* @param {number} amount The numeric value to format.
* @param {string} currencyCode The currency code (e.g. 'EUR', 'USD').
* @param {string} [locale='en-US'] The locale to format (defaults to 'en-US'). But you can also just 'ru' 
* @param {boolean} hasCurrencySymbol Displays the currency symbol as a result 
* @returns {string} The formatted currency value.
* @throws {TypeError} If `amount` is not a number.
*/

const renderMoney = (amount, currencyCode, locale, hasCurrencySymbol = false) => {
    if (Number.isNaN(parseFloat(amount))) return '' 
    const options = { currency: currencyCode, style: 'currency' }
    const numberFormat = new Intl.NumberFormat(locale, options)
    const parts = numberFormat.formatToParts(amount)
    if (hasCurrencySymbol) return parts.map(part => part.value).join('')
    return parts.map(part => part.type !== 'literal' && part.type !== 'currency' ? part.value : '').join('')
}

module.exports = {
    renderMoney,
}