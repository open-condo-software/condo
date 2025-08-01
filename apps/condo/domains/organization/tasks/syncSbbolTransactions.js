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
const { SBBOL_IDP_TYPE } = require('@condo/domains/user/constants/identityProviders')
const { UserExternalIdentity } = require('@condo/domains/user/utils/serverSchema')

const dvAndSender = { dv: 1, sender: { dv: 1, fingerprint: 'syncSbbolTransactions' } }

async function updateStatusOfBankSyncTask (context, taskId, status) {
    return await BankSyncTask.update(context, taskId, {
        status,
        ...dvAndSender,
    })
}

const logger = getLogger()

/**
 * Synchronizes SBBOL transaction data with data in the system
 */
async function syncSbbolTransactions (dateInterval) {
    const { keystone: context } = await getSchemaCtx('User')
    // TODO(VKislov): DOMA-5239 Should not receive deleted instances with admin context
    const usersWithSBBOLExternalIdentity = await UserExternalIdentity.getAll(context, {
        identityType: SBBOL_IDP_TYPE,
        deletedAt: null,
    }, 'id user { id }')
    if (isEmpty(usersWithSBBOLExternalIdentity)) return logger.info('No users imported from SBBOL found. Cancel sync transactions')

    const syncedOrgIds = []
    for (const identity of usersWithSBBOLExternalIdentity) {
        const userId = identity.user.id
        const [employee] = await OrganizationEmployee.getAll(context, {
            user: { id: userId },
            organization: {
                id_not_in: syncedOrgIds,
                importRemoteSystem: SBBOL_IMPORT_NAME,
                deletedAt: null,
            },
            deletedAt: null,
        },  'organization { id tin }', { first: 1 })

        if (employee) {
            const organization = get(employee, 'organization')
            await requestTransactions({
                dateInterval,
                userId,
                organization,
            })
            syncedOrgIds.push(organization.id)
        }
    }
}

/**
 * Synchronizes SBBOL transaction data with data in the system
 */
async function syncSbbolTransactionsBankSyncTask (taskId) {
    if (!taskId) {
        await updateStatusOfBankSyncTask(context, taskId, BANK_SYNC_TASK_STATUS.ERROR)
        throw new Error('Missing taskId')
    }
    const { keystone: context } = getSchemaCtx('User')

    let bankSyncTask

    bankSyncTask = await BankSyncTask.getOne(context, {
        id: taskId,
    }, 'id options { type dateFrom dateTo } user { id } organization { id tin }')

    const dateInterval = [get(bankSyncTask, 'options.dateFrom')]
    while (dateInterval[dateInterval.length - 1] < get(bankSyncTask, 'options.dateTo')) {
        dateInterval.push(dayjs(dateInterval[dateInterval.length - 1]).add(1, 'day').format('YYYY-MM-DD'))
    }

    try {
        await requestTransactions({ dateInterval, userId: bankSyncTask.user.id, organization: bankSyncTask.organization, bankSyncTaskId: taskId })
    } catch (e) {
        await updateStatusOfBankSyncTask(context, taskId, BANK_SYNC_TASK_STATUS.ERROR)
        throw new Error(`Cannot requestTransactions. ${e}`)
    }
    bankSyncTask = await BankSyncTask.getOne(context, {
        id: taskId,
    }, 'id status')
    if (bankSyncTask.status !== BANK_SYNC_TASK_STATUS.ERROR || bankSyncTask.status !== BANK_SYNC_TASK_STATUS.CANCELLED) {
        await updateStatusOfBankSyncTask(context, taskId, BANK_SYNC_TASK_STATUS.COMPLETED)
    }
}

module.exports = {
    syncSbbolTransactionsCron: createCronTask('syncSbbolTransactionsCron', '0 0 * * *', async () => {
        const date = dayjs().format('YYYY-MM-DD')
        await syncSbbolTransactions([date])
    }),
    syncSbbolTransactionsBankSyncTask: createTask('syncSbbolTransactionsBankSyncTask', syncSbbolTransactionsBankSyncTask),
}
