const { createCronTask } = require('@open-condo/keystone/tasks')
const { syncPaymentRequestsForSubscriptions } = require('../integrations/sbbol/sync/syncPaymentRequestsForSubscriptions')

/**
 * Checking of SBBOL payment requests should be performed more frequently
 */
const task = createCronTask('syncSbbolPaymentRequestsForSubscriptions', '0 9 * * *', async () => {
    await syncPaymentRequestsForSubscriptions()
})

module.exports = task