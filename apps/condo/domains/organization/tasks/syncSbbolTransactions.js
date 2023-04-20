const dayjs = require('dayjs')
const get = require('lodash/get')
const isEmpty = require('lodash/isEmpty')

const { getLogger } = require('@open-condo/keystone/logging')
const { getSchemaCtx } = require('@open-condo/keystone/schema')
const { createTask, createCronTask } = require('@open-condo/keystone/tasks')

const { BANK_SYNC_TASK_STATUS } = require('@condo/domains/banking/constants')
const { BankSyncTask } = require('@condo/domains/banking/utils/serverSchema')
const { SBBOL_IMPORT_NAME } = require('@condo/domains/organization/integrations/sbbol/constants')
const { requestTransactions } = require('@condo/domains/organization/integrations/sbbol/sync/requestTransactions')
const { OrganizationEmployee } = require('@condo/domains/organization/utils/serverSchema')
const { SBBOL_IDP_TYPE } = require('@condo/domains/user/constants/common')
const { UserExternalIdentity } = require('@condo/domains/user/utils/serverSchema')

const dvAndSender = { dv: 1, sender: { dv: 1, fingerprint: 'syncSbbolTransactions' } }

async function bankSyncTaskUpdateStatus (context, taskId, status) {
    return await BankSyncTask.update(context, taskId, {
        status,
        ...dvAndSender,
    })
}

const logger = getLogger('sbbol/CronTaskSyncTransactions')

/**
 * Synchronizes SBBOL transaction data with data in the system
 */
async function syncSbbolTransactions (dateInterval, userId = '', organization = {}) {
    // if userId and organization is passed, receive transactions only for it. Case when it's not a cron task
    if (userId && !isEmpty(organization)) return await requestTransactions({ dateInterval, userId, organization })

    const { keystone: context } = await getSchemaCtx('User')
    // TODO(VKislov): DOMA-5239 Should not receive deleted instances with admin context
    const usersWithSBBOLExternalIdentity = await UserExternalIdentity.getAll(context, {
        identityType: SBBOL_IDP_TYPE,
        deletedAt: null,
    })
    if (isEmpty(usersWithSBBOLExternalIdentity)) return logger.info('No users imported from SBBOL found. Cancel sync transactions')

    for (const identity of usersWithSBBOLExternalIdentity) {
        const userId = identity.user.id
        const [employee] = await OrganizationEmployee.getAll(context, {
            user: { id: userId },
            organization: {
                importRemoteSystem: SBBOL_IMPORT_NAME,
                deletedAt: null,
            },
            deletedAt: null,
        }, { first: 1 })

        if (employee) {
            await requestTransactions({
                dateInterval,
                userId,
                organization: get(employee, 'organization'),
            })
        }
    }
}

/**
 * Synchronizes SBBOL transaction data with data in the system
 */
async function syncSbbolTransactionsBankSyncTask (dateInterval, userId, organization, taskId) {
    const { keystone: context } = await getSchemaCtx('User')

    if (!dateInterval || !userId || !organization || !taskId) {
        await bankSyncTaskUpdateStatus(context, taskId, BANK_SYNC_TASK_STATUS.ERROR)
        throw new Error('Missing setup args')
    }

    try {
        await requestTransactions({ dateInterval, userId, organization })
    } catch (e) {
        await bankSyncTaskUpdateStatus(context, taskId, BANK_SYNC_TASK_STATUS.ERROR)
        throw new Error(`Cannot requestTransactions. ${e}`)
    }

    await bankSyncTaskUpdateStatus(context, taskId, BANK_SYNC_TASK_STATUS.COMPLETED)
}

module.exports = {
    syncSbbolTransactionsCron: createCronTask('syncSbbolTransactionsCron', '0 0 * * *', async () => {
        const date = dayjs().format('YYYY-MM-DD')
        await syncSbbolTransactions([date])
    }),
    syncSbbolTransactionsBankSyncTask: createTask('syncSbbolTransactionsBankSyncTask', syncSbbolTransactionsBankSyncTask, { priority: 2 }),
    syncSbbolTransactions: createTask('syncSbbolTransactions', syncSbbolTransactions, { priority: 2 }),
}