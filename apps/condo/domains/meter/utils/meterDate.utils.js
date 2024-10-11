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
const DEFAULT_PARSING_OPTIONS = { formats: DATE_PARSING_FORMATS, offsets: true }

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
 * @param {boolean?} options.offsets - enable check for dates like 2024-01-20T00:00:00 with +00:00 or +0000
 * @return {boolean}
 */
function isDateStrValid (dateStr, options = DEFAULT_PARSING_OPTIONS) {
    if (!dateStr || !isString(dateStr)) {
        return false
    }

    options = { ...DEFAULT_PARSING_OPTIONS, ...options }

    if (options.offsets && DATE_WITH_OFFSET_REGEXP.test(dateStr)) {
        // we need to pass dateStr to dayjs in strict mode to check valid values in MM, DD, HH, mm...
        // but dayjs can not parse this format strictly
        // so lets manually drop offsets, because they are irrelevant, add utc ending and check validity

        const maybeSemicolon = dateStr[dateStr.length - 3]
        let offsetStartIndex = dateStr.length - 5
        if (maybeSemicolon === ':') {
            offsetStartIndex = dateStr.length - 6
        }
        dateStr = dateStr.substring(0, offsetStartIndex)

        const dateStrHasMilliseconds = dateStr[dateStr.length - 4] === '.'
        if (dateStrHasMilliseconds) {
            dateStr += 'Z'
        } else {
            dateStr += '.000Z'
        }
        return dayjs(dateStr, UTC_STRING_FORMAT, true).isValid()
    }

    return dayjs(dateStr, options.formats, true).isValid()
}

/**
 * Parses strings in UTC format always. Extra formats can be passed.
 * @param {string} dateStr
 * @param {Array<string>=DATE_PARSING_FORMATS} extraFormats - defaults to meter dates formats
 * @returns {string|undefined} dateString in UTC or undefined for invalid date
 */
function tryToISO (dateStr, extraFormats = DATE_PARSING_FORMATS) {
    if (!dateStr || !isString(dateStr)) {
        return undefined
    }

    /** @type {dayjs.Dayjs} */
    let date
    if (dateStr.endsWith('Z')) {
        date = dayjs.utc(dateStr, UTC_STRING_FORMAT, false)
    } else {
        date = dayjs(dateStr, extraFormats, false)
    }
    // undefined needed to not update invalid dates to null
    return date.isValid() ? date.toISOString() : undefined
}

module.exports = {
    clearDateStr,
    isDateStrValid,
    tryToISO,
}
