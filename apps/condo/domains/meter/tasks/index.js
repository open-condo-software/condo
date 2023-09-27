const { createTask, createCronTask } = require('@open-condo/keystone/tasks')

const { deleteReadingsOfDeletedMeterWorker } = require('./deleteReadingsOfDeletedMeterWorker')
const { sendSubmitMeterReadingsPushNotificationsTaskWorker } = require('./sendSubmitMeterReadingsPushNotificationsTaskWorker')
const { sendVerificationDateReminderTaskWorker } = require('./sendVerificationDateReminderTaskWorker')

const deleteReadingsOfDeletedMeterTask = createTask('deleteReadingsOfDeletedMeter', deleteReadingsOfDeletedMeterWorker)
const sendSubmitMeterReadingsPushNotificationsTask = createCronTask('sendSubmitMeterReadingsPushNotifications', '0 14 * * *', sendSubmitMeterReadingsPushNotificationsTaskWorker)
const sendVerificationDateReminderTask = createCronTask('sendVerificationDateReminder', '0 14 * * 1-5', sendVerificationDateReminderTaskWorker)

module.exports = {
    sendVerificationDateReminderTask,
    sendSubmitMeterReadingsPushNotificationsTask,
    deleteReadingsOfDeletedMeterTask,
}
