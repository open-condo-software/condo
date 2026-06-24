const get = require('lodash/get')
const pick = require('lodash/pick')

const conf = require('@open-condo/config')

const { WebhookAdapter } = require('@condo/domains/notification/adapters/webhookAdapter')
const { WEBHOOK_TRANSPORT, WEBHOOK_CONFIG_ENV } = require('@condo/domains/notification/constants/constants')
const { renderTemplate } = require('@condo/domains/notification/templates')
const { getTokens } = require('@condo/domains/notification/utils/serverSchema/push/helpers')

const WEBHOOK_CONFIG = conf[WEBHOOK_CONFIG_ENV] ? JSON.parse(conf[WEBHOOK_CONFIG_ENV]) : null
const Adapter = new WebhookAdapter()

function getRenderFormatForMessage (appId, messageType) {
    if (!WEBHOOK_CONFIG || !WEBHOOK_CONFIG[appId]) return 'html'

    const configForApp = WEBHOOK_CONFIG[appId]
    const webhookConfig = configForApp.urls?.find(urlConfig =>
        urlConfig.messageTypes?.includes(messageType)
    )

    return webhookConfig?.renderFormat || 'html'
}

async function prepareMessageToSend (message) {
    const { user, remoteClient, type: messageType } = message
    const { id: notificationId, createdAt } = message
    const userId = get(user, 'id')
    const remoteClientId = get(remoteClient, 'id')

    const pushTokens = await getTokens(userId, remoteClientId)

    const notificationByToken = {}

    for (const tokenData of pushTokens) {
        const renderFormat = getRenderFormatForMessage(tokenData.appId, messageType)
        const notification = await renderTemplate(WEBHOOK_TRANSPORT, message, { renderFormat })
        notificationByToken[tokenData.token] = notification
    }

    return {
        message,
        notificationByToken,
        data: { ...get(message, ['meta', 'data'], {}), notificationId, type: messageType, messageCreatedAt: createdAt },
        user: pick(user, ['id']),
        remoteClient,
        pushTokens,
    }
}

async function send ({ notificationByToken, data, pushTokens } = {}) {
    if (!pushTokens || !pushTokens.length) {
        return [false, { error: 'No tokens available.' }]
    }

    const tokens = []
    const dataByToken = {}
    const pushTypes = {}
    const appIds = {}
    const metaByToken = {}

    for (const tokenData of pushTokens) {
        tokens.push(tokenData.token)
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