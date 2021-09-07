const { DateTime } = require('luxon')

function getPeriodMessage(period, locale) {
    if (!period) return
    let dt = DateTime.fromISO(period)
    if (!dt.isValid) return
    if (locale) {
        dt = dt.setLocale(locale)
    }
    const month = dt.toLocaleString({ month: 'long' })
    return `${month} ${dt.year}`
}

function getPreviousPeriods(period, totalAmount = 3) {
    if (!period || !totalAmount || totalAmount < 1) return []
    let date = DateTime.fromISO(period)
    if (!date.isValid) return []
    const result = []
    for (let i = 0; i < totalAmount; i++) {
        result.push(date.toFormat('yyyy-MM-01'))
        date = date.minus({ month: 1 })
    }
    return result
}

module.exports = {
    getPeriodMessage,
    getPreviousPeriods,
}
