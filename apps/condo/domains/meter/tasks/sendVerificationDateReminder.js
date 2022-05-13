const { createCronTask } = require('@core/keystone/tasks')
const { sendVerificationDateReminder } = require('../integrations/sendVerificationDateReminder')
const {
    VERIFICATION_DATE_REMINDER_30_DAYS_TYPE,
    VERIFICATION_DATE_REMINDER_60_DAYS_TYPE,
} = require('@condo/domains/notification/constants/constants')

/**
 * Syncs new and cancelled subscriptions
 */
const sendVerificationDateReminderTask = createCronTask('sendVerificationDateReminder', '* * * * *', async (date) => {
    await sendVerificationDateReminder(date, VERIFICATION_DATE_REMINDER_30_DAYS_TYPE, 0, 30)
    await sendVerificationDateReminder(date, VERIFICATION_DATE_REMINDER_60_DAYS_TYPE, 30, 30)
})

module.exports = sendVerificationDateReminderTask
