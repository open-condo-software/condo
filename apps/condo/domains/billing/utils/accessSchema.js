const { get, uniq, isArray, isEmpty } = require('lodash')

const { throwAuthenticationError } = require('@open-condo/keystone/apolloErrorFormatter')
const { getById, find } = require('@open-condo/keystone/schema')

const { CONTEXT_FINISHED_STATUS } = require('@condo/domains/billing/constants/constants')
const { canReadObjectsAsB2BAppServiceUser } = require('@condo/domains/miniapp/utils/b2bAppServiceUserAccess')
const { canExecuteServiceAsB2BAppServiceUser } = require('@condo/domains/miniapp/utils/b2bAppServiceUserAccess/server.utils')
const { SERVICE, STAFF } = require('@condo/domains/user/constants/common')


async function checkBillingIntegrationsAccessRights (userId, integrationIds) {
    if (!userId) return false
    if (!isArray(integrationIds) || isEmpty(integrationIds) || !integrationIds.every(Boolean)) return false

    const rights = await find('BillingIntegrationAccessRight', {
        integration: { id_in: integrationIds },
        user: { id: userId },
        deletedAt: null,
    })

    const permittedIntegrations = new Set(rights.map(right => right.integration))
    const nonPermittedIntegrations = integrationIds.filter(id => !permittedIntegrations.has(id))

    return isEmpty(nonPermittedIntegrations)
}

async function getValidBillingContextForReceiptsPublish (contextId) {
    const [context] = await find('BillingIntegrationOrganizationContext', {
        id: contextId,
        deletedAt: null,
        integration: {  deletedAt: null },
        organization: { deletedAt: null },
        status: CONTEXT_FINISHED_STATUS,
    })
    return context
}

async function checkB2BAccessRightsToBillingContext (args, context) {
    const integration = await getById('BillingIntegration', context.integration)
    if (integration.b2bApp) {
        return  await canExecuteServiceAsB2BAppServiceUser(args, context.organization)
    }
    return false
}

/**
 * Billing entity can be read either by:
 * 1. By admin or support
 * 2. By integration account
 * 3. By integration organization manager
 * 3. By B2BApp
 */
async function canReadBillingEntity (args) {
    const user = args?.authentication?.item
    if (!user) return throwAuthenticationError()
    if (user.deletedAt) return false
    if (user.isAdmin || user.isSupport) return {}

    if (user.type === SERVICE) {
        const canReadAsB2BAppServiceUser = await canReadObjectsAsB2BAppServiceUser(args)
        // NOTE: The original code used nested relationship filters inside an OR:
        //   { context: { organization: { id_in: [...] } } }  — from canReadObjectsAsB2BAppServiceUser
        //   { context: { integration: { accessRights_some: { user: { id }, deletedAt: null } } } }
        // Both are 2-level nested. Under certain query patterns (e.g. filtering by
        // `property.addressKey + unitType + unitName`), Keystone v5 does not correctly
        // translate deeply nested relationship filters inside OR conditions, causing
        // BillingAccounts from organizations disconnected from the B2B app to leak through.
        // To avoid this, we resolve the permitted context IDs via direct DB queries
        // and return a flat `context.id_in` filter that Keystone translates reliably.
        // The `accessRights_some` condition (1-level nesting on BillingIntegration) is kept
        // as a separate filter condition since it works correctly at that nesting level.
        const filterConditions = [
            // BillingIntegrationAccessRight path — works fine as 1-level nesting
            { context: { integration: { accessRights_some: { user: { id: user.id }, deletedAt: null } } } },
        ]
        if (canReadAsB2BAppServiceUser) {
            // B2BApp path — resolve org IDs to context IDs to avoid 2-level nesting
            const orgIds = canReadAsB2BAppServiceUser.context?.organization?.id_in || []
            if (!isEmpty(orgIds)) {
                const permittedContexts = await find('BillingIntegrationOrganizationContext', {
                    organization: { id_in: orgIds },
                    deletedAt: null,
                })
                if (!isEmpty(permittedContexts)) {
                    filterConditions.push({ context: { id_in: uniq(permittedContexts.map(ctx => ctx.id)) } })
                }
            }
        }
        return { OR: filterConditions }
    }
    if (user.type === STAFF) {
        return { 
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
        }
    }
    return false
}

/**
 * Billing entity can be created either by:
 * 1. By admin or support
 * 2. By integration account (with service type)
 */
async function canManageBillingEntityWithContext ({ authentication, operation, itemId, itemIds, originalInput, listKey }) {
    const { item: user } = authentication
    if (!user) return throwAuthenticationError()
    if (user.deletedAt) return false
    if (user.isAdmin) return true
    if (user.type !== SERVICE) return false

    const isBulkRequest = Array.isArray(originalInput)

    // STEP 1: Obtain contextIds and match theirs amounts
    let contextIds
    if (operation === 'create') {
        if (isBulkRequest) {
            contextIds = originalInput.map(element => get(element, ['data', 'context', 'connect', 'id']))
            if (contextIds.filter(Boolean).length !== originalInput.length) return false
            contextIds = uniq(contextIds)
        } else {
            const contextId = get(originalInput, ['context', 'connect', 'id'])
            if (!contextId) return false
            contextIds = [contextId]
        }
    } else if (operation === 'update') {
        if (isBulkRequest) {
            if (!itemIds || !Array.isArray(itemIds)) return false
            if (itemIds.length !== uniq(itemIds).length) return false
            const items = await find(listKey, {
                id_in: itemIds,
                deletedAt: null,
            })
            if (items.length !== itemIds.length) return false
            contextIds = uniq(items.map(item => item.context))
        } else {
            if (!itemId) return false
            const item = await getById(listKey, itemId)
            contextIds = [item.context]
        }
    }

    // STEP 2: Obtain all contexts and check their deletion status
    const contexts = await find('BillingIntegrationOrganizationContext', {
        id_in: contextIds,
        deletedAt: null,
    })
    if (contexts.length !== contextIds.length) return false
    const integrationIds = uniq(contexts.map(context => context.integration))

    // STEP 3: Check billing integration access rights
    return await checkBillingIntegrationsAccessRights(user.id, integrationIds)
}

module.exports = {
    checkBillingIntegrationsAccessRights,
    checkB2BAccessRightsToBillingContext,
    canReadBillingEntity,
    canManageBillingEntityWithContext,
    getValidBillingContextForReceiptsPublish,
}


