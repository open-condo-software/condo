const get = require('lodash/get')
const isEmpty = require('lodash/isEmpty')

const { getLogger } = require('@open-condo/keystone/logging')
const { getSchemaCtx } = require('@open-condo/keystone/schema')
const { createCronTask } = require('@open-condo/keystone/tasks')

const { BANK_INTEGRATION_IDS } = require('@condo/domains/banking/constants')
const { BankIntegration } = require('@condo/domains/banking/utils/serverSchema')
const { SBBOL_IMPORT_NAME } = require('@condo/domains/organization/integrations/sbbol/constants')
const { syncBankAccounts } = require('@condo/domains/organization/integrations/sbbol/sync/syncBankAccounts')
const { OrganizationEmployee } = require('@condo/domains/organization/utils/serverSchema')
const { UserExternalIdentity } = require('@condo/domains/user/utils/serverSchema')



const logger = getLogger('sbbol/syncBankAccounts')

/**
 * Syncs bank accounts with SBBOL accounts
 */
async function syncSbbolBankAccounts () {
    const { keystone: context } = await getSchemaCtx('User')
    // TODO(VKislov): DOMA-5239 Should not receive deleted instances with admin context
    const usersWithSBBOLExternalIdentity = await UserExternalIdentity.getAll(context, {
        importRemoteSystem: SBBOL_IMPORT_NAME,
        deletedAt: null,
    })
    if (isEmpty(usersWithSBBOLExternalIdentity)) return logger.info('No users imported from SBBOL found. Cancel sync bank accounts')

    const integration = await BankIntegration.getOne(context, { id: BANK_INTEGRATION_IDS.SBBOL })
    if (!integration) throw new Error(`Cannot find SBBOL integration by id=" ${BANK_INTEGRATION_IDS.SBBOL}"`)

    for (const identity of usersWithSBBOLExternalIdentity) {
        const [employee] = await OrganizationEmployee.getAll(context, {
            user: identity.user.id,
            organization: {
                importRemoteSystem: SBBOL_IMPORT_NAME,
                deletedAt: null,
            },
            deletedAt: null,
            isRejected: false,
            isBlocked: false,
        }, { first: 1 })

        await syncBankAccounts(identity.user.id, employee.organization)
    }

}

module.exports = {
    syncSbbolBankAccountsCron: createCronTask(
        'syncSbbolBankAccountsCron',
        '0 0 * * *',
        syncSbbolBankAccounts,
        { priority: 2 }
    ),
}