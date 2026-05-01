const get = require('lodash/get')

const { throwAuthenticationError } = require('@open-condo/keystone/apolloErrorFormatter')
const { getById } = require('@open-condo/keystone/schema')

const {
    checkPermissionsInEmployedOrRelatedOrganizations,
    getEmployedOrRelatedOrganizationsByPermissions,
} = require('@condo/domains/organization/utils/accessSchema')
const { SERVICE } = require('@condo/domains/user/constants/common')
const { canDirectlyManageSchemaObjects, canDirectlyReadSchemaObjects } = require('@condo/domains/user/utils/directAccess')

async function canReadBillingPolicies ({ authentication: { item: user }, context, listKey }) {
    if (!user) return throwAuthenticationError()
    if (user.deletedAt) return false
    if (user.isAdmin || user.isSupport) return {}

    const hasDirectAccess = await canDirectlyReadSchemaObjects(user, listKey)
    if (hasDirectAccess) return true
    if (user.type === SERVICE) return false

    const organizationIds = await getEmployedOrRelatedOrganizationsByPermissions(context, user, 'canReadBillingReceipts')

    return {
        organization: {
            id_in: organizationIds,
        },
        deletedAt: null,
    }
}

async function canManageBillingPolicies ({ authentication: { item: user }, originalInput, operation, itemId, context, listKey }) {
    if (!user) return throwAuthenticationError()
    if (user.deletedAt) return false
    if (user.isAdmin || user.isSupport) return true

    const hasDirectAccess = await canDirectlyManageSchemaObjects(user, listKey, originalInput, operation)
    if (hasDirectAccess) return true
    if (user.type === SERVICE) return false

    let organizationId

    if (operation === 'create') {
        organizationId = get(originalInput, ['organization', 'connect', 'id'])
    } else if (operation === 'update' && itemId) {
        const item = await getById('BillingPolicy', itemId)
        organizationId = get(item, 'organization')
    }

    if (!organizationId) return false

    return await checkPermissionsInEmployedOrRelatedOrganizations(context, user, organizationId, 'canManageBillingReceipts')
}

module.exports = {
    canReadBillingPolicies,
    canManageBillingPolicies,
}
