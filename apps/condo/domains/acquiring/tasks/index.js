const { createCronTask, removeCronTask, createTask } = require('@open-condo/keystone/tasks')

const {
    chargeRecurrentPayments,
} = require('./chargeRecurrentPayments')
const {
    createRecurrentPaymentForNewBillingReceipt,
} = require('./createRecurrentPaymentForNewBillingReceipt')
const {
    createRecurrentPaymentForReadyToPayRecurrentPaymentContexts,
} = require('./createRecurrentPaymentForReadyToPayRecurrentPaymentContexts')
const {
    notifyBeforeRecurrentPaymentDate,
} = require('./notifyBeforeRecurrentPaymentDate')
const {
    removeOrphansRecurrentPaymentContexts,
    removeOutdatedRecurrentPayments,
} = require('./removeRecurrentPayments')

/**
 * There are a list of jobs that main should have at list one sequence:
 * createRecurrentPaymentForReadyToPayRecurrentPaymentContexts and then chargeRecurrentPayments
 */

// remove old cron task definitions
removeCronTask('createRecurrentPaymentForReadyToPayRecurrentPaymentContexts', '0 9 * * *')

module.exports = {
    notifyBeforeRecurrentPaymentDateCronTask: createCronTask('notifyBeforeRecurrentPaymentDate', '0 8 * * *', notifyBeforeRecurrentPaymentDate),
    createRecurrentPaymentForNewBillingReceiptCronTask: createCronTask('createRecurrentPaymentForNewBillingReceipt', '0 9-13 * * *', createRecurrentPaymentForNewBillingReceipt),
    createRecurrentPaymentForReadyToPayRecurrentPaymentContextsCronTask: createCronTask('createRecurrentPaymentForReadyToPayRecurrentPaymentContexts', '0 11 * * *', createRecurrentPaymentForReadyToPayRecurrentPaymentContexts),
    chargeRecurrentPaymentsCronTask: createCronTask('chargeRecurrentPayments', '0 12 * * *', chargeRecurrentPayments),

    removeOrphansRecurrentPaymentContextsTask: createTask('removeOrphansRecurrentPaymentContexts', removeOrphansRecurrentPaymentContexts),
    removeOutdatedRecurrentPaymentsTask: createTask('removeOutdatedRecurrentPayments', removeOutdatedRecurrentPayments),
}