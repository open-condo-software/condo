const dayjs = require('dayjs')
const duration = require('dayjs/plugin/duration')
const isString = require('lodash/isString')

dayjs.extend(duration)

/**
 * Validate value is ISO 8601 format ("P3Y6M4DT12H30M5S")
 * @param value
 * @returns {boolean}
 */
function isISO8601Duration (value) {
    if (!isString(value)) return false
    return dayjs.duration(value).asMilliseconds() >= 0
}

module.exports = {
    isISO8601Duration,
}