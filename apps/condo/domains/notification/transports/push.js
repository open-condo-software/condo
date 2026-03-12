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
const { getTokens, groupByAppIdPriorityGroups } = require('@condo/domains/notification/utils/serverSchema/push/helpers')

const logger = getLogger()


/**
 * @typedef PushAdapterSettings
 * @property {Record<string, string> | undefined} encryption - appId to encryptionVersion
 * @property {Record<string, string[]> | undefined} groups - groupName to ordered appIds in group
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
    if (transportType === PUSH_TRANSPORT_FIREBASE) {
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

async function sendMessageToTransports ({ recipients, isVoIP }) {
    let container = {}
    let _isOk = false

    // TODO(YEgorLu): rewrite adapters to use recipients, instead of all these objects by tokens
    const tokensByTransport = {}
    const pushTypes = {}
    const dataByToken = {}
    const appIds = {}
    const metaByToken = {}
    const notification = recipients[0]?.notification // NOTE(YEgorLu): right now notification is same for everyone

    for (const recipient of recipients) {
        (tokensByTransport[recipient.transport] ??= []).push(recipient.token)
        pushTypes[recipient.token] = recipient.pushType
        dataByToken[recipient.token] = recipient.data
        appIds[recipient.token] = recipient.appId
        metaByToken[recipient.token] = recipient.remoteClientMeta
    }

    const promises = await Promise.allSettled(Object.keys(tokensByTransport).map(async transportType => {
        const tokens = tokensByTransport[transportType]
        if (isEmpty(tokens)) return null
        const adapter = ADAPTERS[transportType]

        const payload = { tokens, pushTypes, appIds, notification, dataByToken, metaByToken }
        const [isOk, result] = await adapter.sendNotification(payload, isVoIP)
        
        await deleteRemoteClientsIfTokenIsInvalid({ transportType, result, isVoIP })

        /** @type {[boolean, object, string]} */
        const sendNotificationResult = [isOk, result, transportType]
        return sendNotificationResult
    }))

    for (const p of promises) {
        if (p.status !== 'fulfilled') continue

        const value = p.value
        if (value === null) continue

        const [isOk, result, transportType] = value
        container = mixResult(container, result, { transport: transportType })
        _isOk = _isOk || isOk
    }

    return { isOk: _isOk, result: container }
}

async function sendMessageToAppsGroup ({ groupName, recipientsBatchesInGroup, isVoIP }) {
    let container = {}
    let _isOk = false
    for (const recipientsBatch of recipientsBatchesInGroup) {
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

async function prepareRecipients ({ pushTokens, originalData, originalNotification }) {
    const statsInfo = { encryption: {} }
    const recipients = []
    for (const pushToken of pushTokens) {
        const notification = originalNotification // NOTE(YEgorLu): soon will be updated for each
        let data = ADAPTERS[pushToken.transport].constructor.prepareData(originalData, pushToken.token)

        const dataEncryptionVersion = PUSH_ADAPTER_SETTINGS.encryption?.[pushToken.appId]
        const needsDataEncryption = !!dataEncryptionVersion
        if (needsDataEncryption) {
            data = encryptPushData(dataEncryptionVersion, data, { appId: pushToken.appId })
            statsInfo.encryption[pushToken.token] = {
                success: !!data,
                appId: pushToken.appId,
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
 * @param data
 * @param user
 * @param remoteClient
 * @param isVoIP
 * @returns {Promise<[boolean, {error: string}]|(boolean|{})[]>}
 */
async function send ({ notification, data, user, remoteClient } = {}, isVoIP = false) {
    const userId = get(user, 'id')
    const remoteClientId = get(remoteClient, 'id')

    if (TEMPORARY_DISABLED_TYPES_FOR_PUSH_NOTIFICATIONS.includes(get(data, 'type'))) {
        return [false, { error: 'Disabled type for push transport' }]
    }

    let pushTokens = await getTokens(userId, remoteClientId, isVoIP)

    // NOTE: For some message types with push transport, you need to override the push type for all push tokens.
    // If the message has a preferred push type, it takes priority over the value from the remote client.
    const preferredPushTypeForMessage = getPreferredPushTypeByMessageType(get(data, 'type'))
    if (preferredPushTypeForMessage) {
        for (const pushToken of pushTokens) {
            pushToken.pushType = preferredPushTypeForMessage
        }
    }

    let container = { failureCount: 0, successCount: 0, responses: [] }

    let { recipients, statsInfo } = await prepareRecipients({ pushTokens, originalNotification: notification, originalData: data })

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

    const recipientsByGroupsAndBatches = groupByAppIdPriorityGroups(recipients, PUSH_ADAPTER_SETTINGS.groups || {})

    const promises = await Promise.allSettled(Object.entries(recipientsByGroupsAndBatches).map(async ([groupName, recipientsBatches]) => {
        return await sendMessageToAppsGroup({
            groupName,
            recipientsBatchesInGroup: recipientsBatches,
            isVoIP,
        })
    }))

    for (const p of promises) {
        if (p.status !== 'fulfilled') continue

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
