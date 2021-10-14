const { createCronTask } = require('@core/keystone/tasks')
const { syncPaymentRequestsForSubscriptions } = require('../integrations/sbbol/sync/syncPaymentRequestsForSubscriptions')

/**
 * Checking of SBBOL payment requests should be performed more frequently
 */
const task = createCronTask('syncSbbolPaymentRequestsForSubscriptions', '* * * * *', async () => {
    await syncPaymentRequestsForSubscriptions()
})

module.exports = task