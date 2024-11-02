const dayjs = require('dayjs')

const DATE_FORMAT = 'YYYY-MM-DD'
const DATE_FORMAT_Z = 'YYYY-MM-DDTHH:mm:ss.SSSZZ'


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
 * Returns dates for first day of previous, current and next months formatted to DATE_FORMAT
 * Usable for periods of billing receipts, etc.
 * @returns {{prevMonthStart, thisMonthStart, nextMonthStart}}
 */
const getStartDates = (dateRaw) => {
    const date = getMonthStart(dateRaw)

    return {
        prevMonthStart: date.subtract('1', 'month').format(DATE_FORMAT),
        thisMonthStart: date.format(DATE_FORMAT),
        nextMonthStart: date.add('1', 'month').format(DATE_FORMAT),
    }
}

/**
 * Returns current seconds count from Epoch start UTC
 * @returns {number}
 */
const getCurrTimeStamp = () => Math.floor(Date.now() / 1000)

/**
 * Форматирует дату с учетом указанного часового пояса.
 *
 * @param {Date|string} date - The original date in Date format or a string that can be converted to Date.
 * @param {string} timeZone - Time zone name (e.g. 'Europe/Moscow').
 * @param {string} [format=DATE_FORMAT] - Date output format. By default, a constant is used DATE_FORMAT.
 * @returns {string} Formatted date in the specified time zone and format.
 *
 * @example
 * const formattedDate = formatDateToTimezone(new Date(), 'America/New_York', 'YYYY-MM-DD HH:mm:ss');
 */

const formatDateToTimezone = (date, timeZone, format = DATE_FORMAT) => {
    return dayjs(date).tz(timeZone).format(format)
}


module.exports = {
    getMonthStart,
    getStartDates,
    getCurrTimeStamp,
    formatDateToTimezone,
    DATE_FORMAT,
    DATE_FORMAT_Z,
}