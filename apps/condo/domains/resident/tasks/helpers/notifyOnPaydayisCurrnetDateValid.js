const dayjs = require('dayjs')

function notifyOnPaydayIsCurrentDateValid (today) {
    const targetDayOfSendingThePush = dayjs().set('date', 20).day()

    // https://day.js.org/docs/en/get-set/day
    if ((targetDayOfSendingThePush === 0 || targetDayOfSendingThePush === 6) && ( today.format('DD') > 16 && today.day() === 5)) {
        return true
    }
}
module.exports = {
    notifyOnPaydayIsCurrentDateValid,
}