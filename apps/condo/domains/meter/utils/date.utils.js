const dayjs = require('dayjs')
const customParseFormat = require('dayjs/plugin/customParseFormat')
const { isEmpty, isString } = require('lodash')

const { SYMBOLS_TO_CUT_FROM_DATES_REGEXP, DATE_PARSING_FORMATS } = require('@condo/domains/meter/constants/registerMetersReadingsService')

dayjs.extend(customParseFormat)

/**
* @param {string} dateStr
* @return {undefined|string}
*/
function sanitizeDateStr (dateStr) {
    if (isEmpty(dateStr) || !isString(dateStr)) {
        return undefined
    }

    const sanitizedDateStr = dateStr.replace(SYMBOLS_TO_CUT_FROM_DATES_REGEXP, '')
    if (isEmpty(sanitizedDateStr)) {
        return undefined
    }

    return sanitizedDateStr
}

function monthIsLoweOrEqualTwelve (dateStr) {
    const [dateData] = dateStr.split(/T|\s/, 1)
    const items = dateData.split(/[/\\\-.]/)

    // YYYY MM || MM YYYY
    if (items.length === 2) {
        const [month] = items.sort((a, b) => a.length - b.length)
        if (Number(month) > 12) {
            return false
        }
    }

    // YYYY MM DD || DD MM YYYY ...
    if (items.length === 3) {
        const month = items[1]
        if (Number(month) > 12) {
            return false
        }
    }

    return true
}

/**
 * @param {string} dateStr
 * @return {undefined|string}
 */
function toISO (dateStr) {
    const sanitizedDateStr = sanitizeDateStr(dateStr)

    if (isEmpty(sanitizedDateStr)) {
        return undefined
    }
    return dayjs(sanitizedDateStr, DATE_PARSING_FORMATS).toISOString()
}

/**
 * @param {string} dateStr
 * @return {boolean}
 */
function isDateValid (dateStr) {
    const sanitizedStr = sanitizeDateStr(dateStr)
    return dayjs(sanitizedStr, DATE_PARSING_FORMATS).isValid() && monthIsLoweOrEqualTwelve(sanitizedStr)
}

module.exports = {
    toISO,
    isDateValid,
    sanitizeDateStr,
    monthIsLoweOrEqualTwelve,
}