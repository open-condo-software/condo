const get = require('lodash/get')
const pick = require('lodash/pick')

const { WebhookAdapter } = require('@condo/domains/notification/adapters/webhookAdapter')
const { WEBHOOK_TRANSPORT } = require('@condo/domains/notification/constants/constants')
const { renderTemplate } = require('@condo/domains/notification/templates')
const { getTokens } = require('@condo/domains/notification/utils/serverSchema/push/helpers')

const Adapter = new WebhookAdapter()

async function prepareMessageToSend (message) {
    const { user, remoteClient } = message
    const { id: notificationId, type, createdAt } = message

    const originalNotification = await renderTemplate(WEBHOOK_TRANSPORT, message)

    return {
        message,
        notification: originalNotification,
        data: { ...get(message, ['meta', 'data'], {}), notificationId, type, messageCreatedAt: createdAt },
        user: pick(user, ['id']),
        remoteClient,
    }
}

/**
 * Send a Region Messenger notification via webhook
 * @param notification
 * @param message
 * @param data
 * @param user
 * @param remoteClient
 * @returns {Promise<[boolean, {error: string}]|(boolean|{})[]>}
 */
async function send ({ notification, message, data, user, remoteClient } = {}) {
    const userId = get(user, 'id')
    const remoteClientId = get(remoteClient, 'id')

    const regionMessengerTokens = await getTokens(userId, remoteClientId)

    if (!regionMessengerTokens.length) {
        return [false, { error: 'No region messenger tokens available.' }]
    }

    const tokens = []
    const notificationByToken = {}
    const dataByToken = {}
    const pushTypes = {}
    const appIds = {}
    const metaByToken = {}

    for (const tokenData of regionMessengerTokens) {
        tokens.push(tokenData.token)
        notificationByToken[tokenData.token] = notification
        dataByToken[tokenData.token] = data
        pushTypes[tokenData.token] = 'default'
        appIds[tokenData.token] = tokenData.appId
        metaByToken[tokenData.token] = tokenData.remoteClientMeta
    }

    const [isOk, result] = await Adapter.sendNotification({
        notificationByToken,
        dataByToken,
        tokens,
        pushTypes,
        appIds,
    })

    return [isOk, result]
}

module.exports = {
    prepareMessageToSend,
    send,
}