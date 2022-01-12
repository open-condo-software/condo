const { createCronTask } = require('@core/keystone/tasks')
const { syncSubscriptions } = require('../integrations/sbbol/sync/syncSubscriptions')
const dayjs = require('dayjs')

/**
 * Syncs new and cancelled subscriptions
 */
const syncSbbolSubscriptions = createCronTask('syncSbbolSubscriptions', '20 9 * * *', async (date) => {
    await syncSubscriptions(date)
})

module.exports = syncSbbolSubscriptions
