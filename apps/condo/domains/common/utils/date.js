const dayjs = require('dayjs')

const DATE_FORMAT = 'YYYY-MM-DD'

/**
 * Returns date adjusted to first day of the month. Can be formatted to DATE_FORMAT
 * @param dateRaw
 * @param shouldFormat
 * @returns {*}
 */
const getMonthStart = (dateRaw, shouldFormat = false) => {
    const date = dayjs(dateRaw).date(1)

    return shouldFormat ? date.format(DATE_FORMAT) : date
}

/**
 * Returns dates for first day of current and next months
 * @returns {{thisMonthStart, nextMonthStart}}
 */
const getStartDates = (dateRaw) => {
    const date = getMonthStart(dateRaw)

    return {
        prevMonthStart: date.subtract('1', 'month').format(DATE_FORMAT),
        thisMonthStart: date.format(DATE_FORMAT),
        nextMonthStart: date.add('1', 'month').format(DATE_FORMAT),
        today: dayjs().format(DATE_FORMAT),
        currentDay: Number(dayjs().format('DD')),
    }
}

module.exports = {
    getMonthStart,
    getStartDates,
}