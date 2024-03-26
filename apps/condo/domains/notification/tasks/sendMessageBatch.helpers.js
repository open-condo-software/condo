const { get, isString, isEmpty } = require('lodash')

const conf = require('@open-condo/config')
const { getLogger } = require('@open-condo/keystone/logging')

const { md5 } = require('@condo/domains/common/utils/crypto')
const {
    SMS_TRANSPORT, EMAIL_TRANSPORT, PUSH_TRANSPORT,
    CUSTOM_CONTENT_MESSAGE_TYPE,
    CUSTOM_CONTENT_MESSAGE_PUSH_TYPE,
    CUSTOM_CONTENT_MESSAGE_EMAIL_TYPE,
    CUSTOM_CONTENT_MESSAGE_SMS_TYPE,
    MOBILE_APP_UPDATE_AVAILABLE_MESSAGE_PUSH_TYPE, 
} = require('@condo/domains/notification/constants/constants')
const { sendMessage } = require('@condo/domains/notification/utils/serverSchema')

const EMAIL_FROM = 'noreply@doma.ai'
const DATE_FORMAT = 'YYYY-MM-DD'
const IS_EMAIL_REGEXP = /^\S+@\S+\.\S+$/
const IS_PHONE_REGEXP = /^\+79\d{9}$/
const IS_USER_UUID_REGEXP = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-5][0-9a-f]{3}-[089ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const IS_REMOTE_CLIENT_UUID_REGEXP = /^rc:[0-9a-f]{8}-[0-9a-f]{4}-[0-5][0-9a-f]{3}-[089ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const MESSAGE_TYPES_BY_TRANSPORTS = {
    [CUSTOM_CONTENT_MESSAGE_TYPE]: {
        [PUSH_TRANSPORT]: CUSTOM_CONTENT_MESSAGE_PUSH_TYPE,
        [EMAIL_TRANSPORT]: CUSTOM_CONTENT_MESSAGE_EMAIL_TYPE,
        [SMS_TRANSPORT]: CUSTOM_CONTENT_MESSAGE_SMS_TYPE,
    },
    [MOBILE_APP_UPDATE_AVAILABLE_MESSAGE_PUSH_TYPE]: {
        [PUSH_TRANSPORT]: MOBILE_APP_UPDATE_AVAILABLE_MESSAGE_PUSH_TYPE,
    },
}

const logger = getLogger('sendMessageBatch')

/**
 * Detects transport type based on target (contact), using corresponding RegExps
 * Supported targets - phone, email, User id, RemoteClient id
 * @param target
 * @returns {string|null}
 */
const detectTransportType = (target) => {
    if (!isString(target)) return null
    if (IS_EMAIL_REGEXP.test(target)) return EMAIL_TRANSPORT
    if (IS_PHONE_REGEXP.test(target)) return SMS_TRANSPORT
    if (IS_USER_UUID_REGEXP.test(target)) return PUSH_TRANSPORT
    if (IS_REMOTE_CLIENT_UUID_REGEXP.test(target)) return PUSH_TRANSPORT

    return null
}

/**
 * Prepares target for message based on initial target (contact)
 * Supported targets - phone, email, User id, RemoteClient id
 * @param target
 * @returns {{to: {remoteClient: {id}}}|{emailFrom: string, to: {email}}|null|{to: {user: {id}}}|{to: {phone}}}
 */
const selectTarget = (target) => {
    const transportType = detectTransportType(target)

    if (!transportType) return null
    if (transportType === SMS_TRANSPORT) return { to: { phone: target } }
    if (transportType === EMAIL_TRANSPORT) return { to: { email: target }, emailFrom: EMAIL_FROM }
    if (IS_REMOTE_CLIENT_UUID_REGEXP.test(target)) return { to: { remoteClient: { id: target.replace('rc:', '') } } }
    if (IS_USER_UUID_REGEXP.test(target)) return { to: { user: { id: target } } }

    return null
}

/**
 * Normalizes target value and converts to MD5 hash
 * @param target
 * @returns {string|null}
 */
const normalizeTarget = (target) => {
    if (!isString(target)) return null

    const value = target.trim()
    const type = detectTransportType(value)

    if (type === EMAIL_TRANSPORT) return md5(value.toLowerCase())

    // MD5 is used here to hide contacts (phone/email) within uniqKey value
    return md5(value)
}

/**
 * Prepares uniq key value based on it's arguments
 * @param date
 * @param title
 * @param target
 * @returns {`${string}:${string}:${string}`|`${string}:${string}:null`}
 */
const getUniqKey = (date, title, target) => `${date}:${title}:${normalizeTarget(target)}`

/**
 * Prepares message data to be sent via sendMessage
 * @param target
 * @param batch
 * @param today
 * @returns {{uniqKey: (`${string}:${string}:${string}`|`${string}:${string}:null`), sender: {dv: number, fingerprint: string}, meta: {dv: number, data: {remoteClient: *, batchId, userId: *, url, target}, body}, lang: *, type: *}|number}
 */
const prepareMessageData = (target, batch, today) => {
    const notificationKey = getUniqKey(today, batch.title, target)
    const transportType = detectTransportType(target)
    const to = selectTarget(target)
    const type = get(MESSAGE_TYPES_BY_TRANSPORTS, [batch.messageType, transportType])

    if (isEmpty(to) || !transportType || !type) return 0

    const messageData = {
        ...to,
        lang: conf.DEFAULT_LOCALE,
        type,
        meta: {
            dv: 1,
            body: batch.message,
            data: {
                userId: get(to, 'to.user.id'),
                remoteClient: get(to, 'to.remoteClient.id'),
                target: target,
                url: batch.deepLink,
                batchId: batch.id,
            },
        },
        sender: { dv: 1, fingerprint: 'send-message-batch-notification' },
        uniqKey: notificationKey,
    }

    if (transportType === PUSH_TRANSPORT) messageData.meta.title = batch.title
    if (transportType === EMAIL_TRANSPORT) messageData.meta.subject = batch.title

    return messageData
}

/**
 * Prepares message data then triggers sending it to proper target using proper transport
 * @param context
 * @param target
 * @param batch
 * @param today
 * @returns {Promise<number>}
 */
const prepareAndSendMessage = async (context, target, batch, today) => {
    const messageData = prepareMessageData(target, batch, today)

    if (!messageData) return 0

    try {
        const result = await sendMessage(context, messageData)

        return 1 - result.isDuplicateMessage
    } catch (error) {
        logger.info({ msg: 'sendMessage error', error, data: messageData })

        return 0
    }
}

module.exports = {
    DATE_FORMAT,
    EMAIL_FROM,
    getUniqKey,
    selectTarget,
    detectTransportType,
    prepareMessageData,
    prepareAndSendMessage,
    normalizeTarget,
}