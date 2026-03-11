const { createCronTask } = require('@open-condo/keystone/tasks')

const {
    processRecurrentSubscriptionPayments,
} = require('@condo/domains/subscription/tasks/processRecurrentSubscriptionPayments')

module.exports = {
    processRecurrentSubscriptionPayments: createCronTask('processRecurrentSubscriptionPayments', '0 0 * * *', processRecurrentSubscriptionPayments),
}
