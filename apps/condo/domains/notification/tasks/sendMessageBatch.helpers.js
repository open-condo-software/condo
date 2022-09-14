const { get, isString } = require('lodash')

const conf = require('@condo/config')

const { getLogger } = require('@condo/keystone/logging')

const { sendMessage } = require('@condo/domains/notification/utils/serverSchema')

const {
    SMS_TRANSPORT, EMAIL_TRANSPORT, PUSH_TRANSPORT,
    CUSTOM_CONTENT_MESSAGE_TYPE,
} = require('../constants/constants')

const EMAIL_FROM = 'noreply@doma.ai'
const DATE_FORMAT = 'YYYY-MM-DD'
const IS_EMAIL_REGEXP = /^\S+@\S+\.\S+$/
const IS_PHONE_REGEXP = /^\+79\d{9}$/
const IS_UUID_REGEXP = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-5][0-9a-f]{3}-[089ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const logger = getLogger('sendMessageBatch')

const detectTransportType = (target) => {
    if (!isString(target)) return null
    if (IS_EMAIL_REGEXP.test(target)) return EMAIL_TRANSPORT
    if (IS_PHONE_REGEXP.test(target)) return SMS_TRANSPORT
    if (IS_UUID_REGEXP.test(target)) return PUSH_TRANSPORT

    return null
}

const selectTarget = (target) => {
    const transportType = detectTransportType(target)

    if (!transportType) return null
    if (transportType === SMS_TRANSPORT) return { to: { phone: target } }
    if (transportType === EMAIL_TRANSPORT) return { to: { email: target }, emailFrom: EMAIL_FROM }
    if (transportType === PUSH_TRANSPORT) return { to: { user: { id: target } } }

    return null
}

const normalizeTarget = (target) => {
    if (!isString(target)) return null

    const value = target.trim()
    const type = detectTransportType(value)

    if (type === EMAIL_TRANSPORT) return value.toLowerCase()

    return value
}

const getUniqKey = (date, title, target) => `${date}:${title}:${normalizeTarget(target)}`

const prepareAndSendMessage = async (context, target, batch, today) => {
    const notificationKey = getUniqKey(today, batch.title, target)
    const transportType = detectTransportType(target)
    const to = selectTarget(target)

    if (!to || !transportType) return 0

    const messageData = {
        ...to,
        lang: conf.DEFAULT_LOCALE,
        type: CUSTOM_CONTENT_MESSAGE_TYPE,
        meta: {
            dv: 1,
            body: batch.message,
            data: {
                userId: get(to, 'to.user.id'),
                target: target,
                url: batch.deepLink,
                marketingMessageId: batch.id,
            },
        },
        sender: { dv: 1, fingerprint: 'send-message-batch-notification' },
        uniqKey: notificationKey,
    }

    if (transportType === PUSH_TRANSPORT) messageData.meta.title = batch.title
    if (transportType === EMAIL_TRANSPORT) messageData.meta.subject = batch.title

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
    prepareAndSendMessage,
    normalizeTarget,
}