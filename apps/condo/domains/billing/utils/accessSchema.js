const { get } = require('lodash')
const { getByCondition } = require('@core/keystone/schema')
const { checkOrganizationPermission } = require('../../organization/utils/accessSchema')
const { getById } = require('@core/keystone/schema')
const { throwAuthenticationError } = require('@condo/domains/common/utils/apolloErrorFormatter')
const { USER_SCHEMA_NAME } = require('@condo/domains/common/constants/utils')

async function checkBillingIntegrationAccessRight (userId, integrationId) {
    if (!userId || !integrationId) return false
    const integration = await getByCondition('BillingIntegrationAccessRight', {
        integration: { id: integrationId },
        user: { id: userId },
        deletedAt: null,
    })
    return !!get(integration, 'id')
}

async function canReadBillingEntity (authentication) {
    const { listKey, item } = authentication
    if (!listKey || !item) return throwAuthenticationError()
    if (item.deletedAt) return false
    if (listKey === USER_SCHEMA_NAME) {
        if (item.isAdmin) return {}
        return {
            OR: [
                { context: { organization: { employees_some: { user: { id: item.id }, role: { OR: [{ canReadBillingReceipts: true }, { canManageIntegrations: true }] }, deletedAt: null, isBlocked: false } } } },
                { context: { integration: { accessRights_some: { user: { id: item.id }, deletedAt: null } } } },
            ],
        }
    }
    return false
}

async function canManageBillingEntityWithContext ({ authentication, operation, itemId, originalInput, schemaWithContextName }) {
    const { item, listKey } = authentication
    if (!listKey || !item) return throwAuthenticationError()
    if (item.deletedAt) return false
    if (listKey === USER_SCHEMA_NAME) {
        if (item.isAdmin) return true
        let contextId
        if (operation === 'create') {
            // NOTE: can only be created by the organization integration manager
            contextId = get(originalInput, ['context', 'connect', 'id'])
        } else if (operation === 'update') {
            // NOTE: can update by the organization integration manager OR the integration account
            if (!itemId) return false
            const itemWithContext = await getById(schemaWithContextName, itemId)
            contextId = get(itemWithContext, ['context'])
            if (!contextId) return false
        }
        const organizationContext = await getById('BillingIntegrationOrganizationContext', contextId)
        const userId = item.id
        if (!organizationContext) return false
        const { organization: organizationId, integration: integrationId } = organizationContext
        const canManageIntegrations = await checkOrganizationPermission(userId, organizationId, 'canManageIntegrations')
        if (canManageIntegrations) return true
        return await checkBillingIntegrationAccessRight(userId, integrationId)
    }
    return false
}

module.exports = {
    checkBillingIntegrationAccessRight,
    canReadBillingEntity,
    canManageBillingEntityWithContext,
}


