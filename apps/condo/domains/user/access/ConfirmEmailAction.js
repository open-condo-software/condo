/**
 * Generated by `createschema user.ConfirmEmailAction 'email:Text;token:Text;secretCode:Text;secretCodeRequestedAt:DateTimeUtc;secretCodeExpiresAt:DateTimeUtc;retries:Integer;isEmailVerified:Checkbox;requestedAt:DateTimeUtc;expiresAt:DateTimeUtc;completedAt:DateTimeUtc;'`
 */

const { throwAuthenticationError } = require('@open-condo/keystone/apolloErrorFormatter')

async function canReadConfirmEmailActions ({ authentication: { item: user } }) {
    if (!user) return throwAuthenticationError()
    if (user.deletedAt) return false

    if (user.isAdmin) return {}

    return false
}

async function canManageConfirmEmailActions ({ authentication: { item: user } }) {
    if (!user) return throwAuthenticationError()
    if (user.deletedAt) return false
    if (user.isAdmin) return true

    return false
}

/*
  Rules are logical functions that used for list access, and may return a boolean (meaning
  all or no items are available) or a set of filters that limit the available items.
*/
module.exports = {
    canReadConfirmEmailActions,
    canManageConfirmEmailActions,
}
