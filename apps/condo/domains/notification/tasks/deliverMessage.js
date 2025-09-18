const { format } = require('util')

const dayjs = require('dayjs')
const get = require('lodash/get')

const conf = require('@open-condo/config')
const { safeFormatError } = require('@open-condo/keystone/apolloErrorFormatter')
const { getKVClient } = require('@open-condo/keystone/kv')
const { getLogger } = require('@open-condo/keystone/logging')
const { getSchemaCtx } = require('@open-condo/keystone/schema')
const { createTask } = require('@open-condo/keystone/tasks')

const {
    SMS_TRANSPORT,
    EMAIL_TRANSPORT,
    PUSH_TRANSPORT,
    TELEGRAM_TRANSPORT,
    MESSAGE_SENDING_STATUS,
    MESSAGE_RESENDING_STATUS,
    MESSAGE_PROCESSING_STATUS,
    MESSAGE_ERROR_STATUS,
    MESSAGE_BLACKLISTED_STATUS,
    MESSAGE_SENT_STATUS,
    MESSAGE_DISABLED_BY_USER_STATUS,
    MESSAGE_DELIVERY_STRATEGY_AT_LEAST_ONE_TRANSPORT,
    MESSAGE_THROTTLED_STATUS,
} = require('@condo/domains/notification/constants/constants')
const { ONE_MESSAGE_PER_THROTTLING_PERIOD_FOR_USER } = require('@condo/domains/notification/constants/errors')
const emailAdapter = require('@condo/domains/notification/transports/email')
const pushAdapter = require('@condo/domains/notification/transports/push')
const smsAdapter = require('@condo/domains/notification/transports/sms')
const telegramAdapter = require('@condo/domains/notification/transports/telegram')
const {
    Message,
    checkMessageTypeInBlackList,
} = require('@condo/domains/notification/utils/serverSchema')
const {
    getUserSettingsForMessage,
    getMessageOptions,
} = require('@condo/domains/notification/utils/serverSchema/helpers')

const SEND_TO_CONSOLE = `${conf.NOTIFICATION__SEND_ALL_MESSAGES_TO_CONSOLE}`.toLowerCase() === 'true' || false
const DISABLE_LOGGING = `${conf.NOTIFICATION__DISABLE_LOGGING}`.toLowerCase() === 'true' || false
const logger = getLogger()

const TRANSPORT_ADAPTERS = {
    [SMS_TRANSPORT]: smsAdapter,
    [EMAIL_TRANSPORT]: emailAdapter,
    [PUSH_TRANSPORT]: pushAdapter,
    [TELEGRAM_TRANSPORT]: telegramAdapter,
}
const MESSAGE_TASK_RETRY_STATUSES = [
    MESSAGE_PROCESSING_STATUS,
    MESSAGE_SENDING_STATUS,
    MESSAGE_RESENDING_STATUS,
]

const throttlingCacheClient = getKVClient('deliverMessage', 'throttleNotificationsForUser')

/**
 * Sends message using corresponding adapter
 * @param transport
 * @param adapter
 * @param messageContext
 * @param isVoIP
 * @returns {Promise<*|[boolean, {fakeAdapter: boolean, messageContext, transport}]>}
 * @private
 */
async function _sendMessageByAdapter (transport, adapter, messageContext, isVoIP) {
    // NOTE: push adapters able to handle fake push tokens and working without credentials,
    // to emulate real push transfer and API responses.
    // Besides, this fakeAdapter thing prevents deep testing push transfer logic internals.
    // So it should be skipped for push transport., но она не вызывается
    if (SEND_TO_CONSOLE && transport !== PUSH_TRANSPORT) {
        if (!DISABLE_LOGGING) logger.info(`MESSAGE by ${transport.toUpperCase()} ADAPTER: ${JSON.stringify(messageContext)}`)

        return [true, { fakeAdapter: true, transport, messageContext }]
    }

    return await adapter.send(messageContext, isVoIP)
}

/**
 * @param {Message} message
 * @returns {string}
 */
function getThrottlingCacheKey (message) {
    return `user:${get(message, ['user', 'id'])}:messageType:${get(message, 'type')}:lastSending`
}

/**
 * Tries to deliver message via available transports depending on transport priorities
 * based on provided message data and available channels. If more prioritized channels fail message delivery,
 * tries to deliver message through less prioritized fallback channels. Updates message status & meta in every case.
 * @param message
 * @returns {Promise<string>}
 */
async function deliverMessage (message) {
    const { keystone: context } = getSchemaCtx('Message')

    if (!message || !message.id) {
        throw new Error('deliverMessage: invalid "message" argument – expected object with non-empty "id"')
    }
    // Skip messages that are already have been processed
    if (!MESSAGE_TASK_RETRY_STATUSES.includes(message.status)) return `already-${message.status}`

    const baseAttrs = { dv: message.dv, sender: message.sender }
    const { error } = await checkMessageTypeInBlackList(context, message)

    if (error) {
        const messageErrorData = {
            ...baseAttrs,
            status: MESSAGE_BLACKLISTED_STATUS,
            processingMeta: {
                dv: 1,
                error,
            },
        }

        await Message.update(context, message.id, messageErrorData)

        return MESSAGE_BLACKLISTED_STATUS
    }

    const { strategy, transports, isVoIP, throttlePeriodForUser = null } = getMessageOptions(message.type)

    if (throttlePeriodForUser) {
        const throttlingCacheKey = getThrottlingCacheKey(message)
        const lastMessageTypeSentDate = await throttlingCacheClient.get(throttlingCacheKey)

        if (lastMessageTypeSentDate) {
            const messageErrorData = {
                ...baseAttrs,
                status: MESSAGE_THROTTLED_STATUS,
                processingMeta: {
                    dv: 1,
                    error: format(ONE_MESSAGE_PER_THROTTLING_PERIOD_FOR_USER, throttlePeriodForUser, lastMessageTypeSentDate),
                },
            }
            await Message.update(context, message.id, messageErrorData)

            logger.info({
                msg: 'throttled',
                entityId: message.id,
                entity: 'Message',
                data: { throttlePeriodForUser, lastMessageTypeSentDate },
            })

            return MESSAGE_THROTTLED_STATUS
        }
    }

    const userTransportSettings = await getUserSettingsForMessage(context, message)

    const processingMeta = { dv: 1, step: 'init' }

    const messageInitData = {
        ...baseAttrs,
        status: MESSAGE_PROCESSING_STATUS,
        sentAt: null,
        deliveredAt: null,
        readAt: null,
        processingMeta,
    }

    await Message.update(context, message.id, messageInitData)

    const sendByOneTransport = strategy === MESSAGE_DELIVERY_STRATEGY_AT_LEAST_ONE_TRANSPORT

    processingMeta.defaultTransports = transports
    processingMeta.transports = []
    processingMeta.transportsMeta = []

    if (isVoIP) processingMeta.isVoIP = isVoIP

    let sentCount = 0
    let disabledByUserCount = 0

    for (const transport of transports) {
        const transportMeta = { transport }

        processingMeta.transport = transport

        try {
            const adapter = TRANSPORT_ADAPTERS[transport]
            // NOTE: Renderer will throw here, if it doesn't have template/support for required transport type.
            const messageContext = await adapter.prepareMessageToSend(message)

            processingMeta.messageContext = messageContext
            transportMeta.messageContext = messageContext
            processingMeta.transports.push(transport)

            const isAllowedByUser = get(userTransportSettings, transport)
            if (isAllowedByUser === false) {
                transportMeta.status = MESSAGE_DISABLED_BY_USER_STATUS
                logger.info({
                    msg: 'disabled by user',
                    entityId: message.id,
                    entity: 'Message',
                    data: { transport, userTransportSettings },
                })
                disabledByUserCount++
            } else {
                const [isOk, deliveryMeta] = await _sendMessageByAdapter(transport, adapter, messageContext, isVoIP)
                logger.info({
                    msg: 'sendMessageByAdapter',
                    entityId: message.id,
                    entity: 'Message',
                    status: isOk ? 'ok' : 'error',
                    data: {
                        deliveryMeta,
                    },
                })
                transportMeta.deliveryMetadata = deliveryMeta
                transportMeta.status = isOk ? MESSAGE_SENT_STATUS : MESSAGE_ERROR_STATUS
                processingMeta.step = isOk ? MESSAGE_SENT_STATUS : MESSAGE_ERROR_STATUS
                sentCount += isOk ? 1 : 0
            }
        } catch (error) {
            transportMeta.status = MESSAGE_ERROR_STATUS
            transportMeta.exception = safeFormatError(error, false)

            logger.error({
                msg: 'deliverMessage error',
                error,
                entityId: message.id,
                entity: 'Message',
                data: {
                    transportMeta,
                    processingMeta,
                },
            })
        }

        processingMeta.transportsMeta.push(transportMeta)

        if (sendByOneTransport && sentCount > 0) break
    }

    let status = MESSAGE_ERROR_STATUS

    if (sentCount > 0) {
        status = MESSAGE_SENT_STATUS
    } else if (disabledByUserCount > 0) {
        status = MESSAGE_DISABLED_BY_USER_STATUS
    }

    const messageFinalData = {
        ...baseAttrs,
        status,
        sentAt: (sentCount > 0) ? new Date().toISOString() : null,
        deliveredAt: null,
        readAt: null,
        processingMeta,
    }

    await Message.update(context, message.id, messageFinalData)

    if (throttlePeriodForUser) {
        await throttlingCacheClient.set(getThrottlingCacheKey(message), dayjs().toISOString(), 'EX', throttlePeriodForUser)
    }

    return messageFinalData.status
}

module.exports = {
    deliverMessage: createTask('deliverMessage', deliverMessage),
}
