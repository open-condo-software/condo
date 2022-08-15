const sendVerificationDateReminderTask = require('./sendVerificationDateReminderTask')
const sendSubmitMeterReadingsPushNotificationsTask = require('./sendSubmitMeterReadingsPushNotificationsTask')
const deleteReadingsOfDeletedMeter = require('./deleteReadingsOfDeletedMeter')

module.exports = {
    sendVerificationDateReminderTask,
    sendSubmitMeterReadingsPushNotificationsTask,
    deleteReadingsOfDeletedMeter,
}
