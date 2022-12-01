const isEmpty = require('lodash/isEmpty')

const { find } = require('@open-condo/keystone/schema')

const {
    PUSH_TRANSPORT,
    PUSH_TRANSPORT_TYPES,
    PUSH_TRANSPORT_FIREBASE,
    PUSH_TRANSPORT_APPLE,
    PUSH_TRANSPORT_HUAWEI,
} = require('@condo/domains/notification/constants/constants')
const { FirebaseAdapter } = require('@condo/domains/notification/adapters/firebaseAdapter')
const HCMAdapter = require('@condo/domains/notification/adapters/hcmAdapter')
const { renderTemplate } = require('@condo/domains/notification/templates')

const ADAPTERS = {
    [PUSH_TRANSPORT_FIREBASE]: new FirebaseAdapter(),
    [PUSH_TRANSPORT_HUAWEI]: new HCMAdapter(),
    [PUSH_TRANSPORT_APPLE]: new FirebaseAdapter(),
}

/**
 * Request push tokens for user. Able to detect FireBase/Huawei and different appId versions.
 * @param userId
 * @returns {tokensByTransport: {[p: string]: [], '[PUSH_TRANSPORT_HUAWEI]': *[], '[PUSH_TRANSPORT_FIREBASE]': *[]}, appIds: {}, pushTypes: {}}
 */
async function getTokens (userId) {
    if (!userId) return []

    const condition = {
        owner: { id: userId },
        deletedAt: null,
        pushToken_not: null,
        pushTransport_in: PUSH_TRANSPORT_TYPES,
    }
    const remoteClients =  await find('RemoteClient', condition)
    const tokensByTransport = {
        [PUSH_TRANSPORT_FIREBASE]: [],
        [PUSH_TRANSPORT_HUAWEI]: [],
        [PUSH_TRANSPORT_APPLE]: [],
    }
    const pushTypes = {}
    const appIds = {}

    if (!isEmpty(remoteClients)) {
        remoteClients.forEach(({ pushToken, pushType, pushTransport, appId }) => {
            tokensByTransport[pushTransport].push(pushToken)
            pushTypes[pushToken] = pushType
            appIds[pushToken] = appId
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
    return await renderTemplate(PUSH_TRANSPORT, message)
}

/**
 * Mixes results from different push adapter to single result container
 * @param container
 * @param result
 * @returns {*}
 */
const mixResult = (container, result) => {
    if (isEmpty(container)) return result

    container.successCount += result.successCount
    container.failureCount += result.failureCount
    container.responses = container.responses.concat(result.responses)

    return container
}

/**
 * Send notification using corresponding transports (depending on FireBase/Huawei and appId)
 * @param notification
 * @param data
 * @returns {Promise<*[]>}
 */
async function send ({ notification, data } = {}) {
    const { userId } = data
    const { tokensByTransport, pushTypes, appIds, count } = await getTokens(userId)
    let container = {}
    let _isOk = false

    if (!count) return [false, { error: 'No pushTokens available.' }]

    for (const transport in tokensByTransport) {
        const tokens = tokensByTransport[transport]

        if (!isEmpty(tokens)) {
            const adapter = ADAPTERS[transport]
            const payload = { tokens, pushTypes, appIds, notification, data }
            const [isOk, result] = await adapter.sendNotification(payload)

            container = mixResult(container, result)
            _isOk = _isOk || isOk
        }
    }

    return [_isOk, container]
}

module.exports = {
    prepareMessageToSend,
    send,
}
