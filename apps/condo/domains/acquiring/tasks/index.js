const {
    recurrentPaymentsProcessingCron,
} = require('@condo/domains/acquiring/tasks/recurrent-payments/recurrent-payment-processing')
const {
    recurrentPaymentsContextProcessingCron,
} = require('@condo/domains/acquiring/tasks/recurrent-payments-context/recurrent-payment-context-processing')
const {
    recurrentPaymentsNotificationCron,
} = require('@condo/domains/acquiring/tasks/recurrent-payments-notification/recurrent-payments-notification')
const {
    recurrentPaymentsSeekingForNewReceiptCron,
} = require('@condo/domains/acquiring/tasks/recurrent-payments-seeking-for-new-receipt/recurrent-payments-seeking-for-new-receipt')

module.exports = {
    recurrentPaymentsProcessingCron,
    recurrentPaymentsContextProcessingCron,
    recurrentPaymentsNotificationCron,
    recurrentPaymentsSeekingForNewReceiptCron,
}