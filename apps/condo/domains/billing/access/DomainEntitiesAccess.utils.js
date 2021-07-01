const { checkBillingIntegrationAccessRight } = require('../utils/accessSchema')
const { checkOrganizationPermission } = require('../../organization/utils/accessSchema')
const { getById } = require('@core/keystone/schema')

async function canReadBillingEntity (user) {
    if (!user) return false
    if (user.isAdmin) return true
    return {
        OR: [
            { organization: { employees_some: { user: { id: user.id }, role: { canManageIntegrations: true } } } },
            { integration: { accessRights_some: { user: { id: user.id } } } },
        ],
    }
}

async function canManageBillingEntity (user, operation, itemId) {
    if (!user) return false
    if (user.isAdmin) return true
    if (operation === 'create' || operation === 'update') {
        // Billing integration and Organization integration manager can create and update entities
        if (!itemId) return false
        const context = await getById('BillingIntegrationOrganizationContext', itemId)
        if (!context) return false
        const { organization: organizationId, integration: integrationId } = context
        const canManageIntegrations = await checkOrganizationPermission(user.id, organizationId, 'canManageIntegrations')
        if (canManageIntegrations) return true
        return await checkBillingIntegrationAccessRight(user.id, integrationId)
    }
    return false
}
 
module.exports = {
    canReadBillingEntity,
    canManageBillingEntity,
}