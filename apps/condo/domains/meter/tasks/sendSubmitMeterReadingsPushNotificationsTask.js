const { createCronTask } = require('@core/keystone/tasks')
const { sendSubmitMeterReadingsPushNotifications } = require('./sendSubmitMeterReadingsPushNotifications')

/**
 * Syncs new and cancelled subscriptions
 */
const sendSubmitMeterReadingsPushNotificationsTask = createCronTask('sendSubmitMeterReadingsPushNotifications', '0 14 21 * *', async () => {
    await sendSubmitMeterReadingsPushNotifications()
})

module.exports = sendSubmitMeterReadingsPushNotificationsTask
