const dayjs = require('dayjs')
const customParseFormat = require('dayjs/plugin/customParseFormat')
const utc = require('dayjs/plugin/utc')
const { isEmpty, isString } = require('lodash')

const { DATE_PARSING_FORMATS } = require('@condo/domains/meter/constants/registerMetersReadingsService')

dayjs.extend(customParseFormat)
dayjs.extend(utc)

const SYMBOLS_TO_CUT_FROM_DATES_REGEXP = /[^+\-TZ_:.,( )/\d]/gi // -_:.,()/ recognizable by dayjs https://day.js.org/docs/en/parse/string-format
const DATE_WITH_OFFSET_REGEXP = /([T\s]\d{2}:\d{2}:\d{2}(\.\d{1,3})?)[+-](\d{2}):?(\d{2})$/ // +5000 | +50:00
const UTC_STRING_FORMAT = 'YYYY-MM-DDTHH:mm:ss.SSS[Z]'
const DEFAULT_PARSING_OPTIONS = { formats: DATE_PARSING_FORMATS, utc: true, offsets: true }

/**
 * Clear bad user input
 * @param dateStr raw user input
 * @returns {string}
 */
function clearDateStr (dateStr) {
    if (isEmpty(dateStr) || !isString(dateStr)) {
        return ''
    }

    const sanitizedDateStr = dateStr
        .replace(SYMBOLS_TO_CUT_FROM_DATES_REGEXP, '')
        .trim()
    if (isEmpty(sanitizedDateStr)) {
        return ''
    }

    return sanitizedDateStr
}

/**
 * Validates dates in formats: ISO, with offsets, or in custom formats
 * @param {string} dateStr
 * @param options - change default formats, disable utc or offset formats
 * @param {Array<string>?} options.formats - date parsing formats
 * @param {boolean?} options.utc - process utc or not
 * @param {boolean?} options.offsets - process date with offsets or not
 * @return {boolean}
 */
function isDateStrValid (dateStr, options = DEFAULT_PARSING_OPTIONS) {
    if (!dateStr || !isString(dateStr)) {
        return false
    }

    options = { DEFAULT_PARSING_OPTIONS, ...options }

    if (options.utc && dateStr.endsWith('Z')) {
        return dayjs.utc(dateStr, UTC_STRING_FORMAT, true).isValid()
    }

    if (options.offsets && DATE_WITH_OFFSET_REGEXP.test(dateStr)) {
        // remove +HH:mm | +HHmm part, it does not matter
        const maybeSemicolon = dateStr[dateStr.length - 3]
        let offsetStartIndex = dateStr.length - 5
        if (maybeSemicolon === ':') {
            offsetStartIndex = dateStr.length - 6
        }
        dateStr = dateStr.substring(0, offsetStartIndex)
    }

    return dayjs(dateStr, options.formats, true).isValid()
}

/**
 *
 * @param {string} dateStr
 * @param {Array<string>=DATE_PARSING_FORMATS} formats - defaults to meter dates formats
 * @returns {string|undefined} dateString in UTC or undefined for invalid date
 */
function tryToISO (dateStr, formats = DATE_PARSING_FORMATS) {
    if (!dateStr || !isString(dateStr)) {
        return undefined
    }

    /** @type {dayjs.Dayjs} */
    let date
    if (dateStr.endsWith('Z')) {
        date = dayjs.utc(dateStr, UTC_STRING_FORMAT, false)
    } else {
        date = dayjs(dateStr, formats, false)
    }
    // undefined needed to not update invalid dates to null
    return date.isValid() ? date.toISOString() : undefined
}

module.exports = {
    clearDateStr,
    isDateStrValid,
    tryToISO,
}
