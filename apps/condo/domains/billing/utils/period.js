function getPeriodMessage (period, locale = 'default') {
    if (!period || !locale) return
    const date = new Date(period)
    if (isNaN(date.getMonth())) return
    const fullMonth = date.toLocaleString(locale, { month: 'long' })
    return `${fullMonth} ${date.getFullYear()}`
}

function getPreviousPeriods (period, totalAmount = 3) {
    if (!period || !totalAmount || totalAmount < 1) return []
    const startDate = new Date(period)
    let month = startDate.getMonth() + 1
    if (isNaN(month)) return []
    let year = startDate.getFullYear()
    const result = []
    for (let i = 0; i < totalAmount; i++) {
        if (month === 0) {
            month = 12
            year--
        }
        const paddedMonth = `${month}`.padStart(2, '0')
        result.push(`${year}-${paddedMonth}-01`)
        month--
    }
    return result
}

module.exports = {
    getPeriodMessage,
    getPreviousPeriods,
}
