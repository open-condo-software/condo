const isEmpty = require('lodash/isEmpty')

const conf = require('@core/config')
const { createTask } = require('@core/keystone/tasks')
const { getSchemaCtx } = require('@core/keystone/schema')

const { Message } = require('@condo/domains/notification/utils/serverSchema')

const {
    SMS_TRANSPORT,
    EMAIL_TRANSPORT,
    PUSH_TRANSPORT,
    MESSAGE_SENDING_STATUS,
    MESSAGE_RESENDING_STATUS,
    MESSAGE_PROCESSING_STATUS,
    MESSAGE_ERROR_STATUS,
    MESSAGE_DELIVERED_STATUS,
    TRANSPORT_PRIORITIES_BY_MESSAGE_TYPES,
    DEFAULT_TRANSPORT_PRIORITIES,
} = require('./constants/constants')
const sms = require('./transports/sms')
const email = require('./transports/email')
const push = require('./transports/push')

const SEND_TO_CONSOLE = conf.NOTIFICATION__SEND_ALL_MESSAGES_TO_CONSOLE || false
const DISABLE_LOGGING = conf.NOTIFICATION__DISABLE_LOGGING || false

const TRANSPORTS = {
    [SMS_TRANSPORT]: sms,
    [EMAIL_TRANSPORT]: email,
    [PUSH_TRANSPORT]: push,
}

async function _sendMessageByAdapter (transport, adapter, messageContext) {
    if (SEND_TO_CONSOLE && transport !== PUSH_TRANSPORT) {
        if (!DISABLE_LOGGING) console.info(`MESSAGE by ${transport.toUpperCase()} ADAPTER: ${JSON.stringify(messageContext)}`)

        return [true, { fakeAdapter: true }]
    }

    return await adapter.send(messageContext)
}

// TODO(DOMA-2396): Add customizable transportation priorities for different types of notifications
/**
 * Calculates transport types queue for a message according to message type, transportation priorities for
 * message type and fallback hardcoded priorities for edge cases.
 * @param message
 * @returns {Promise<*[]>}
 * @private
 */
async function _choseMessageTransport (message) {
    const { phone, user, email, type, id } = message
    const TRANSPORT_PRIORITIES = TRANSPORT_PRIORITIES_BY_MESSAGE_TYPES[type] || DEFAULT_TRANSPORT_PRIORITIES
    const transports = []

    for (const transport of TRANSPORT_PRIORITIES) {
        if (transport === PUSH_TRANSPORT) transports.push(PUSH_TRANSPORT)
        // Here we come if current transport priority is not a PUSH
        if (transport === SMS_TRANSPORT && !isEmpty(phone)) transports.push(SMS_TRANSPORT)
        // Here we come if primary transport priority is neither PUSH or SMS,
        // or it is SMS, but no phone number provided
        if (transport === EMAIL_TRANSPORT && !isEmpty(email)) transports.push(EMAIL_TRANSPORT)
    }

    // Here we come if transport priorities weren't set for messate.type or
    // current message state didn't meet requirements
    // so we should use fallback transport type

    // SMS has higher priority over EMAIL.
    if (!isEmpty(phone) && !transports.includes(SMS_TRANSPORT)) transports.push(SMS_TRANSPORT)
    if (!isEmpty(email) && !transports.includes(EMAIL_TRANSPORT)) transports.push(EMAIL_TRANSPORT)

    if (!isEmpty(user.email) && !transports.includes(EMAIL_TRANSPORT)) transports.push(EMAIL_TRANSPORT)

    if (!isEmpty(transports)) return transports

    // NOTE: none of requirements were met for message state, so we can't send anything anywhere actually.
    throw new Error(`No appropriate transport found for notification id: ${id}` )
}

async function deliverMessage (messageId) {
    const { keystone } = await getSchemaCtx('Message')
    const message = await Message.getOne(keystone, { id: messageId })

    if (message.id !== messageId) throw new Error('get message by id has wrong result')

    const transports = await _choseMessageTransport(message)

    if (message.status !== MESSAGE_SENDING_STATUS && message.status !== MESSAGE_RESENDING_STATUS) return `already-${message.status}`

    const baseAttrs = {
        // TODO(pahaz): it's better to use server side fingerprint?!
        dv: message.dv,
        sender: message.sender,
    }
    const processingMeta = { dv: 1, transport: transports[0], step: 'init' }

    await Message.update(keystone, message.id, {
        ...baseAttrs,
        status: MESSAGE_PROCESSING_STATUS,
        deliveredAt: null,
        processingMeta,
    })

    const failedMeta = []

    for (const transport of transports) {

        if (message.type !== 'REGISTER_NEW_USER') console.log('deliverMessage:', { messageId, message, transport })

        try {
            const adapter = TRANSPORTS[transport]
            const messageContext = await adapter.prepareMessageToSend(message)

            if (message.type !== 'REGISTER_NEW_USER') console.log('deliverMessage try:', { transport, message, messageContext })

            const [isOk, deliveryMetadata] = await _sendMessageByAdapter(transport, adapter, messageContext)

            if (isOk) {
                processingMeta.messageContext = messageContext
                processingMeta.deliveryMetadata = deliveryMetadata
                processingMeta.step = 'delivered'
                processingMeta.transport = transport
                break
            } else {
                console.error('Transport send result is not OK. Check deliveryMetadata', deliveryMetadata)
                failedMeta.push({
                    error: 'Transport send result is not OK. Check deliveryMetadata',
                    transport,
                    messageContext,
                    deliveryMetadata,
                })
            }
        } catch (e) {
            console.error(e)

            failedMeta.push({ transport, errorStack: e.stack, error: String(e) })
        }
    }

    // message delivered either directly or by fallback transport
    if (processingMeta.step === 'delivered') {
        await Message.update(keystone, message.id, {
            ...baseAttrs,
            status: MESSAGE_DELIVERED_STATUS,
            deliveredAt: new Date().toISOString(),
            processingMeta,
        })
    } else {
        await Message.update(keystone, message.id, {
            ...baseAttrs,
            status: MESSAGE_ERROR_STATUS,
            deliveredAt: null,
            processingMeta: failedMeta,
        })

        throw new Error(processingMeta.error)
        // TODO(pahaz): need to think about some repeat logic?
        //  at the moment we just throw the error to worker scheduler!
    }
}

module.exports = {
    deliverMessage: createTask('deliverMessage', deliverMessage),
}
