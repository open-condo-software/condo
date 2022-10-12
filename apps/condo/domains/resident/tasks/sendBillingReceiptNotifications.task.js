const { createCronTask, removeCronTask } = require('@condo/keystone/tasks')

const { sendBillingReceiptNotifications } = require('./helpers')

// https://crontab.guru/#17_10-15_*_*_1-5
removeCronTask('sendBillingReceiptNotificationsTaskWorkDays', '17 10-15 * * 1-5')
removeCronTask('sendBillingReceiptNotificationsTaskWeekends', '17 12-15 * * 0,6')

function sendBillingReceiptNotificationsWorkDays (...args) {
    return sendBillingReceiptNotifications(...args)
}

function sendBillingReceiptNotificationsWeekends (...args) {
    return sendBillingReceiptNotifications(...args)
}

/** PODS work according to UTC, so time in cron-tasks should also be according to UTC too. */
const sendBillingReceiptNotificationsWorkDaysTask = createCronTask('sendBillingReceiptNotificationsWorkDaysTask', '17 7-12 * * 1-5', sendBillingReceiptNotificationsWorkDays)
const sendBillingReceiptNotificationsWeekendsTask = createCronTask('sendBillingReceiptNotificationsWeekendsTask', '17 9-12 * * 0,6', sendBillingReceiptNotificationsWeekends)

module.exports = {
    sendBillingReceiptNotificationsWorkDaysTask,
    sendBillingReceiptNotificationsWeekendsTask,
}