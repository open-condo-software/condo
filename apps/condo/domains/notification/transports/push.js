const get = require('lodash/get')
const isEmpty = require('lodash/isEmpty')
const pick = require('lodash/pick')

const conf = require('@open-condo/config')
const { getLogger } = require('@open-condo/keystone/logging')
const { find, getSchemaCtx } = require('@open-condo/keystone/schema')

const { AppleAdapter } = require('@condo/domains/notification/adapters/appleAdapter')
const { FirebaseAdapter } = require('@condo/domains/notification/adapters/firebaseAdapter')
const HCMAdapter = require('@condo/domains/notification/adapters/hcmAdapter')
const { OneSignalAdapter } = require('@condo/domains/notification/adapters/oneSignalAdapter')
const { RedStoreAdapter } = require('@condo/domains/notification/adapters/redStoreAdapter')
const { WebhookAdapter } = require('@condo/domains/notification/adapters/webhookAdapter')
const {
    PUSH_TRANSPORT,
    PUSH_TRANSPORT_TYPES,
    PUSH_TRANSPORT_FIREBASE,
    PUSH_TRANSPORT_APPLE,
    PUSH_TRANSPORT_HUAWEI,
    PUSH_TRANSPORT_REDSTORE,
    PUSH_TRANSPORT_WEBHOOK,
    PUSH_TRANSPORT_ONESIGNAL,
    TICKET_CREATED_TYPE,
    TICKET_COMMENT_CREATED_TYPE,
    PASS_TICKET_CREATED_MESSAGE_TYPE,
    PASS_TICKET_COMMENT_CREATED_MESSAGE_TYPE,
} = require('@condo/domains/notification/constants/constants')
const { renderTemplate } = require('@condo/domains/notification/templates')
const { RemoteClient } = require('@condo/domains/notification/utils/serverSchema')
const { getPreferredPushTypeByMessageType } = require('@condo/domains/notification/utils/serverSchema/helpers')
const { encryptPushData } = require('@condo/domains/notification/utils/serverSchema/push/encryption')
const { getTokens } = require('@condo/domains/notification/utils/serverSchema/push/helpers')
const logger = getLogger()

/**
 * @typedef PushAdapterSettings
 * @type {{
 *     encryption?: Record<string, string> // - appId to encryptionVersion
 * }}
 */

/** @type {PushAdapterSettings} */
const PUSH_ADAPTER_SETTINGS = JSON.parse(conf.PUSH_ADAPTER_SETTINGS || '{}')

const TEMPORARY_DISABLED_TYPES_FOR_PUSH_NOTIFICATIONS = [
    TICKET_CREATED_TYPE,
    TICKET_COMMENT_CREATED_TYPE,
    PASS_TICKET_CREATED_MESSAGE_TYPE,
    PASS_TICKET_COMMENT_CREATED_MESSAGE_TYPE,
]

const ADAPTERS = {
    [PUSH_TRANSPORT_FIREBASE]: new FirebaseAdapter(),
    [PUSH_TRANSPORT_REDSTORE]: new RedStoreAdapter(),
    [PUSH_TRANSPORT_HUAWEI]: new HCMAdapter(),
    [PUSH_TRANSPORT_APPLE]: new AppleAdapter(),
    [PUSH_TRANSPORT_WEBHOOK]: new WebhookAdapter(),
    [PUSH_TRANSPORT_ONESIGNAL]: new OneSignalAdapter(),
}

/**
 * Renders message body using corresponding template
 * @param message
 * @returns {Promise<Object>}
 */
async function prepareMessageToSend (message) {
    const { user, remoteClient } = message
    const { notification, data } = await renderTemplate(PUSH_TRANSPORT, message)

    return {
        notification,
        data,
        user: pick(user, ['id']),
        remoteClient,
    }
}

/**
 * Mixes results from different push adapter to single result container
 * @param container
 * @param result
 * @returns {*}
 */
const mixResult = (container, result, transport) => {
    if (Array.isArray(result.responses)) {
        result.responses = result.responses.map(response => ({ ...response, transport }))
    }
    
    if (isEmpty(container)) return result

    container.successCount += result.successCount
    container.failureCount += result.failureCount
    container.responses = container.responses.concat(result.responses)

    return container
}

async function deleteRemoteClientsIfTokenIsInvalid ({ adapter, result, isVoIP }) {
    if (adapter === PUSH_TRANSPORT_FIREBASE) {
        // handling expired token error. https://firebase.google.com/docs/cloud-messaging/manage-tokens?hl=ru#detect-invalid-token-responses-from-the-fcm-backend
        if (get(result, 'responses')) {
            for (const res of result.responses) {
                const context = getSchemaCtx('RemoteClient')
                if (get(res, 'error.code') === 'messaging/registration-token-not-registered') {
                    const field = isVoIP ? 'pushTokenVoIP' : 'pushToken'
                    const [remoteClient] = await find('RemoteClient', {
                        [field]: res.pushToken,
                        deletedAt: null,
                    })

                    if (get(remoteClient, 'id')) {
                        await RemoteClient.update(context, get(remoteClient, 'id'), {
                            [field]: null,
                            dv: 1,
                            sender: { dv: 1, fingerprint: 'internal-update_token-not-registered' },
                        })
                        logger.info({ msg: 'remove expired FCM token', data: { remoteClientId: remoteClient.id, field } })
                    }
                }
            }
        }
    }
    // TODO: handle invalid / expired tokens for apple and others
}

function prepareDataByToken ({ adapter, tokens, data, appIds }) {
    /** @type {Record<string, { success: boolean, encryptedData?: Record<string, unknown> | null }>} */
    const encryptedDataByAppId = {}
    const dataByToken = {}
    for (const token of tokens) {
        const dataForToken = adapter.constructor.prepareData(data, token)
        const appId = appIds[token]
        const encryptionVersion = PUSH_ADAPTER_SETTINGS.encryption?.[appId]
        if (!encryptionVersion) {
            dataByToken[token] = dataForToken
        }
        const encryptedData = encryptPushData(encryptionVersion, dataForToken, { appId })
        if (encryptedData) {
            encryptedDataByAppId[appId] = { success: true, encryptedData }
            dataByToken[token] = encryptedData
        } else {
            encryptedDataByAppId[appId] = { success: false }
        }
    }
    return { dataByToken, encryptedDataByAppId }
}

/**
 * Send notification using corresponding transports (depending on FireBase/Huawei/Apple, appId, isVoIP)
 * @param notification
 * @param data
 * @param user
 * @param remoteClient
 * @param isVoIP
 * @returns {Promise<[boolean, {error: string}]|(boolean|{})[]>}
 */
async function send ({ notification, data, user, remoteClient } = {}, isVoIP = false) {
    const userId = get(user, 'id')
    const remoteClientId = get(remoteClient, 'id')
    const { tokensByTransport, pushTypes: initialPushTypes, appIds, metaByToken, count } = await getTokens(userId, remoteClientId, isVoIP)


    // NOTE: For some message types with push transport, you need to override the push type for all push tokens.
    // If the message has a preferred push type, it takes priority over the value from the remote client.
    const preferredPushTypeForMessage = getPreferredPushTypeByMessageType(get(data, 'type'))
    const pushTypes = Object.fromEntries(
        Object.entries(initialPushTypes).map(([key, value]) =>
            preferredPushTypeForMessage ? [key, preferredPushTypeForMessage] : [key, value]
        )
    )

    const encryptedDataByAppId = {}
    let container = {}
    let _isOk = false

    if (TEMPORARY_DISABLED_TYPES_FOR_PUSH_NOTIFICATIONS.includes(get(data, 'type'))) {
        return [false, { error: 'Disabled type for push transport' }]
    }
    if (!count) return [false, { error: 'No pushTokens available.' }]

    const promises = await Promise.allSettled(Object.keys(tokensByTransport).map(async transport => {
        let tokens = tokensByTransport[transport]
        if (isEmpty(tokens)) return null
        const adapter = ADAPTERS[transport]
        // NOTE(YEgorLu): Class.staticMethod() === new Class().constructor.staticMethod()
        const { dataByToken, encryptedDataByAppId: encryptedDataByAppIdForCurrenyTransport } = prepareDataByToken({ adapter, tokens, data, appIds })
        Object.keys(encryptedDataByAppIdForCurrenyTransport).forEach((appId) => encryptedDataByAppId[appId] = encryptedDataByAppIdForCurrenyTransport[appId])
        const tokensWithNoData = tokens.filter(token => !dataByToken[token])
        tokensWithNoData.forEach(tokenWithNoData => {
            [appIds, pushTypes, metaByToken].forEach(mapByToken => delete mapByToken[tokenWithNoData])
        })
        tokens = tokens.filter(token => !!dataByToken[token]) // if encryption failed, do not send it

        if (tokens.length === 0) {
            return [false, { successCount: 0, failureCount: tokensWithNoData.length, responses: [] }, transport]
        }

        const payload = { tokens, pushTypes, appIds, notification, dataByToken, metaByToken }
        const [isOk, result] = await adapter.sendNotification(payload, isVoIP)

        await deleteRemoteClientsIfTokenIsInvalid({ adapter, result, isVoIP })

        /** @type {[boolean, object, string]} */
        const sendNotificationResult = [isOk, result, transport]
        return sendNotificationResult
    }))

    logger.info({ msg: 'encrypted data', entity: 'Message', entityId: data.notificationId, data: { encryptedDataByAppId } })

    for (const p of promises) {
        if (p.status !== 'fulfilled') continue

        const value = p.value
        if (value === null) continue

        const [isOk, result, transport] = value
        container = mixResult(container, result, transport)
        _isOk = _isOk || isOk
    }

    return [_isOk, container]
}

module.exports = {
    prepareMessageToSend,
    send,

    // for tests
    prepareDataByToken,
}
