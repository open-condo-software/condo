const dayjs = require('dayjs')
const { createCronTask } = require('@core/keystone/tasks')
const { sendVerificationDateReminder } = require('./sendVerificationDateReminder')

/**
 * Syncs new and cancelled subscriptions
 */
const sendVerificationDateReminderTask = createCronTask('sendVerificationDateReminder', '0 14 * * 1-5', async (date) => {
    await sendVerificationDateReminder({
        date: dayjs(),
        searchWindowDaysShift: 0,
        daysCount: 30,
    })
    await sendVerificationDateReminder({
        date: dayjs(),
        searchWindowDaysShift: 30,
        daysCount: 30,
    })
})

module.exports = sendVerificationDateReminderTask
