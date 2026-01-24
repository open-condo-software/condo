const get = require('lodash/get')
const isEmpty = require('lodash/isEmpty')
const pick = require('lodash/pick')

const { getLogger } = require('@open-condo/keystone/logging')
const { find, getSchemaCtx } = require('@open-condo/keystone/schema')

const { AppleAdapter } = require('@condo/domains/notification/adapters/appleAdapter')
const { FirebaseAdapter } = require('@condo/domains/notification/adapters/firebaseAdapter')
const HCMAdapter = require('@condo/domains/notification/adapters/hcmAdapter')
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
    TICKET_CREATED_TYPE,
    TICKET_COMMENT_CREATED_TYPE,
    PASS_TICKET_CREATED_MESSAGE_TYPE,
    PASS_TICKET_COMMENT_CREATED_MESSAGE_TYPE,
} = require('@condo/domains/notification/constants/constants')
const { renderTemplate } = require('@condo/domains/notification/templates')
const { RemoteClient } = require('@condo/domains/notification/utils/serverSchema')
const { getPreferredPushTypeByMessageType } = require('@condo/domains/notification/utils/serverSchema/helpers')

const logger = getLogger()

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
}

/**
 * Prepares conditions
 * @param ownerId
 * @param remoteClientId
 * @param isVoIP
 * @returns {{deletedAt: null, pushToken_not?: null, pushTransport_in?: [string, string, string]}|{deletedAt: null, pushTokenVoIP_not?: null, pushTransportVoIP_in?: [string, string, string]}}
 */
function getTokensConditions (ownerId, remoteClientId, isVoIP) {
    const conditions = {
        deletedAt: null,
    }

    if (ownerId) conditions.owner = { id: ownerId }
    if (remoteClientId) conditions.id_in = [remoteClientId]

    if (isVoIP) {
        conditions.pushTokenVoIP_not = null
        conditions.pushTransportVoIP_in = PUSH_TRANSPORT_TYPES
    } else {
        conditions.pushToken_not =  null
        conditions.pushTransport_in = PUSH_TRANSPORT_TYPES
    }

    return conditions
}

/**
 * Request push tokens for user. Able to detect FireBase/Huawei and different appId versions. isVoIP flag is used to substitute VoIP pushToken, pushType and pushTransport fields.
 * @param ownerId
 * @param remoteClientId
 * @param isVoIP
 * @returns {Promise<{tokensByTransport: {[p: string]: [], '[PUSH_TRANSPORT_HUAWEI]': *[], '[PUSH_TRANSPORT_APPLE]': *[], '[PUSH_TRANSPORT_FIREBASE]': *[]}, appIds: {}, pushTypes: {}, count}|*[]>}
 */
async function getTokens (ownerId, remoteClientId, isVoIP = false) {
    if (!ownerId && !remoteClientId) return []

    const conditions = getTokensConditions(ownerId, remoteClientId, isVoIP)
    const remoteClients =  await find('RemoteClient', conditions)
    const tokensByTransport = {
        [PUSH_TRANSPORT_FIREBASE]: [],
        [PUSH_TRANSPORT_REDSTORE]: [],
        [PUSH_TRANSPORT_HUAWEI]: [],
        [PUSH_TRANSPORT_APPLE]: [],
        [PUSH_TRANSPORT_WEBHOOK]: [],
    }
    const pushTypes = {}
    const appIds = {}

    if (!isEmpty(remoteClients)) {
        remoteClients.forEach((remoteClient) => {
            const {
                appId, pushToken, pushType, pushTransport,
                pushTokenVoIP, pushTypeVoIP, pushTransportVoIP,
            } = remoteClient
            const transport = isVoIP ? pushTransportVoIP : pushTransport
            const token = isVoIP ? pushTokenVoIP : pushToken
            const type = isVoIP ? pushTypeVoIP : pushType

            tokensByTransport[transport].push(token)
            pushTypes[token] = type
            appIds[token] = appId
        })
    }

    return { tokensByTransport, pushTypes, appIds, count: remoteClients.length }
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
    const { tokensByTransport, pushTypes: initialPushTypes, appIds, count } = await getTokens(userId, remoteClientId, isVoIP)


    // NOTE: For some message types with push transport, you need to override the push type for all push tokens.
    // If the message has a preferred push type, it takes priority over the value from the remote client.
    const preferredPushTypeForMessage = getPreferredPushTypeByMessageType(get(data, 'type'))
    const pushTypes = Object.fromEntries(
        Object.entries(initialPushTypes).map(([key, value]) =>
            preferredPushTypeForMessage ? [key, preferredPushTypeForMessage] : [key, value]
        )
    )

    let container = {}
    let _isOk = false

    if (TEMPORARY_DISABLED_TYPES_FOR_PUSH_NOTIFICATIONS.includes(get(data, 'type'))) {
        return [false, { error: 'Disabled type for push transport' }]
    }
    if (!count) return [false, { error: 'No pushTokens available.' }]

    const promises = await Promise.allSettled(Object.keys(tokensByTransport).map(async transport => {
        const tokens = tokensByTransport[transport]
        if (isEmpty(tokens)) return null

        const adapter = ADAPTERS[transport]
        const payload = { tokens, pushTypes, appIds, notification, data }
        const [isOk, result] = await adapter.sendNotification(payload, isVoIP)

        await deleteRemoteClientsIfTokenIsInvalid({ adapter, result, isVoIP })

        /** @type {[boolean, object, string]} */
        const sendNotificationResult = [isOk, result, transport]
        return sendNotificationResult
    }))

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
}
