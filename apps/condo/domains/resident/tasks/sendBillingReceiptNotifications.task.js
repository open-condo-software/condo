const { createCronTask } = require('@condo/keystone/tasks')

const { sendBillingReceiptNotifications } = require('./helpers')

const WORK_DAYS_FROM = 10
const WORK_DAYS_TO = 15
const WEEKENDS_FROM = 12
const WEEKENDS_TO = 15

const sendBillingReceiptNotificationsTaskWorkDays = createCronTask('sendBillingReceiptNotificationsTaskWorkDays', `17 ${WORK_DAYS_FROM}-${WORK_DAYS_TO} * * 1-5`, sendBillingReceiptNotifications)
const sendBillingReceiptNotificationsTaskWeekends = createCronTask('sendBillingReceiptNotificationsTaskWeekends', `17 ${WEEKENDS_FROM}-${WEEKENDS_TO} * * 0,6`, sendBillingReceiptNotifications)

module.exports = {
    sendBillingReceiptNotificationsTaskWorkDays,
    sendBillingReceiptNotificationsTaskWeekends,
}