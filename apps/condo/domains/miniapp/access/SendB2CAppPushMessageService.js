const get = require('lodash/get')

const { throwAuthenticationError } = require('@open-condo/keystone/apolloErrorFormatter')

async function canSendB2CAppPushMessage ({ args: { data }, authentication: { item: user } }) {
    if (!user) return throwAuthenticationError()
    if (user.deletedAt) return false
    if (user.isAdmin || user.isSupport) return true


    //TODO(Kekmus) need to check app access here
    // Sending pushes to an application requires user token for the application. This means that only the user can send a push to himself. Or a miniapp that received his token the moment he opened the app.
    if (get(data, 'user.id')  === user.id) return true

    return false
}

module.exports = {
    canSendB2CAppPushMessage,
}