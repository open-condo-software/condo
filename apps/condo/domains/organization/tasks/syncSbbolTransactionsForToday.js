const dayjs = require('dayjs')
const { get, isEmpty } = require('lodash')

const { getLogger } = require('@open-condo/keystone/logging')
const { getSchemaCtx } = require('@open-condo/keystone/schema')

const { SBBOL_IMPORT_NAME } = require('@condo/domains/organization/integrations/sbbol/constants')
const { requestTransactions } = require('@condo/domains/organization/integrations/sbbol/sync/requestTransactions')
const { OrganizationEmployee } = require('@condo/domains/organization/utils/serverSchema')
const { SBBOL_IDP_TYPE } = require('@condo/domains/user/constants/common')
const { UserExternalIdentity } = require('@condo/domains/user/utils/serverSchema')


const logger = getLogger('syncSbbolTransactionsForToday')

/**
 * Synchronizes SBBOL transaction data with data in the system
 */
async function syncSbbolTransactionsForDateInterval (dateInterval) {
    const { keystone: context } = await getSchemaCtx('User')
    // TODO(VKislov): DOMA-5239 Should not receive deleted instances with admin context
    const usersWithSBBOLExternalIdentity = await UserExternalIdentity.getAll(context, {
        identityType: SBBOL_IDP_TYPE,
        deletedAt: null,
    })
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
        }, { first: 1 })

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

async function syncSbbolTransactionsForToday () {
    const date = dayjs().format('YYYY-MM-DD')
    await syncSbbolTransactionsForDateInterval([date])
}


module.exports = {
    syncSbbolTransactionsForToday,
}