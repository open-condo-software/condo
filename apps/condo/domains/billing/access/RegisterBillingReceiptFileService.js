const { throwAuthenticationError } = require('@open-condo/keystone/apolloErrorFormatter')

const { SERVICE } = require('@condo/domains/user/constants/common')

async function canRegisterBillingReceiptFile ({ authentication: { item: user }, args: { data: { context: { id: contextId } } } } ) {
    if (!user) return throwAuthenticationError()
    if (user.deletedAt) return false
    if (user.isAdmin) return true

    return user.type === SERVICE
}

/*
  Rules are logical functions that used for list access, and may return a boolean (meaning
  all or no items are available) or a set of filters that limit the available items.
*/
module.exports = {
    canRegisterBillingReceiptFile,
}