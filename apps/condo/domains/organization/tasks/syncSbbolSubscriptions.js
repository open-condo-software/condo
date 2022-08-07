const { createCronTask } = require('@condo/keystone/tasks')
const { syncSubscriptions } = require('../integrations/sbbol/sync/syncSubscriptions')

/**
 * Syncs new and cancelled subscriptions
 */
const syncSbbolSubscriptions = createCronTask('syncSbbolSubscriptions', '20 9 * * *', async (date) => {
    await syncSubscriptions(date)
})

module.exports = syncSbbolSubscriptions