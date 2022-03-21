const isEmpty = require('lodash/isEmpty')

const { find } = require('@core/keystone/schema')

const { PUSH_TRANSPORT_FIREBASE } = require('@condo/domains/notification/constants/constants')
const { FirebaseAdapter } = require('@condo/domains/notification/adapters/firebaseAdapter')

const { renderTemplate } = require('../templates')
const { PUSH_TRANSPORT } = require('../constants/constants')

const adapter = new FirebaseAdapter()

async function getTokens (userId) {
    const condition = {
        owner: { id: userId },
        deletedAt: null,
        pushToken_not: null,
        pushTransport: PUSH_TRANSPORT_FIREBASE,
    }
    const tokenData =  await find('Device', condition)

    if (isEmpty(tokenData)) return []

    return tokenData.map(token => token.pushToken)
}

async function prepareMessageToSend (message) {
    return await renderTemplate(PUSH_TRANSPORT, message)
}

async function send ({ userId, notification, data, notificationId } = {}) {
    const tokens = await getTokens(userId)

    console.log('push send:', { userId, notification, data, tokens })

    const result = await adapter.sendNotification({ tokens, notification, data })

    console.log('push send result:', result)

    return result
}

module.exports = {
    prepareMessageToSend,
    send,
}

