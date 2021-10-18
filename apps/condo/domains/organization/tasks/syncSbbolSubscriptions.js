const { createCronTask } = require('@core/keystone/tasks')
const { syncSubscriptions } = require('../integrations/sbbol/sync/syncSubscriptions')
const dayjs = require('dayjs')

/**
 * Syncs new and cancelled subscriptions
 */
const syncSbbolSubscriptions = createCronTask('syncSbbolSubscriptions', '20 9 * * *', async () => {
    const today = dayjs().format('YYYY-MM-DD')
    await syncSubscriptions(today)
})

module.exports = syncSbbolSubscriptions