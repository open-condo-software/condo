const conf = require('@condo/config')
const { createTask } = require('@condo/keystone/tasks')
const { getSchemaCtx } = require('@condo/keystone/schema')

const { safeFormatError } = require('@condo/keystone/apolloErrorFormatter')
const { Message, checkMessageTypeInBlackList } = require('@condo/domains/notification/utils/serverSchema')
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
    MESSAGE_DELIVERY_STRATEGY_ALL_TRANSPORTS,
    MESSAGE_DELIVERY_STRATEGY_AT_LEAST_ONE_TRANSPORT,
    MESSAGE_DELIVERY_OPTIONS,
    DEFAULT_MESSAGE_DELIVERY_OPTIONS,
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
    const { type } = message

    const messageDeliveryOptions = MESSAGE_DELIVERY_OPTIONS[type] || {}
    const opts = Object.assign(Object.assign({}, DEFAULT_MESSAGE_DELIVERY_OPTIONS), messageDeliveryOptions)
    return {
        strategy: opts.strategy,
        transports: opts.transports,
    }
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

    const { error } = await checkMessageTypeInBlackList(keystone, message)
    if (error) {
        return await Message.update(keystone, message.id, {
            ...baseAttrs,
            status: MESSAGE_ERROR_STATUS,
            processingMeta: {
                dv: 1,
                error,
            },
        })
    }

    let isSentAtLeastOneMessage = false
    const { transports, strategy } = await _choseMessageTransport(message)
    const processingMeta = { dv: 1 }

    await Message.update(keystone, message.id, {
        ...baseAttrs,
        status: MESSAGE_PROCESSING_STATUS,
        sentAt: null,
        deliveredAt: null,
        readAt: null,
        processingMeta,
    })

    processingMeta.transports = transports
    processingMeta.transportsMeta = []
    const sendByOneTransport = strategy !== MESSAGE_DELIVERY_STRATEGY_ALL_TRANSPORTS || strategy === MESSAGE_DELIVERY_STRATEGY_AT_LEAST_ONE_TRANSPORT

    for (const transport of transports) {
        const transportMeta = { transport }
        processingMeta.transportsMeta.push(transportMeta)

        try {
            const adapter = TRANSPORTS[transport]
            // NOTE: Renderer will throw here, if it doesn't have template/support for required transport type.
            const messageContext = await adapter.prepareMessageToSend(message)
            transportMeta.messageContext = messageContext

            const [isOk, deliveryMetadata] = await _sendMessageByAdapter(transport, adapter, messageContext)
            transportMeta.deliveryMetadata = deliveryMetadata

            if (isOk) {
                transportMeta.status = MESSAGE_SENT_STATUS
                isSentAtLeastOneMessage = true
                if (sendByOneTransport) break
            } else {
                transportMeta.status = MESSAGE_ERROR_STATUS
            }
        } catch (e) {
            transportMeta.status = MESSAGE_ERROR_STATUS
            transportMeta.exception = safeFormatError(e, false)
            logger.warn({ step: 'deliverMessage()', messageId, transportMeta })
        }
    }

    // NOTE(2000Ilya): status string for understanding what's going on with the message sending
    processingMeta.status = (processingMeta.transportsMeta.length === 0) ? '-' :  processingMeta.transportsMeta.map(x => `${x.transport}:${x.status}`).join(';')

    // message sent either directly or by fallback transport
    const status = (isSentAtLeastOneMessage) ? MESSAGE_SENT_STATUS : MESSAGE_ERROR_STATUS
    await Message.update(keystone, message.id, {
        ...baseAttrs,
        status,
        sentAt: (isSentAtLeastOneMessage) ? new Date().toISOString() : null,
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
