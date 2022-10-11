const { createCronTask, removeCronTask } = require('@condo/keystone/tasks')

const { sendBillingReceiptNotifications } = require('./helpers')

// https://crontab.guru/#17_10-15_*_*_1-5
removeCronTask('sendBillingReceiptNotificationsTaskWorkDays', '17 10-15 * * 1-5')
removeCronTask('sendBillingReceiptNotificationsTaskWeekends', '17 12-15 * * 0,6')

/** PODS work according to UTC, so time in cron-tasks should also be according to UTC too. */
const sendBillingReceiptNotificationsTaskWorkDays = createCronTask('sendBillingReceiptNotificationsTaskWorkDays', '17 7-12 * * 1-5', sendBillingReceiptNotifications)
const sendBillingReceiptNotificationsTaskWeekends = createCronTask('sendBillingReceiptNotificationsTaskWeekends', '17 9-12 * * 0,6', sendBillingReceiptNotifications)

module.exports = {
    sendBillingReceiptNotificationsTaskWorkDays,
    sendBillingReceiptNotificationsTaskWeekends,
}