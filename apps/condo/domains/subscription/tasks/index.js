const { createCronTask } = require('@open-condo/keystone/tasks')

const {
    activateSubscriptionForInvoice,
} = require('@condo/domains/subscription/tasks/activateSubscriptionForInvoice')
const {
    processRecurrentSubscriptionPayments,
} = require('@condo/domains/subscription/tasks/processRecurrentSubscriptionPayments')

module.exports = {
    activateSubscriptionForInvoice,
    processRecurrentSubscriptionPayments: createCronTask('processRecurrentSubscriptionPayments', '0 0 * * *', processRecurrentSubscriptionPayments),
}
