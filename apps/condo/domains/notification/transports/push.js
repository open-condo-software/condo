const { get, isEmpty } = require('lodash')

const { find } = require('@open-condo/keystone/schema')

const { AppleAdapter } = require('@condo/domains/notification/adapters/appleAdapter')
const { FirebaseAdapter } = require('@condo/domains/notification/adapters/firebaseAdapter')
const HCMAdapter = require('@condo/domains/notification/adapters/hcmAdapter')
const {
    PUSH_TRANSPORT,
    PUSH_TRANSPORT_TYPES,
    PUSH_TRANSPORT_FIREBASE,
    PUSH_TRANSPORT_APPLE,
    PUSH_TRANSPORT_HUAWEI,
} = require('@condo/domains/notification/constants/constants')
const { renderTemplate } = require('@condo/domains/notification/templates')

const ADAPTERS = {
    [PUSH_TRANSPORT_FIREBASE]: new FirebaseAdapter(),
    [PUSH_TRANSPORT_HUAWEI]: new HCMAdapter(),
    [PUSH_TRANSPORT_APPLE]: new AppleAdapter(),
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
        [PUSH_TRANSPORT_HUAWEI]: [],
        [PUSH_TRANSPORT_APPLE]: [],
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

    return { notification, data, user, remoteClient }
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
    const { tokensByTransport, pushTypes, appIds, count } = await getTokens(userId, remoteClientId, isVoIP)

    let container = {}
    let _isOk = false

    if (!count) return [false, { error: 'No pushTokens available.' }]

    for (const transport in tokensByTransport) {
        const tokens = tokensByTransport[transport]

        if (!isEmpty(tokens)) {
            const adapter = ADAPTERS[transport]
            const payload = { tokens, pushTypes, appIds, notification, data }
            const [isOk, result] = await adapter.sendNotification(payload, isVoIP)

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
