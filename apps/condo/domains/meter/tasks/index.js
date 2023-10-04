const { createTask, createCronTask } = require('@open-condo/keystone/tasks')

const { deleteReadingsOfDeletedMeter } = require('./deleteReadingsOfDeletedMeter')
const { sendSubmitMeterReadingsPushNotifications } = require('./sendSubmitMeterReadingsPushNotifications')
const { sendVerificationDateReminder } = require('./sendVerificationDateReminder')

module.exports = {
    deleteReadingsOfDeletedMeterTask: createTask('deleteReadingsOfDeletedMeter', deleteReadingsOfDeletedMeter),
    sendSubmitMeterReadingsPushNotificationsCronTask: createCronTask('sendSubmitMeterReadingsPushNotifications', '0 14 * * *', sendSubmitMeterReadingsPushNotifications),
    sendVerificationDateReminderCronTask: createCronTask('sendVerificationDateReminder', '0 14 * * 1-5', sendVerificationDateReminder),
}
