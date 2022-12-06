const { createTask, createCronTask } = require('@open-condo/keystone/tasks')
const { User } = require('@condo/domains/user/utils/serverSchema')
const { requestTransactions } = require('@condo/domains/organization/integrations/sbbol/sync/requestTransactions')
const { SBBOL_IMPORT_NAME } = require('@condo/domains/organization/integrations/sbbol/constants')
const { getSchemaCtx } = require('@open-condo/keystone/schema')
const { getLogger } = require('@open-condo/keystone/logging')
const dayjs = require('dayjs')
const isEmpty = require('lodash/isEmpty')

const logger = getLogger('sbbol/CronTaskSyncTransactions')

/**
 * Synchronizes SBBOL transaction data with data in the system
 * @returns {Promise<void>}
 */
async function syncSbbolTransactions (date, userId = '') {
    // if userId is passed, receive transactions only for it. Case when it's not a cron task
    if (userId) return await requestTransactions(date, userId)

    const { keystone: userContext } = await getSchemaCtx('User')
    const users = await User.getAll(userContext, { importRemoteSystem: SBBOL_IMPORT_NAME, deletedAt: null })

    if (isEmpty(users)) return logger.info('No users imported from sbbol found. Cancel sync transactions')

    for (const user of users) {
        await requestTransactions(date, user.id)
    }
}

module.exports = {
    syncSbbolTransactionsCron: createCronTask('syncSbbolTransactionsCron', '0 0 * * *', async () => {
        const date = dayjs().format('YYYY-MM-DD')
        await syncSbbolTransactions(date)
    }),
    syncSbbolTransactions: createTask('syncSbbolTransactions', syncSbbolTransactions, { priority: 2 }),
}