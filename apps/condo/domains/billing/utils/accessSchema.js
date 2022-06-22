const { get } = require('lodash')
const { getByCondition } = require('@core/keystone/schema')
const { checkOrganizationPermission } = require('../../organization/utils/accessSchema')
const { getById } = require('@core/keystone/schema')
const { throwAuthenticationError } = require('@condo/domains/common/utils/apolloErrorFormatter')

async function checkBillingIntegrationAccessRight (userId, integrationId) {
    if (!userId || !integrationId) return false

    const integration = await getByCondition('BillingIntegrationAccessRight', {
        integration: { id: integrationId },
        user: { id: userId },
        deletedAt: null,
    })

    return !!get(integration, 'id')
}

/**
 * Billing entity can be read either by:
 * 1. By admin or support
 * 2. By integration account
 * 3. By integration organization manager
 */
async function canReadBillingEntity (authentication) {
    const { item: user } = authentication
    if (!user) return throwAuthenticationError()
    if (user.deletedAt) return false
    if (user.isAdmin || user.isSupport) return {}

    return {
        OR: [
            { context: { organization: { employees_some: { user: { id: user.id }, role: { OR: [{ canReadBillingReceipts: true }, { canManageIntegrations: true }] }, deletedAt: null, isBlocked: false } } } },
            { context: { integration: { accessRights_some: { user: { id: user.id }, deletedAt: null } } } },
        ],
    }
}

/**
 * Billing entity can be created either by:
 * 1. By admin or support
 * 2. By integration account
 * 3. By integration organization manager (TODO (DOMA-2348) Do they need this right?!
 */
async function canManageBillingEntityWithContext ({ authentication, operation, itemId, originalInput, schemaWithContextName }) {
    const { item: user } = authentication
    if (!user) return throwAuthenticationError()
    if (user.deletedAt) return false
    if (user.isAdmin) return true

    let contextIds

    if (operation === 'create') {
        contextIds = Array.isArray(originalInput) ? originalInput.map(({ data }) => get(data, 'context.connect.id')) : [get(originalInput, 'context.connect.id')]
    } else if (operation === 'update') {
        if (!itemId) return false
        const itemWithContext = await getById(schemaWithContextName, itemId)
        contextIds = [get(itemWithContext, ['context'])]
        if (!contextIds.length) return false
    }
    const uniqContextIds = [...new Set(contextIds)]
    let result = true
    for (const contextId of uniqContextIds) {
        const organizationContext = await getById('BillingIntegrationOrganizationContext', contextId)
        if (!organizationContext) {
            result = false
            break
        }
        const { organization: organizationId, integration: integrationId } = organizationContext
        const canManageIntegrations = await checkOrganizationPermission(user.id, organizationId, 'canManageIntegrations')
        if (!canManageIntegrations) {
            result = await checkBillingIntegrationAccessRight(user.id, integrationId)
        }
        if (!result) {
            break
        }
    }
    return result
}

module.exports = {
    checkBillingIntegrationAccessRight,
    canReadBillingEntity,
    canManageBillingEntityWithContext,
}


