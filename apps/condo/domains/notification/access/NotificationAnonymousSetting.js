// @ts-nocheck
/**
 * Generated by `createschema notification.NotificationAnonymousSetting 'email:Text; phone:Text; messageType:Text; messageTransport:Text; isEnabled:Checkbox'`
 */

const { throwAuthenticationError } = require('@open-condo/keystone/apolloErrorFormatter')

async function canReadNotificationAnonymousSettings ({ authentication: { item: user } }) {
    if (!user) return throwAuthenticationError()
    if (user.deletedAt) return false

    if (user.isAdmin || user.isSupport) return true

    return false
}

async function canManageNotificationAnonymousSettings ({ authentication: { item: user }, originalInput, operation, itemId }) {
    if (!user) return throwAuthenticationError()
    if (user.deletedAt) return false
    if (user.isAdmin || user.isSupport) return true

    return false
}

/*
  Rules are logical functions that used for list access, and may return a boolean (meaning
  all or no items are available) or a set of filters that limit the available items.
*/
module.exports = {
    canReadNotificationAnonymousSettings,
    canManageNotificationAnonymousSettings,
}