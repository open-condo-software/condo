const { createCronTask } = require('@open-condo/keystone/tasks')

const {
    activateSubscriptionForInvoice,
} = require('@condo/domains/subscription/tasks/activateSubscriptionForInvoice')
const {
    processRecurrentSubscriptionPayments,
} = require('@condo/domains/subscription/tasks/processRecurrentSubscriptionPayments')
const {
    suspendB2BAppContextsWithoutSubscription,
} = require('@condo/domains/subscription/tasks/suspendB2BAppContextsWithoutSubscription')

module.exports = {
    activateSubscriptionForInvoice,
    processRecurrentSubscriptionPayments: createCronTask('processRecurrentSubscriptionPayments', '0 0 * * *', processRecurrentSubscriptionPayments),
    suspendB2BAppContextsWithoutSubscription: createCronTask('suspendB2BAppContextsWithoutSubscription', '30 * * * *', suspendB2BAppContextsWithoutSubscription),
}
