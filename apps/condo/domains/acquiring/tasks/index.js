const { createCronTask } = require('@open-condo/keystone/tasks')

const {
    chargeRecurrentPayments,
} = require('@condo/domains/acquiring/tasks/chargeRecurrentPayments')
const {
    createRecurrentPaymentForNewBillingReceipt,
} = require('@condo/domains/acquiring/tasks/createRecurrentPaymentForNewBillingReceipt')
const {
    createRecurrentPaymentForReadyToPayRecurrentPaymentContexts,
} = require('@condo/domains/acquiring/tasks/createRecurrentPaymentForReadyToPayRecurrentPaymentContexts')
const {
    notifyBeforeRecurrentPaymentDate,
} = require('@condo/domains/acquiring/tasks/notifyBeforeRecurrentPaymentDate')


/**
 * There are a list of jobs that main should have at list one sequence:
 * createRecurrentPaymentForReadyToPayRecurrentPaymentContexts and then chargeRecurrentPayments
 *
 * Job purposes:
 * - notifyBeforeRecurrentPaymentDate: notify end users about tomorrow payment
 * - createRecurrentPaymentForNewBillingReceipt: scan for new billing receipts that have service consumer which have RecurrentPaymentContext with auto pay feature enabled.
 *          notify end users and create RecurrentPayment (with payAfter date set to tomorrow)
 * - createRecurrentPaymentForReadyToPayRecurrentPaymentContexts:
 *          scan billing receipts for billing with specific conditions (period, category, ..)
 *          and create a RecurrentPayments for those receipts
 * - chargeRecurrentPayments: get all RecurrentPayments that ready to charge (just created case, retry case and delayed case) and charge them
 *
 */

module.exports = {
    notifyBeforeRecurrentPaymentDate: createCronTask('notifyBeforeRecurrentPaymentDate', '0 8 * * *', notifyBeforeRecurrentPaymentDate),
    createRecurrentPaymentForNewBillingReceipt: createCronTask('createRecurrentPaymentForNewBillingReceipt', '0 9-13 * * *', createRecurrentPaymentForNewBillingReceipt),
    createRecurrentPaymentForReadyToPayRecurrentPaymentContexts: createCronTask('createRecurrentPaymentForReadyToPayRecurrentPaymentContexts', '0 9 * * *', createRecurrentPaymentForReadyToPayRecurrentPaymentContexts),
    chargeRecurrentPayments: createCronTask('chargeRecurrentPayments', '0 12 * * *', chargeRecurrentPayments),
}