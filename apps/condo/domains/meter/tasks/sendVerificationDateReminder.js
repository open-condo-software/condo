const dayjs = require('dayjs')
const { createCronTask } = require('@core/keystone/tasks')
const { sendVerificationDateReminder } = require('../integrations/sendVerificationDateReminder')
const { METER_VERIFICATION_DATE_REMINDER_TYPE } = require('@condo/domains/notification/constants/constants')

/**
 * Syncs new and cancelled subscriptions
 */
const sendVerificationDateReminderTask = createCronTask('sendVerificationDateReminder', '* * * * *', async (date) => {
    await sendVerificationDateReminder(dayjs(), METER_VERIFICATION_DATE_REMINDER_TYPE, 0, 30)
    await sendVerificationDateReminder(dayjs(), METER_VERIFICATION_DATE_REMINDER_TYPE, 30, 30)
})

module.exports = sendVerificationDateReminderTask
