const dayjs = require('dayjs')

function getPreviousPeriods(period, totalAmount = 3) {
    if (!period || !totalAmount || totalAmount < 1) return []
    let date = dayjs(period)
    if (!date.isValid()) return []
    const result = []
    for (let i = 0; i < totalAmount; i++) {
        result.push(date.format('YYYY-MM-01'))
        date = date.subtract(1, 'month')
    }
    return result
}

module.exports = {
    getPreviousPeriods,
}
