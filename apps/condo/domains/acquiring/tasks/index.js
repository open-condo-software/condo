const {
    recurrentPaymentsContextProcessingCron,
} = require('@condo/domains/acquiring/tasks/recurrent-payment-context-processing')
const {
    recurrentPaymentsProcessingCron,
} = require('@condo/domains/acquiring/tasks/recurrent-payment-processing')
const {
    recurrentPaymentsNotificationCron,
} = require('@condo/domains/acquiring/tasks/recurrent-payments-notification')
const {
    recurrentPaymentsSeekingForNewReceiptCron,
} = require('@condo/domains/acquiring/tasks/recurrent-payments-seeking-for-new-receipt')

module.exports = {
    recurrentPaymentsProcessingCron,
    recurrentPaymentsContextProcessingCron,
    recurrentPaymentsNotificationCron,
    recurrentPaymentsSeekingForNewReceiptCron,
}