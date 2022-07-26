const isEmpty = require('lodash/isEmpty')

const { find } = require('@core/keystone/schema')

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
    const tokenData =  await find('RemoteClient', condition)

    if (isEmpty(tokenData)) return []

    return tokenData.map(token => token.pushToken)
}

async function prepareMessageToSend (message) {
    return await renderTemplate(PUSH_TRANSPORT, message)
}

async function send ({ notification, data } = {}) {
    const { userId } = data
    const tokens = await getTokens(userId)

    const result = await adapter.sendNotification({ tokens, notification, data })

    return result
}

module.exports = {
    prepareMessageToSend,
    send,
}
