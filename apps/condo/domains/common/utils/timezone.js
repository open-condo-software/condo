const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const timezone = require('dayjs/plugin/timezone')
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
