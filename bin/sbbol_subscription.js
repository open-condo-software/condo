const yargs = require('yargs/yargs')
const dayjs = require('dayjs')
const { createCronTask } = require('@core/keystone/tasks')
const { syncSubscriptions } = require('@condo/domains/organization/integrations/sbbol/sync/syncSubscriptions')

const syncSbbolSubscriptions = createCronTask('syncSbbolSubscriptions', '20 9 * * *', async () => {
    const date = yargs(process.argv).date
    const today = dayjs(date).format('YYYY-MM-DD')
    await syncSubscriptions(today)
})

syncSbbolSubscriptions.delay()
