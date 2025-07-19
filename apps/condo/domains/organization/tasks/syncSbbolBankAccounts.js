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
const { SBBOL_IDP_TYPE } = require('@condo/domains/user/constants/common')
const { UserExternalIdentity } = require('@condo/domains/user/utils/serverSchema')



const logger = getLogger()

/**
 * Syncs bank accounts with SBBOL accounts
 */
async function syncSbbolBankAccounts () {
    const { keystone: context } = await getSchemaCtx('User')
    // TODO(VKislov): DOMA-5239 Should not receive deleted instances with admin context
    const usersWithSBBOLExternalIdentity = await UserExternalIdentity.getAll(context, {
        identityType: SBBOL_IDP_TYPE,
        deletedAt: null,
    }, 'id user { id }')
    if (isEmpty(usersWithSBBOLExternalIdentity)) return logger.info('no users imported from SBBOL found. Cancel sync bank accounts')

    const integration = await BankIntegration.getOne(context, { id: BANK_INTEGRATION_IDS.SBBOL })
    if (!integration) throw new Error(`Cannot find SBBOL integration by id=" ${BANK_INTEGRATION_IDS.SBBOL}"`)

    const syncedOrgIds = []
    for (let identity of usersWithSBBOLExternalIdentity) {
        const [employee] = await OrganizationEmployee.getAll(context, {
            user: {
                id: identity.user.id,
            },
            organization: {
                id_not_in: syncedOrgIds,
                importRemoteSystem: SBBOL_IMPORT_NAME,
                deletedAt: null,
            },
            deletedAt: null,
            isRejected: false,
            isBlocked: false,
        }, 'organization { id tin name }', { first: 1 })

        if (employee) {
            const organization = get(employee, 'organization')
            await syncBankAccounts(identity.user.id, organization)
            syncedOrgIds.push(organization.id)
        }
    }

}

module.exports = {
    syncSbbolBankAccountsCron: createCronTask(
        'syncSbbolBankAccountsCron',
        '0 0 * * *',
        syncSbbolBankAccounts
    ),
}
