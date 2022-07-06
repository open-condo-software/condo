const isEmpty = require('lodash/isEmpty')

const conf = require('@core/config')
const { createTask } = require('@core/keystone/tasks')
const { getSchemaCtx } = require('@core/keystone/schema')

const { safeFormatError } = require('@condo/domains/common/utils/apolloErrorFormatter')
const { Message } = require('@condo/domains/notification/utils/serverSchema')
const { logger } = require('@condo/domains/notification/utils')

const sms = require('./transports/sms')
const email = require('./transports/email')
const push = require('./transports/push')
const {
    SMS_TRANSPORT,
    EMAIL_TRANSPORT,
    PUSH_TRANSPORT,
    MESSAGE_SENDING_STATUS,
    MESSAGE_RESENDING_STATUS,
    MESSAGE_PROCESSING_STATUS,
    MESSAGE_ERROR_STATUS,
    MESSAGE_SENT_STATUS,
} = require('./constants/constants')

const SEND_TO_CONSOLE = conf.NOTIFICATION__SEND_ALL_MESSAGES_TO_CONSOLE || false
const DISABLE_LOGGING = conf.NOTIFICATION__DISABLE_LOGGING || false

const TRANSPORTS = {
    [SMS_TRANSPORT]: sms,
    [EMAIL_TRANSPORT]: email,
    [PUSH_TRANSPORT]: push,
}
const MESSAGE_SENDING_STATUSES = {
    [MESSAGE_SENDING_STATUS]: true,
    [MESSAGE_RESENDING_STATUS]: true,
}

async function _sendMessageByAdapter (transport, adapter, messageContext) {
    if (SEND_TO_CONSOLE) {
        if (!DISABLE_LOGGING) console.info(`MESSAGE by ${transport.toUpperCase()} ADAPTER: ${JSON.stringify(messageContext)}`)

        return [true, { fakeAdapter: true }]
    }

    return await adapter.send(messageContext)
}

// TODO(pahaz): we should chose the best transport for the message.
//  We can chose transport depends on the message.type?
//  or use something like message.user.profile.preferredNotificationTransport if user want to get messages from TG

/**
 * Calculates transport types priority queue for a message according to provided message data,
 * and fallback transports if more prioritized transports fail message delivery.
 * @param message
 * @returns {Promise<string[]>}
 * @private
 */
async function _choseMessageTransport (message) {
    const { phone, user, email, id } = message
    const transports = []

    // if message has phone field, SMS would be the only priority transport
    if (!isEmpty(phone)) return [SMS_TRANSPORT]

    // if message doesn't have phone, but has email field, EMAIL would be the only priority transport
    if (!isEmpty(email)) return [EMAIL_TRANSPORT]

    // if user is provided, we can try to send PUSH notifications wither a priority transport
    // if phone & email are absent, or fallback transport if phone & email are present but fail to deliver message
    // at the moment we don't want to use fallback!
    if (!isEmpty(user)) {
        transports.push(PUSH_TRANSPORT)
    }

    // At this point we return whatever non-empty sequence we've got
    if (!isEmpty(transports)) return transports

    // NOTE: none of requirements were met for message state, so we can't send anything anywhere actually.
    throw new Error(`No appropriate transport found for notification id: ${id}`)
}

/**
 * Tries to deliver message via available transports depending on transport priorities
 * based on provided message data and available channels. If more prioritized channels fail message delivery,
 * tries to delived message through less prioritized fallback channels. Updates message status & meta in every case.
 * @param messageId
 * @returns {Promise<string>}
 */
async function deliverMessage (messageId) {
    const { keystone } = await getSchemaCtx('Message')
    const message = await Message.getOne(keystone, { id: messageId })

    if (message.id !== messageId) throw new Error('get message by id has wrong result')
    // Skip messages that are already have been processed
    if (!MESSAGE_SENDING_STATUSES[message.status]) return `already-${message.status}`

    const baseAttrs = {
        dv: message.dv,
        sender: message.sender,
    }

    const transports = await _choseMessageTransport(message)
    const processingMeta = { dv: 1, transports, step: 'init' }

    await Message.update(keystone, message.id, {
        ...baseAttrs,
        status: MESSAGE_PROCESSING_STATUS,
        sentAt: null,
        deliveredAt: null,
        readAt: null,
        processingMeta,
    })

    const transportsMeta = []
    processingMeta.transportsMeta = transportsMeta

    for (const transport of transports) {
        const transportMeta = { transport }
        processingMeta.transport = transport
        transportsMeta.push(transportMeta)

        try {
            const adapter = TRANSPORTS[transport]
            // NOTE: Renderer will throw here, if it doesn't have template/support for required transport type.
            const messageContext = await adapter.prepareMessageToSend(message)
            processingMeta.messageContext = messageContext

            const [isOk, deliveryMetadata] = await _sendMessageByAdapter(transport, adapter, messageContext)
            processingMeta.deliveryMetadata = deliveryMetadata
            transportMeta.deliveryMetadata = deliveryMetadata

            if (isOk) {
                transportMeta.status = MESSAGE_SENT_STATUS
                processingMeta.step = MESSAGE_SENT_STATUS
                break
            } else {
                transportMeta.status = MESSAGE_ERROR_STATUS
                processingMeta.step = MESSAGE_ERROR_STATUS
            }
        } catch (e) {
            transportMeta.status = MESSAGE_ERROR_STATUS
            transportMeta.exception = safeFormatError(e, false)
            logger.error({ step: 'deliverMessage()', messageId, transportMeta, transportsMeta, processingMeta })
        }
    }

    // message sent either directly or by fallback transport
    const status = (processingMeta.step === MESSAGE_SENT_STATUS) ? MESSAGE_SENT_STATUS : MESSAGE_ERROR_STATUS
    await Message.update(keystone, message.id, {
        ...baseAttrs,
        status,
        sentAt: (processingMeta.step === MESSAGE_SENT_STATUS) ? new Date().toISOString() : null,
        deliveredAt: null,
        readAt: null,
        processingMeta,
    })

    return status
}

module.exports = {
    deliverMessage: createTask('deliverMessage', deliverMessage, {
        priority: 1,
    }),
}
