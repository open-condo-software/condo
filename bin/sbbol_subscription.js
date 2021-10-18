const yargs = require('yargs/yargs')
const dayjs = require('dayjs')
const { syncSubscriptions } = require('@condo/domains/organization/integrations/sbbol/sync/syncSubscriptions')

const date = yargs(process.argv).date
const today = dayjs(date).format('YYYY-MM-DD')

syncSubscriptions(today).then(
    () => {
        console.log('sucessfully synced')
    },
    () => {
        console.log('error')
    }
)
