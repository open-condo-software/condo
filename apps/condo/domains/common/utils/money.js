
const renderMoney = (amount, currencyCode, locale) => {
    if (Number.isNaN(amount)) return '' 
    const options = { currency: currencyCode }
    if (currencyCode === 'RUB') options.minimumFractionDigits = 2  
    const numberFormat = new Intl.NumberFormat(locale, options)
    const parts = numberFormat.formatToParts(amount)
    return parts.map((part) => part.value).join('')
}

module.exports = {
    renderMoney,
}