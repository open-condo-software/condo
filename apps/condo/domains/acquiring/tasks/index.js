const {
    createRecurrentPaymentForReadyToPayRecurrentPaymentContexts,
} = require('@condo/domains/acquiring/tasks/recurrent-payment-context-processing')
const {
    chargeRecurrentPayments,
} = require('@condo/domains/acquiring/tasks/recurrent-payment-processing')
const {
    notifyBeforeRecurrentPaymentDate,
} = require('@condo/domains/acquiring/tasks/recurrent-payments-notification')
const {
    createRecurrentPaymentForNewBillingReceipt,
} = require('@condo/domains/acquiring/tasks/recurrent-payments-seeking-for-new-receipt')


/**
 * There are a list of jobs that main should have at list one sequence:
 * createRecurrentPaymentForReadyToPayRecurrentPaymentContexts and then chargeRecurrentPayments
 *
 * Job purposes:
 * - notifyBeforeRecurrentPaymentDate: notify end users about tomorrow payment
 * - createRecurrentPaymentForReadyToPayRecurrentPaymentContexts:
 *          scan billing receipts for billing with specific conditions (period, category, ..)
 *          and create a RecurrentPayments for those receipts
 * - chargeRecurrentPayments: get all RecurrentPayments that ready to charge (just created case, retry case and delayed case) and charge them
 * - createRecurrentPaymentForNewBillingReceipt: scan for new billing receipts that have service consumer which have RecurrentPaymentContext with auto pay feature enabled.
 *          notify end users and create RecurrentPayment (with payAfter date set to tomorrow)
 *
 */

module.exports = {
    notifyBeforeRecurrentPaymentDate,
    createRecurrentPaymentForReadyToPayRecurrentPaymentContexts,
    chargeRecurrentPayments,
    createRecurrentPaymentForNewBillingReceipt,
}