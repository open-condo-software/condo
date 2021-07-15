const moment = require('moment-timezone')

const normalizeTimeZone = (timeZone) => {
    const isValid = moment.tz.zone(timeZone) !== null
    if (isValid) {
        return timeZone
    }
    return null
}

module.exports = {
    normalizeTimeZone,
}
