const isEmpty = require('lodash/isEmpty')

const { find } = require('@open-condo/keystone/schema')

const { PUSH_TRANSPORT_FIREBASE } = require('@condo/domains/notification/constants/constants')
const { FirebaseAdapter } = require('@condo/domains/notification/adapters/firebaseAdapter')

const { PUSH_TRANSPORT } = require('../constants/constants')
const { renderTemplate } = require('../templates')

const adapter = new FirebaseAdapter()

async function getTokens (userId) {
    if (!userId) return []

    const condition = {
        owner: { id: userId },
        deletedAt: null,
        pushToken_not: null,
        pushTransport: PUSH_TRANSPORT_FIREBASE,
    }
    const remoteClients =  await find('RemoteClient', condition)
    const tokens = []
    const pushTypes = {}

    if (!isEmpty(remoteClients)) {
        remoteClients.forEach(({ pushToken, pushType }) => {
            tokens.push(pushToken)
            pushTypes[pushToken] = pushType
        })
    }

    return { tokens, pushTypes }
}

async function prepareMessageToSend (message) {
    return await renderTemplate(PUSH_TRANSPORT, message)
}

async function send ({ notification, data } = {}) {
    const { userId } = data
    const { tokens, pushTypes } = await getTokens(userId)

    return await adapter.sendNotification({ tokens, pushTypes, notification, data })
}

module.exports = {
    prepareMessageToSend,
    send,
}
