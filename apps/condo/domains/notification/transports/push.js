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
const { getPreferredPushTypeByMessageType, chunkRemoteClientsByAppGroups } = require('@condo/domains/notification/utils/serverSchema/helpers')
const { encryptPushData } = require('@condo/domains/notification/utils/serverSchema/push/encryption')
const { getTokens } = require('@condo/domains/notification/utils/serverSchema/push/helpers')

const logger = getLogger()

const PUSH_NOTIFICATION_APP_GROUPS = JSON.parse(conf.PUSH_NOTIFICATION_APP_GROUPS ?? '{}')


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
 * @typedef TokensData
 * @type {{tokensByTransport: {[p: string]: [], '[PUSH_TRANSPORT_HUAWEI]': *[], '[PUSH_TRANSPORT_APPLE]': *[], '[PUSH_TRANSPORT_FIREBASE]': *[]}, appIds: {}, pushTypes: {}, count}|*[]}
 */

/**
 * Request push tokens for user. Able to detect FireBase/Huawei and different appId versions. isVoIP flag is used to substitute VoIP pushToken, pushType and pushTransport fields.
 * Push tokens are grouped settings (groups can be sent in parallel) and then chunked by appId in specific order according to settings (you must not send next chunks if current is successful)
 * @param ownerId
 * @param remoteClientId
 * @param isVoIP
 * @returns {Promise<{allCount: number, tokensDataByGroupsAndChunks: {[groupName: string]: TokensData[]}}>}
 */
async function getTokens (ownerId, remoteClientId, isVoIP = false) {
    if (!ownerId && !remoteClientId) return []

    const conditions = getTokensConditions(ownerId, remoteClientId, isVoIP)
    const remoteClients =  await find('RemoteClient', conditions)
    const remoteClientsGrouped = chunkRemoteClientsByAppGroups(remoteClients, PUSH_NOTIFICATION_APP_GROUPS)

    let allCount = 0
    const tokensDataByGroupsAndChunks = Object.fromEntries(
        Object.entries(remoteClientsGrouped).map(([groupName, remoteClientsChunks]) => {
            const tokensDataByChunks = remoteClientsChunks.map(remoteClientsChunk => {
                const tokensByTransport = {
                    [PUSH_TRANSPORT_FIREBASE]: [],
                    [PUSH_TRANSPORT_REDSTORE]: [],
                    [PUSH_TRANSPORT_HUAWEI]: [],
                    [PUSH_TRANSPORT_APPLE]: [],
                    [PUSH_TRANSPORT_WEBHOOK]: [],
                }
                const pushTypes = {}
                const appIds = {}
                const metaByToken = {}
                if (!isEmpty(remoteClientsChunk)) {
                    remoteClientsChunk.forEach((remoteClient) => {
                        const {
                            appId, pushToken, pushType, pushTransport,
                            pushTokenVoIP, pushTypeVoIP, pushTransportVoIP,
                            meta,
                        } = remoteClient
                        const transport = isVoIP ? pushTransportVoIP : pushTransport
                        const token = isVoIP ? pushTokenVoIP : pushToken
                        const type = isVoIP ? pushTypeVoIP : pushType

                        tokensByTransport[transport].push(token)
                        pushTypes[token] = type
                        appIds[token] = appId
                        metaByToken[token] = meta
                    })
                }

                allCount += remoteClientsChunk.length
                return { tokensByTransport, pushTypes, appIds, metaByToken, count: remoteClientsChunk.length }
            })
            return [groupName, tokensDataByChunks]
        })
    )
    return { allCount, tokensDataByGroupsAndChunks }
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
 * @param additionalResponsesData {{[s: string]: any}} fields to add to responses objects
 * @returns {*}
 */
const mixResult = (container, result, additionalResponsesData = {}) => {
    if (Array.isArray(result.responses)) {
        result.responses = result.responses.map(response => ({ ...response, ...additionalResponsesData }))
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
    const encryptionStatsInfo = {}
    const dataByToken = {}

    const tokensWhichNeedEncryption = tokens.filter(token => !!PUSH_ADAPTER_SETTINGS.encryption?.[appIds[token]])
    const tokensWhichDoNotNeedEncryption = tokens.filter(token => !PUSH_ADAPTER_SETTINGS.encryption?.[appIds[token]])

    // prepare data for simple tokens
    tokensWhichDoNotNeedEncryption.forEach(token => {
        // NOTE(YEgorLu): Class.staticMethod() === new Class().constructor.staticMethod()
        dataByToken[token] = adapter.constructor.prepareData(data, token)
    })

    // encrypt data for needed tokens if possible
    tokensWhichNeedEncryption.forEach(token => {
        const appId = appIds[token]
        const preparedDataForToken = adapter.constructor.prepareData(data, token)
        const encryptionVersion = PUSH_ADAPTER_SETTINGS.encryption[appId]
        const encryptedDataForToken = encryptPushData(encryptionVersion, preparedDataForToken, { appId })

        if (encryptedDataForToken) {
            encryptionStatsInfo[appId] = { success: true, appId: appIds[token], encryptedData: encryptedDataForToken }
            dataByToken[token] = encryptedDataForToken
        } else {
            encryptionStatsInfo[appId] = { success: false, appId: appIds[token], encryptedData: null }
        }
    })

    return { dataByToken, encryptionStatsInfo }
}

async function sendMessageToTransports ({ tokensByTransport, pushTypes, appIds, notification, data, metaByToken, isVoIP }) {
    let container = {}
    const encryptionStatsInfo = {}
    let _isOk = false

    const promises = await Promise.allSettled(Object.keys(tokensByTransport).map(async transport => {
        let tokens = tokensByTransport[transport]
        if (isEmpty(tokens)) return null
        const adapter = ADAPTERS[transport]

        const { dataByToken, encryptionStatsInfo: encryptionStatsInfoForCurrentTransport } = prepareDataByToken({ adapter, tokens, data, appIds })
        Object.keys(encryptionStatsInfoForCurrentTransport).forEach((token) => {
            encryptionStatsInfo[token] = encryptionStatsInfoForCurrentTransport[token]
        })
        const tokensWithNoData = tokens.filter(token => !dataByToken[token])
        tokens = tokens.filter(token => !!dataByToken[token]) // if encryption failed, do not send it

        const tokensWithNoDataResponses = tokensWithNoData.map(token => ({
            success: false,
            pushToken: token,
            appId: appIds[token],
            pushType: pushTypes[token],
            error: 'empty data for token',
        }))

        if (tokens.length === 0) {
            return [false, { successCount: 0, failureCount: tokensWithNoData.length, responses: tokensWithNoDataResponses }, transport]
        }

        const payload = { tokens, pushTypes, appIds, notification, dataByToken, metaByToken }
        const [isOk, result] = await adapter.sendNotification(payload, isVoIP)

        result.failureCount ??= 0
        result.failureCount += tokensWithNoData.length
        result.responses ??= []
        result.responses.push(...tokensWithNoDataResponses)

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
        container = mixResult(container, result, { transport })
        _isOk = _isOk || isOk
    }

    return { isOk: _isOk, result: container, encryptionStatsInfo }
}

async function sendMessageToAppsGroup ({ groupName, tokensChunksInGroup, isVoIP, notification, data }) {
    let container = {}
    let encryptionStatsInfo = {}
    let _isOk = false
    for (const tokensChunk of tokensChunksInGroup) {
        const { tokensByTransport, pushTypes, appIds, metaByToken } = tokensChunk
        const { isOk, result, encryptionStatsInfo: encryptionStatsInfoForChunk } = await sendMessageToTransports({
            tokensByTransport,
            metaByToken,
            appIds,
            pushTypes,
            data,
            isVoIP,
            notification,
        })
        container = mixResult(container, result, { groupName })
        encryptionStatsInfo = { ...encryptionStatsInfo, ...encryptionStatsInfoForChunk }
        // Do not proceed with next chunk (next appId) if this succeeded
        _isOk = _isOk || isOk
        if (isOk) break
    }
    return { isOk: _isOk, result: container, encryptionStatsInfo }
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
    const { tokensDataByGroupsAndChunks, allCount } = await getTokens(userId, remoteClientId, isVoIP)


    // NOTE: For some message types with push transport, you need to override the push type for all push tokens.
    // If the message has a preferred push type, it takes priority over the value from the remote client.
    const preferredPushTypeForMessage = getPreferredPushTypeByMessageType(get(data, 'type'))
    if (preferredPushTypeForMessage) {
        Object.entries(tokensDataByGroupsAndChunks).forEach(([_groupName, tokensChunks]) => {
            tokensChunks.forEach(tokensData => {
                const { pushTypes: initialPushTypes } = tokensData
                tokensData.pushTypes = Object.fromEntries(
                    Object.keys(initialPushTypes).map((key) =>
                        [key, preferredPushTypeForMessage]
                    )
                )
            })
        })
    }

    let encryptionStatsInfo = {}
    let container = {}
    let _isOk = false

    if (TEMPORARY_DISABLED_TYPES_FOR_PUSH_NOTIFICATIONS.includes(get(data, 'type'))) {
        return [false, { error: 'Disabled type for push transport' }]
    }
    if (!allCount) return [false, { error: 'No pushTokens available.' }]

    const promises = await Promise.allSettled(Object.entries(tokensDataByGroupsAndChunks).map(async ([groupName, tokensChunks]) => {
        return await sendMessageToAppsGroup({
            groupName,
            tokensChunksInGroup: tokensChunks,
            isVoIP,
            notification,
            data,
        })
    }))

    logger.info({ msg: 'encryptionStatsInfo', entity: 'Message', entityId: data.notificationId, data: { encryptionStatsInfo } })

    for (const p of promises) {
        if (p.status !== 'fulfilled') continue

        const value = p.value
        if (typeof value !== 'object' || !value) continue

        const { isOk, result, encryptionStatsInfo: encryptionStatsInfoForGroup } = value
        container = mixResult(container, result)
        encryptionStatsInfo = { ...encryptionStatsInfo, ...encryptionStatsInfoForGroup }
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
