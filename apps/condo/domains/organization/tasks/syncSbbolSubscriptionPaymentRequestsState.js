const dayjs = require('dayjs')
const { createCronTask } = require('@open-condo/keystone/tasks')
const { syncSbbolSubscriptionPaymentRequestsState } = require('@condo/domains/organization/integrations/sbbol/sync/syncSbbolSubscriptionPaymentRequestsState')
const { getSchemaCtx } = require('@open-condo/keystone/schema')

/**
 * Syncs new and cancelled subscriptions
 */
const task = createCronTask('syncSbbolSubscriptionPaymentRequestsState', '10 9 * * *', async () => {
    const today = dayjs().format('YYYY-MM-DD')
    const { keystone } = await getSchemaCtx('User')
    await syncSbbolSubscriptionPaymentRequestsState({ date: today, context: keystone })
})

module.exports = task