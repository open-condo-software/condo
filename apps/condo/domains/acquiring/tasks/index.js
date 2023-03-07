const recurrentPaymentContextProcessing = require('@condo/domains/acquiring/tasks/recurrent-payment-context-processing-task')
const recurrentPaymentNotification = require('@condo/domains/acquiring/tasks/recurrent-payment-notification-task')
const recurrentPaymentProcessing = require('@condo/domains/acquiring/tasks/recurrent-payment-processing-task')

module.exports = {
    recurrentPaymentContextProcessing,
    recurrentPaymentNotification,
    recurrentPaymentProcessing,
}