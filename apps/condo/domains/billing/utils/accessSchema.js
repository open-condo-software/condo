const { get, uniq, isArray, isEmpty } = require('lodash')

const { throwAuthenticationError } = require('@open-condo/keystone/apolloErrorFormatter')
const { getById, find } = require('@open-condo/keystone/schema')

const { CONTEXT_FINISHED_STATUS } = require('@condo/domains/billing/constants/constants')
const { canExecuteServiceAsB2BAppServiceUser } = require('@condo/domains/miniapp/utils/b2bAppServiceUserAccess/server.utils')
const { SERVICE } = require('@condo/domains/user/constants/common')


/**
 * Checks whether a user has access rights to all specified billing integrations.
 *
 * @param {string} userId - The ID of the user whose access rights are being checked.
 * @param {string[]} integrationIds - An array of billing integration IDs to verify access for.
 * @returns {Promise<boolean>} Resolves to `true` if the user has access to all given integrations; otherwise, `false`.
 */
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

/**
 * Retrieves a billing integration organization context by ID if it is finished and not deleted.
 *
 * @param {string} contextId - The ID of the billing integration organization context.
 * @returns {Promise<Object|undefined>} The matching context object if found; otherwise, undefined.
 */
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

/**
 * Determines if a B2B app service user has access rights to perform an action on a billing integration context.
 *
 * If the associated billing integration is marked as a B2B app, checks access using the organization from the context; otherwise, returns {@code false}.
 *
 * @param {object} args - Arguments required for access validation.
 * @param {object} context - The billing integration context, including integration and organization identifiers.
 * @returns {Promise<boolean>} {@code true} if the user has access rights; otherwise, {@code false}.
 */
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


