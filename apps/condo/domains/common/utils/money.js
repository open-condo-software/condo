
const renderMoney = (amount, currencyCode, locale) => {
    const options = { currency: currencyCode, minimumFractionDigits: 2 }
    const numberFormat = new Intl.NumberFormat(locale, options)
    const parts = numberFormat.formatToParts(amount)
    return parts.map((part) => part.value).join('')
}

module.exports = {
    renderMoney,
}