const dayjs = require('dayjs')
const { get } = require('lodash')

const { getSchemaCtx } = require('@open-condo/keystone/schema')

const { BANK_SYNC_TASK_STATUS } = require('@condo/domains/banking/constants')
const { BankSyncTask } = require('@condo/domains/banking/utils/serverSchema')
const { requestTransactions } = require('@condo/domains/organization/integrations/sbbol/sync/requestTransactions')


const dvAndSender = { dv: 1, sender: { dv: 1, fingerprint: 'syncSbbolTransactions' } }

async function updateStatusOfBankSyncTask (context, taskId, status) {
    return await BankSyncTask.update(context, taskId, {
        status,
        ...dvAndSender,
    })
}

/**
 * Synchronizes SBBOL transaction data with data in the system
 */
async function syncSbbolTransactions (taskId) {
    const { keystone: context } = await getSchemaCtx('User')
    if (!taskId) {
        await updateStatusOfBankSyncTask(context, taskId, BANK_SYNC_TASK_STATUS.ERROR)
        throw new Error('Missing taskId')
    }

    let bankSyncTask

    bankSyncTask = await BankSyncTask.getOne(context, {
        id: taskId,
    })

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
    })
    if (bankSyncTask.status !== BANK_SYNC_TASK_STATUS.ERROR || bankSyncTask.status !== BANK_SYNC_TASK_STATUS.CANCELLED) {
        await updateStatusOfBankSyncTask(context, taskId, BANK_SYNC_TASK_STATUS.COMPLETED)
    }
}

module.exports = {
    syncSbbolTransactions,
}