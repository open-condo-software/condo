const moment = require('moment')

const normalizeTimeZone = (timeZone) => {
    const isValid = moment.tz.zone(timeZone) != null
    if (isValid) {
        return timeZone
    }
    return null
}

module.exports = {
    normalizeTimeZone,
}
