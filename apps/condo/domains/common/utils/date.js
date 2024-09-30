const dayjs = require('dayjs')
const customParseFormat = require('dayjs/plugin/customParseFormat')
const { isEmpty, isString } = require('lodash')

dayjs.extend(customParseFormat)

const DATE_FORMAT = 'YYYY-MM-DD'
const DATE_FORMAT_Z = 'YYYY-MM-DDTHH:mm:ss.SSSZZ'

const SYMBOLS_TO_CUT_FROM_DATES_REGEXP = /[^-TZ_:.,( )/\d]/gi // -_:.,()/ recognizable by dayjs https://day.js.org/docs/en/parse/string-format
const UTC_END_REGEXP = /(Z|(\.\d{3}[+-](\d{2}:?\d{2})))$/ // Z | +5000 | +50:00

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
 * Clear bad user input
 * @param dateStr raw user input
 * @returns {null|string}
 */
function clearDateStr (dateStr) {
    if (isEmpty(dateStr) || !isString(dateStr)) {
        return null
    }

    const sanitizedDateStr = dateStr
        .replace(SYMBOLS_TO_CUT_FROM_DATES_REGEXP, '')
        .trim()
    if (isEmpty(sanitizedDateStr)) {
        return null
    }

    return sanitizedDateStr
}

/**
 * @param {string} dateStr
 * @param {{formats?: Array<string>, strict?: boolean}} options
 * @return {boolean}
 */
function isDateStrValid (dateStr, options) {
    if (!dateStr) {
        return false
    }

    const params = {
        formats: undefined,
        strict: false,
        ...options,
    }

    let dateFunc = dayjs
    if (isDateStrInUTCFormat(dateStr)) {
        params.formats = undefined
        dateFunc = dayjs.utc
    }

    return dateFunc(dateStr, params.formats, params.strict).isValid()
}

function isDateStrInUTCFormat (dateStr) {
    if (!dateStr) {
        return false
    }
    return dateStr.endsWith('Z') || UTC_END_REGEXP.test(dateStr)
}

module.exports = {
    getMonthStart,
    getStartDates,
    getCurrTimeStamp,
    clearDateStr,
    isDateStrValid,
    isDateStrInUTCFormat,
    DATE_FORMAT,
    DATE_FORMAT_Z,
}