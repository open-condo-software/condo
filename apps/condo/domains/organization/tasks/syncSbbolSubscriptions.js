const { createCronTask } = require('@core/keystone/tasks')
const { syncSubscriptions } = require('../integrations/sbbol/sync/syncSubscriptions')
const dayjs = require('dayjs')
const { getSchemaCtx } = require('@core/keystone/schema')

/**
 * Syncs new and cancelled subscriptions
 */
const syncSbbolSubscriptions = createCronTask('syncSbbolSubscriptions', '0 * * * *', async () => {
    const today = dayjs().format('YYYY-MM-DD')
    const { keystone } = await getSchemaCtx('User')
    await syncSubscriptions({ date: today, context: keystone })
})

module.exports = syncSbbolSubscriptions