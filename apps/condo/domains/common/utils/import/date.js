const dayjs = require('dayjs')
const customParseFormat = require('dayjs/plugin/customParseFormat')
const utc = require('dayjs/plugin/utc')
const isEmpty = require('lodash/isEmpty')
const isString = require('lodash/isString')

const { DEFAULT_DATE_PARSING_FORMATS } = require('@condo/domains/common/constants/import')

dayjs.extend(customParseFormat)
dayjs.extend(utc)

const SYMBOLS_TO_CUT_FROM_DATES_REGEXP = /[^+\-TZ_:.,( )/\d]/gi // -_:.,()/ recognizable by dayjs https://day.js.org/docs/en/parse/string-format
const DATE_WITH_OFFSET_REGEXP = /[+-](\d{2}):?(\d{2})$/ // +5000 | +50:00

function isUtcFormat (format) {
    return format.endsWith('Z]')
}

function isOffsetFormat (format) {
    return format.endsWith('Z') // ...Z or ...ZZ
}

/** true if date has ending like +0000 +00:00 -00:00...
 * @example
 * 2024-01-01 - false
 * 01-01-2024 - true
 * 2024-01-01T00:00:00+00:00 - true
 * */
function isOffsetDate (dateStr) {
    return DATE_WITH_OFFSET_REGEXP.test(dateStr)
}

/**
 * Helper for parcing date in multiple utc formats, as dayjs.utc accepts only one
 * @param dateStr
 * @param {Array<string>} utcFormats - not empty array of utc formats (with Z)
 * @param strict - use formats as restriction - true, else as addition
 * @returns {dayjs.Dayjs} is invalid if it could not parse any or utcFormats is empty
 */
function tryParseUtcDate (dateStr, utcFormats, strict = false) {
    let date = dayjs('invalid date')
    for (const format of utcFormats) {
        const date = dayjs.utc(dateStr, format, strict)
        if (date.isValid()) {
            return date
        }
    }
    return date
}

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
 * Validates date strings
 * @param {string} dateStr
 * @param {Array<string>?} formats - date parsing formats. Must be not empty array
 * @return {boolean}
 */
function isDateStrValid (dateStr, formats = DEFAULT_DATE_PARSING_FORMATS) {
    if (!dateStr || !isString(dateStr)) {
        return false
    }

    // dayjs does recognize these formats, so no additional manipulations required
    if (dayjs(dateStr, formats, true).isValid()) {
        return true
    }

    if (isOffsetDate(dateStr)) {
        let offsetFormats = formats.filter(format => isOffsetFormat(format))
        if (!offsetFormats.length) {
            return dayjs(dateStr, formats, true).isValid()
        }
        if (dayjs(dateStr, formats, true).isValid()) {
            return true
        }

        // we need to pass dateStr to dayjs in strict mode to check valid values in MM, DD, HH, mm...
        // but dayjs can not parse this format strictly https://github.com/iamkun/dayjs/issues/929
        // so lets manually drop offsets from date string and format and check what's left

        const maybeSemicolon = dateStr[dateStr.length - 3]
        let offsetStartIndex = dateStr.length - 5
        if (maybeSemicolon === ':') {
            offsetStartIndex = dateStr.length - 6
        }
        dateStr = dateStr.substring(0, offsetStartIndex)
        offsetFormats = offsetFormats.map(format => {
            const offsetFromEnd = format.endsWith('ZZ') ? 2 : 1
            return format.substring(0, format.length - offsetFromEnd)
        })

        return dayjs(dateStr, offsetFormats, true).isValid()
    }

    return false
}

/**
 * Parses strings in UTC format always. Extra formats can be passed.
 * @param {string} dateStr
 * @param {Array<string>?} overrideFormats - valid input formats. Must be not empty array
 * @returns {string|undefined} dateString in UTC or undefined for invalid date
 */
function tryToISO (dateStr, overrideFormats = DEFAULT_DATE_PARSING_FORMATS) {
    if (!dateStr || !isString(dateStr)) {
        return undefined
    }

    /** @type {dayjs.Dayjs} */
    let date
    if (dateStr.endsWith('Z')) {
        const utcStringFormats = overrideFormats.filter(format => isUtcFormat(format))
        date = tryParseUtcDate(dateStr, utcStringFormats, false)
    } else {
        date = dayjs(dateStr, overrideFormats, false)
    }
    // undefined needed to not update invalid dates to null
    return date.isValid() ? date.toISOString() : undefined
}

module.exports = {
    clearDateStr,
    isDateStrValid,
    tryToISO,
}
