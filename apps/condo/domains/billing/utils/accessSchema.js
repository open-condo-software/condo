const { get } = require('lodash')
const { getByCondition } = require('@core/keystone/schema')
const { checkOrganizationPermission } = require('../../organization/utils/accessSchema')
const { getById } = require('@core/keystone/schema')
const { throwAuthenticationError } = require('@condo/domains/common/utils/apolloErrorFormatter')

async function checkBillingIntegrationAccessRight(userId, integrationId) {
    if (!userId || !integrationId) return false
    const integration = await getByCondition('BillingIntegrationAccessRight', {
        integration: { id: integrationId },
        user: { id: userId },
    })
    return !!get(integration, 'id')
}

async function canReadBillingEntity(user) {
    if (!user) return throwAuthenticationError()
    if (user.isAdmin) return {}
    return {
        OR: [
            {
                context: {
                    organization: {
                        employees_some: {
                            user: { id: user.id },
                            role: { OR: [{ canReadBillingReceipts: true }, { canManageIntegrations: true }] },
                            deletedAt: null,
                            isBlocked: false,
                        },
                    },
                },
            },
            { context: { integration: { accessRights_some: { user: { id: user.id } } } } },
        ],
    }
}

async function canManageBillingEntityWithContext({ user, operation, itemId, originalInput, schemaWithContextName, context }) {
    if (!user) return throwAuthenticationError()
    if (user.isAdmin) return true
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
    if (!organizationContext) return false
    const { organization: organizationId, integration: integrationId } = organizationContext
    const canManageIntegrations = await checkOrganizationPermission(context, user.id, organizationId, 'canManageIntegrations')
    if (canManageIntegrations) return true
    return await checkBillingIntegrationAccessRight(user.id, integrationId)
}

module.exports = {
    checkBillingIntegrationAccessRight,
    canReadBillingEntity,
    canManageBillingEntityWithContext,
}
