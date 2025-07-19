const { throwAuthenticationError } = require('@open-condo/keystone/apolloErrorFormatter')
const { getById } = require('@open-condo/keystone/schema')

const { checkBillingIntegrationsAccessRights, checkB2BAccessRightsToBillingContext, getValidBillingContextForReceiptsPublish } = require('@condo/domains/billing/utils/accessSchema')
const { SERVICE } = require('@condo/domains/user/constants/common')

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