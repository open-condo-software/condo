const dayjs = require('dayjs')
const get = require('lodash/get')
const isEmpty = require('lodash/isEmpty')

const { getLogger } = require('@open-condo/keystone/logging')
const { getSchemaCtx } = require('@open-condo/keystone/schema')
const { createTask, createCronTask } = require('@open-condo/keystone/tasks')

const { BANK_INTEGRATION_IDS } = require('@condo/domains/banking/constants')
const { BankIntegration, BankIntegrationContext } = require('@condo/domains/banking/utils/serverSchema')
const { SBBOL_IMPORT_NAME } = require('@condo/domains/organization/integrations/sbbol/constants')
const { requestTransactions } = require('@condo/domains/organization/integrations/sbbol/sync/requestTransactions')
const { OrganizationEmployee } = require('@condo/domains/organization/utils/serverSchema')
const { User, UserExternalIdentity } = require('@condo/domains/user/utils/serverSchema')


const logger = getLogger('sbbol/CronTaskSyncTransactions')

/**
 * Synchronizes SBBOL transaction data with data in the system
 * @returns {Promise<void|Transaction[]>}
 */
async function syncSbbolTransactions (date, userId = '', organization = {}, bankIntegrationContextId = '' ) {
    // if userId and organization is passed, receive transactions only for it. Case when it's not a cron task
    if (userId && !isEmpty(organization)) return await requestTransactions({ date, userId, organization, bankIntegrationContextId })

    const { keystone: context } = await getSchemaCtx('User')
    // TODO(VKislov): DOMA-5239 Should not receive deleted instances with admin context
    const usersWithSBBOLExternalIdentity = await UserExternalIdentity.getAll(context, {
        importRemoteSystem: SBBOL_IMPORT_NAME,
        deletedAt: null,
    })
    if (isEmpty(usersWithSBBOLExternalIdentity)) return logger.info('No users imported from SBBOL found. Cancel sync transactions')

    const integration = await BankIntegration.getOne(context, { id: BANK_INTEGRATION_IDS.SBBOL })
    if (!integration) throw new Error(`BankIntegration where: { id: ${BANK_INTEGRATION_IDS.SBBOL} } was not found`)

    for (const identity of usersWithSBBOLExternalIdentity) {
        const userId = identity.user.id
        const [employee] = OrganizationEmployee.getAll(context, {
            user: userId,
            organization: {
                importRemoteSystem: SBBOL_IMPORT_NAME,
                deletedAt: null,
            },
            deletedAt: null,
        }, { first: 1 })

        const organizationId = get(employee, 'organization, id')
        const where = {
            integration: { id: integration.id },
            organization: { id: organizationId },
        }
        const [foundIntegrationContext] = await BankIntegrationContext.getAll(context, where, { first: 1 })

        if (!foundIntegrationContext) return logger.info(`BankIntegrationContext not found for organization { id: ${organizationId} }. Skip sync transactions`)

        await requestTransactions({
            date,
            userId,
            organization: get(employee, 'organization'),
            bankIntegrationContextId: foundIntegrationContext.id,
        })
    }
}

module.exports = {
    syncSbbolTransactionsCron: createCronTask('syncSbbolTransactionsCron', '0 0 * * *', async () => {
        const date = dayjs().format('YYYY-MM-DD')
        await syncSbbolTransactions(date)
    }),
    syncSbbolTransactions: createTask('syncSbbolTransactions', syncSbbolTransactions, { priority: 2 }),
}