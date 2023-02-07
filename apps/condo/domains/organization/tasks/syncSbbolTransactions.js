const dayjs = require('dayjs')
const isEmpty = require('lodash/isEmpty')

const { getLogger } = require('@open-condo/keystone/logging')
const { getSchemaCtx } = require('@open-condo/keystone/schema')
const { createTask, createCronTask } = require('@open-condo/keystone/tasks')

const { SBBOL_IMPORT_NAME } = require('@condo/domains/organization/integrations/sbbol/constants')
const { requestTransactions } = require('@condo/domains/organization/integrations/sbbol/sync/requestTransactions')
const { User, UserExternalIdentity } = require('@condo/domains/user/utils/serverSchema')


const logger = getLogger('sbbol/CronTaskSyncTransactions')

/**
 * Synchronizes SBBOL transaction data with data in the system
 * @returns {Promise<void|Transaction[]>}
 */
async function syncSbbolTransactions (date, userId = '', organization = {} ) {
    // if userId and organization is passed, receive transactions only for it. Case when it's not a cron task
    if (userId && organization) return await requestTransactions(date, userId, organization)

    const { keystone: context } = await getSchemaCtx('User')
    // TODO(VKislov): DOMA-5239 Should not receive deleted instances with admin context
    const usersWithSBBOLExternalIdentity = await UserExternalIdentity.getAll(context, {
        importRemoteSystem: SBBOL_IMPORT_NAME,
        deletedAt: null,
    })
    if (isEmpty(usersWithSBBOLExternalIdentity)) return logger.info('No users imported from SBBOL found. Cancel sync transactions')

    for (const identity of usersWithSBBOLExternalIdentity) {
        await requestTransactions(date, identity.user.id, organization)
    }
}

module.exports = {
    syncSbbolTransactionsCron: createCronTask('syncSbbolTransactionsCron', '0 0 * * *', async () => {
        const date = dayjs().format('YYYY-MM-DD')
        await syncSbbolTransactions(date)
    }),
    syncSbbolTransactions: createTask('syncSbbolTransactions', syncSbbolTransactions, { priority: 2 }),
}