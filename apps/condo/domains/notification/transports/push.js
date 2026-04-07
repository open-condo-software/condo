const get = require('lodash/get')
const isEmpty = require('lodash/isEmpty')
const pick = require('lodash/pick')

const conf = require('@open-condo/config')
const { getLogger } = require('@open-condo/keystone/logging')
const { find, getSchemaCtx } = require('@open-condo/keystone/schema')

const { AppleAdapter } = require('@condo/domains/notification/adapters/appleAdapter')
const { FirebaseAdapter } = require('@condo/domains/notification/adapters/firebaseAdapter')
const { HCMAdapter } = require('@condo/domains/notification/adapters/hcmAdapter')
const { OneSignalAdapter } = require('@condo/domains/notification/adapters/oneSignalAdapter')
const { RedStoreAdapter } = require('@condo/domains/notification/adapters/redStoreAdapter')
const { WebhookAdapter } = require('@condo/domains/notification/adapters/webhookAdapter')
const {
    PUSH_TRANSPORT,
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
const { RemoteClient, RemoteClientPushToken } = require('@condo/domains/notification/utils/serverSchema')
const { getPreferredPushTypeByMessageType } = require('@condo/domains/notification/utils/serverSchema/helpers')
const { encryptPushData } = require('@condo/domains/notification/utils/serverSchema/push/encryption')
const { getTokens, groupIntoParallelGroupsWithSequentialBatches } = require('@condo/domains/notification/utils/serverSchema/push/helpers')

const logger = getLogger()


/**
 * @typedef PushAdapterSettings
 * @property {Record<string, string> | undefined} encryption - appId to encryptionVersion
 * @property {Record<string, string[]> | undefined} groups - groupName to ordered appIds in group
 * @property {Record<string, string[] | undefined>} transportPriorityByAppId - appId to transports array, if appId needs to be restricted to use specific transports
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
    const { id: notificationId, type, createdAt } = message

    const originalNotification = await renderTemplate(PUSH_TRANSPORT, message)

    return {
        message,
        /** "original notification", using only in processing meta, will be changed for each RemoteClient */
        notification: originalNotification,
        /** "original data", may change for each RemoteClient */
        data: { ...get(message, ['meta', 'data'], {}), notificationId, type, messageCreatedAt: createdAt },
        user: pick(user, ['id']),
        remoteClient,
    }
}

async function prepareNotificationsByAppId ({ message, appIds }) {
    const uniqAppIds = [...appIds]
    const notificationsByAppIdPromises = uniqAppIds.map(async appId => {
        return await renderTemplate(PUSH_TRANSPORT, message, { appId })
    })
    const notificationsByAppIdPromisesResults = await Promise.allSettled(notificationsByAppIdPromises)
    const notificationsByAppId = {}

    for (let i = 0; i < notificationsByAppIdPromisesResults.length; i += 1) {
        const appId = uniqAppIds[i]
        if (notificationsByAppIdPromisesResults[i].status !== 'fulfilled') {
            logger.error({ msg: 'renderTemplate error', entity: 'Message', entityId: message.id, err: notificationsByAppIdPromisesResults[i].reason, data: { appId } })
            continue
        }
        notificationsByAppId[appId] = notificationsByAppIdPromisesResults[i].value
    }

    return notificationsByAppId
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

    return {
        successCount: (container.successCount || 0) + (result.successCount || 0),
        failureCount: (container.failureCount || 0) + (result.failureCount || 0),
        responses: container.responses.concat(Array.isArray(result.responses) ? result.responses : []),
        pushContext: container.pushContext || result.pushContext, // NOTE(YEgorLu): legacy, before this happened under magic
    }
}

async function deleteRemoteClientsIfTokenIsInvalid ({ transportType, result, isVoIP }) {
    const cleanRemoteClientsArgs = []
    const deleteRemoteClientPushTokensArgs = []
    for (const response of result?.responses ?? []) {
        if (!ADAPTERS[transportType].constructor.shouldClearPushTokenByErrorsInResponse?.(response)) continue

        const tokenField = isVoIP ? 'pushTokenVoIP' : 'pushToken'
        const transportField = isVoIP ? 'pushTransportVoIP' : 'pushTransport'
        const [remoteClient] = await find('RemoteClient', {
            [tokenField]: response.pushToken,
            [transportField]: transportType,
            deletedAt: null,
        })
        const [remoteClientPushToken] = await find('RemoteClientPushToken', {
            token: response.pushToken,
            provider: transportType,
        })

        if (get(remoteClient, 'id')) {
            cleanRemoteClientsArgs.push({
                id: remoteClient.id,
                data: {
                    [tokenField]: null,
                    dv: 1,
                    sender: { dv: 1, fingerprint: 'internal-update-token-not-registered' },
                },
            })
            logger.info({ msg: `remove expired ${transportType} token`, entityName: 'RemoteClient', entityId: remoteClient.id, data: { tokenField } })
        }
        if (get(remoteClientPushToken, 'id')) {
            deleteRemoteClientPushTokensArgs.push({
                id: remoteClientPushToken.id,
                data: {
                    deletedAt: new Date().toISOString(),
                    dv: 1,
                    sender: { dv: 1, fingerprint: 'internal-update-token-not-registered' },
                },
            })
            logger.info({ msg: `remove expired ${transportType} token`, entityName: 'RemoteClientPushToken', entityId: remoteClientPushToken.id })
        }
    }

    const { keystone } = getSchemaCtx('RemoteClient')
    const context = await keystone.createContext({ skipAccessControl: true })

    if (cleanRemoteClientsArgs.length) {
        await RemoteClient.updateMany(context, cleanRemoteClientsArgs)
    }
    if (deleteRemoteClientPushTokensArgs.length) {
        await RemoteClientPushToken.updateMany(context, deleteRemoteClientPushTokensArgs)
    }
}

async function sendMessageToTransports ({ recipients, isVoIP }) {
    let container = {}
    let _isOk = false

    // TODO(YEgorLu): rewrite adapters to use recipients, instead of all these objects by tokens
    const tokensByTransport = {}
    const pushTypes = {}
    const dataByToken = {}
    const appIds = {}
    const metaByToken = {}
    const notificationByToken = {}

    for (const recipient of recipients) {
        (tokensByTransport[recipient.transport] ??= []).push(recipient.token)
        pushTypes[recipient.token] = recipient.pushType
        dataByToken[recipient.token] = recipient.data
        appIds[recipient.token] = recipient.appId
        metaByToken[recipient.token] = recipient.remoteClientMeta
        notificationByToken[recipient.token] = recipient.notification
    }

    const promises = await Promise.allSettled(Object.keys(tokensByTransport).map(async transportType => {
        const tokens = tokensByTransport[transportType]
        if (isEmpty(tokens)) return null
        const adapter = ADAPTERS[transportType]

        const payload = { tokens, pushTypes, appIds, notificationByToken, dataByToken, metaByToken }
        const [isOk, result] = await adapter.sendNotification(payload, isVoIP)
        
        try {
            await deleteRemoteClientsIfTokenIsInvalid({ transportType, result, isVoIP })
        } catch (err) {
            logger.error({ msg: 'deleteRemoteClientsIfTokenIsInvalid() error', err })
        }

        /** @type {[boolean, object, string]} */
        const sendNotificationResult = [isOk, result, transportType]
        return sendNotificationResult
    }))

    for (const p of promises) {
        if (p.status !== 'fulfilled') {
            logger.error({ msg: 'sendMessageToTransports() error', err: p.reason })
            continue
        }

        const value = p.value
        if (value === null) continue

        const [isOk, result, transportType] = value
        container = mixResult(container, result, { transport: transportType })
        _isOk = _isOk || isOk
    }

    return { isOk: _isOk, result: container }
}

async function sendSequentialBatchesInGroup ({ groupName, sequentialBatchesInGroup, isVoIP }) {
    let container = {}
    let _isOk = false
    for (const recipientsBatch of sequentialBatchesInGroup) {
        const { isOk, result } = await sendMessageToTransports({
            recipients: recipientsBatch,
            isVoIP,
        })
        container = mixResult(container, result, { groupName })
        // Do not proceed with next chunk (next appId) if this succeeded
        _isOk = _isOk || isOk
        if (isOk) break
    }
    return { isOk: _isOk, result: container }
}

async function prepareRecipients ({ pushTokens, originalData, originalNotification, message }) {
    const statsInfo = { encryption: {} }
    const notificationsByAppId = await prepareNotificationsByAppId({ message, appIds: pushTokens.map(pushToken => pushToken.appId) })
    const recipients = []
    for (const pushToken of pushTokens) {
        const adapter = ADAPTERS[pushToken.transport]
        let notification = null
        try {
            notification = adapter.constructor.validateAndPrepareNotification(notificationsByAppId[pushToken.appId])
        } catch (err) {
            logger.error({ msg: 'prepareRecipients() error', entity: 'Message', entityId: message.id, err })
        }

        let data = adapter.constructor.prepareData(originalData, pushToken.token)

        const dataEncryptionVersion = PUSH_ADAPTER_SETTINGS.encryption?.[pushToken.appId]
        const needsDataEncryption = !!dataEncryptionVersion
        if (needsDataEncryption) {
            data = encryptPushData(dataEncryptionVersion, data, { appId: pushToken.appId })
            statsInfo.encryption[pushToken.appId] = {
                success: !!data,
                encryptedData: data,
            }
        }

        recipients.push({
            ...pushToken,
            data,
            notification,
        })
    }

    return { recipients, statsInfo }
}

/**
 * Send notification using corresponding transports (depending on FireBase/Huawei/Apple, appId, isVoIP)
 * @param notification
 * @param message
 * @param data
 * @param user
 * @param remoteClient
 * @param isVoIP
 * @returns {Promise<[boolean, {error: string}]|(boolean|{})[]>}
 */
async function send ({ notification, message, data, user, remoteClient } = {}, isVoIP = false) {
    const userId = get(user, 'id')
    const remoteClientId = get(remoteClient, 'id')

    if (TEMPORARY_DISABLED_TYPES_FOR_PUSH_NOTIFICATIONS.includes(get(message, 'type'))) {
        return [false, { error: 'Disabled type for push transport' }]
    }

    const pushTokens = await getTokens(userId, remoteClientId, isVoIP, PUSH_ADAPTER_SETTINGS.transportPriorityByAppId)
    // NOTE: For some message types with push transport, you need to override the push type for all push tokens.
    // If the message has a preferred push type, it takes priority over the value from the remote client.
    const preferredPushTypeForMessage = getPreferredPushTypeByMessageType(get(message, 'type'))
    if (preferredPushTypeForMessage) {
        for (const pushToken of pushTokens) {
            pushToken.pushType = preferredPushTypeForMessage
        }
    }

    let container = { failureCount: 0, successCount: 0, responses: [] }

    let { recipients, statsInfo } = await prepareRecipients({ pushTokens, originalNotification: notification, originalData: data, message })
    const invalidRecipients = recipients.filter(recipient => !recipient.notification || !recipient.data)
    recipients = recipients.filter(recipient => !invalidRecipients.includes(recipient))

    container.failureCount += invalidRecipients.length
    container.responses.push(...invalidRecipients.map(recipient => ({
        success: false,
        pushToken: recipient.token,
        appId: recipient.appId,
        pushType: recipient.pushType,
        error: recipient.notification ? 'empty data for token' : 'empty notification for token',
    })))


    let _isOk = false

    if (!recipients.length) return [false, { ...container, error: 'No pushTokens available.' }]

    const parallelGroupsWithSequentialBatches = groupIntoParallelGroupsWithSequentialBatches(recipients, PUSH_ADAPTER_SETTINGS.groups || {})

    const promises = await Promise.allSettled(Object.entries(parallelGroupsWithSequentialBatches).map(async ([groupName, sequentialBatchesInGroup]) => {
        return await sendSequentialBatchesInGroup({
            groupName,
            sequentialBatchesInGroup,
            isVoIP,
        })
    }))

    for (const p of promises) {
        if (p.status !== 'fulfilled') {
            logger.error({ msg: 'send() error', err: p.reason, entity: 'Message', entityId: data.notificationId })
            continue
        }

        const value = p.value
        if (typeof value !== 'object' || !value) continue

        const { isOk, result } = value
        container = mixResult(container, result)
        _isOk = _isOk || isOk
    }

    logger.info({ msg: 'statsInfo', entity: 'Message', entityId: data.notificationId, data: { statsInfo } })

    return [_isOk, container]
}

module.exports = {
    prepareMessageToSend,
    send,
}
