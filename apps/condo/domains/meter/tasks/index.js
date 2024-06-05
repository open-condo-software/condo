const { createTask } = require('@open-condo/keystone/tasks')

const deleteReadingsOfDeletedMeter = require('./deleteReadingsOfDeletedMeter')
const { importMeters } = require('./importMeters')
const sendSubmitMeterReadingsPushNotificationsTask = require('./sendSubmitMeterReadingsPushNotificationsTask')
const sendVerificationDateReminderTask = require('./sendVerificationDateReminderTask')

module.exports = {
    sendVerificationDateReminderTask,
    sendSubmitMeterReadingsPushNotificationsTask,
    deleteReadingsOfDeletedMeter,
    importMeters: createTask('importMeters', importMeters, 'low'),
}
