const { throwAuthenticationError } = require('@open-condo/keystone/apolloErrorFormatter')
const { getById } = require('@open-condo/keystone/schema')

const { checkBillingIntegrationsAccessRights, checkB2BAccessRightsToBillingContext, getValidBillingContextForReceiptsPublish } = require('@condo/domains/billing/utils/accessSchema')
const { SERVICE } = require('@condo/domains/user/constants/common')

/**
 * Determines whether a user is permitted to register a billing receipt file for a given billing context.
 *
 * Returns `true` if the user is an admin, or a service user with appropriate billing integration or B2B access rights; returns `false` for deleted users, invalid contexts, or insufficient permissions.
 *
 * @param {object} args - The access control arguments containing authentication and billing context information.
 * @returns {Promise<boolean>} Resolves to `true` if the user has permission to register a billing receipt file, otherwise `false`.
 *
 * @throws {AuthenticationError} If the user is not authenticated.
 */
async function canRegisterBillingReceiptFile (args) {
    const { authentication: { item: user }, args: { data: { context: { id: contextId } } } }  = args
    if (!user) return throwAuthenticationError()
    if (user.deletedAt) return false

    const context = await getValidBillingContextForReceiptsPublish(contextId)
    if (!context) {
        return false
    }
    if (user.isAdmin) return true

    if (user.type === SERVICE) {
        const hasBillingAccess = await checkBillingIntegrationsAccessRights(user.id, [context.integration])
        if (hasBillingAccess) {
            return true
        }
        const hasB2BAccess = await checkB2BAccessRightsToBillingContext(args, context)
        if (hasB2BAccess) {
            return true
        }
    }

    return false
}

/*
  Rules are logical functions that used for list access, and may return a boolean (meaning
  all or no items are available) or a set of filters that limit the available items.
*/
module.exports = {
    canRegisterBillingReceiptFile,
}