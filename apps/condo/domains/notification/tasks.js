const isEmpty = require('lodash/isEmpty')

const conf = require('@core/config')
const { createTask } = require('@core/keystone/tasks')
const { getSchemaCtx } = require('@core/keystone/schema')

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
/**
 * This constant regulates if we should fallback failed push transport bu email.
 * It is disabled by now due to organization's complaints - some of them have only one responsible and assignee
 * for all tickets and get tons of emails, which they didn't like at all. :)
 * @type {boolean}
 */
const SHOULD_FALLBACK_PUSH_TRANSPORT = false

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
 * @returns {Promise<*[]>}
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
    if (!isEmpty(user)) {
        transports.push(PUSH_TRANSPORT)

        // By now most of mobile users are not ready to receive push, so almost always it would come to
        // SMS as a fallback transport, which is quite expensive (we have 13k+) new tickets a month, which could
        // cause up to x(2 + 5) and even more notifications (13k x 7 x 3 RUB > 250K RUB),
        // so @MikhailRumanovskii decided to switch this off for a while
        // if (!isEmpty(user.phone) && !transports.includes(SMS_TRANSPORT)) transports.push(SMS_TRANSPORT)

        // Fallback transport attempts, if PUSH delivery fails
        if (SHOULD_FALLBACK_PUSH_TRANSPORT && !isEmpty(user.email) && !transports.includes(EMAIL_TRANSPORT)) transports.push(EMAIL_TRANSPORT)
    }

    // At this point we return whatever non-empty sequence we've got
    if (!isEmpty(transports)) return transports

    // NOTE: none of requirements were met for message state, so we can't send anything anywhere actually.
    throw new Error(`No appropriate transport found for notification id: ${id}` )
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

    const transports = await _choseMessageTransport(message)
    const baseAttrs = {
        // TODO(pahaz): it's better to use server side fingerprint?!
        dv: message.dv,
        sender: message.sender,
    }
    const processingMeta = { dv: 1, transport: transports[0], step: 'init' }

    await Message.update(keystone, message.id, {
        ...baseAttrs,
        status: MESSAGE_PROCESSING_STATUS,
        sentAt: null,
        deliveredAt: null,
        readAt: null,
        processingMeta,
    })

    const failedMeta = []

    for (const transport of transports) {
        try {
            const adapter = TRANSPORTS[transport]
            // NOTE: Renderer will throw here, if it doesn't have template/support for required transport type.
            const messageContext = await adapter.prepareMessageToSend(message)

            const [isOk, deliveryMetadata] = await _sendMessageByAdapter(transport, adapter, messageContext)

            if (isOk) {
                processingMeta.messageContext = messageContext
                processingMeta.deliveryMetadata = deliveryMetadata
                processingMeta.step = MESSAGE_SENT_STATUS
                processingMeta.transport = transport
                break
            } else {
                logger.error('Transport send result is not OK. Check deliveryMetadata', deliveryMetadata)
                failedMeta.push({
                    error: 'Transport send result is not OK. Check deliveryMetadata',
                    transport,
                    messageContext,
                    deliveryMetadata,
                })
            }
        } catch (e) {
            logger.error(e)

            failedMeta.push({ transport, errorStack: e.stack, error: String(e) })
        }
    }

    // message sent either directly or by fallback transport
    if (processingMeta.step === MESSAGE_SENT_STATUS) {
        await Message.update(keystone, message.id, {
            ...baseAttrs,
            status: MESSAGE_SENT_STATUS,
            sentAt: new Date().toISOString(),
            deliveredAt: null,
            readAt: null,
            processingMeta: !isEmpty(failedMeta) ? { ...processingMeta, failedMeta } : processingMeta,
        })
    } else {
        await Message.update(keystone, message.id, {
            ...baseAttrs,
            status: MESSAGE_ERROR_STATUS,
            sentAt: null,
            deliveredAt: null,
            readAt: null,
            processingMeta: { ...processingMeta, failedMeta },
        })

        throw new Error(processingMeta.error)
        // TODO(pahaz): need to think about some repeat logic?
        //  at the moment we just throw the error to worker scheduler!
    }
}

module.exports = {
    deliverMessage: createTask('deliverMessage', deliverMessage),
}
