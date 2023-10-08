const dayjs = require('dayjs')
const timezone = require('dayjs/plugin/timezone')
const utc = require('dayjs/plugin/utc')
dayjs.extend(utc)
dayjs.extend(timezone)

const normalizeTimeZone = (timeZone) => {
    try {
        dayjs().tz(timeZone)
        return timeZone
    } catch (e) {
        return null
    }
}

module.exports = {
    normalizeTimeZone,
}
