const conf = require('@core/config')
const { createTask } = require('@core/keystone/tasks')
const { getSchemaCtx } = require('@core/keystone/schema')

const { Message } = require('@condo/domains/notification/utils/serverSchema')
const isEmpty = require('lodash/isEmpty')
const sms = require('./transports/sms')
const email = require('./transports/email')
const push = require('./transports/push')
const { SMS_TRANSPORT, EMAIL_TRANSPORT, PUSH_TRANSPORT, MESSAGE_SENDING_STATUS, MESSAGE_RESENDING_STATUS, MESSAGE_PROCESSING_STATUS, MESSAGE_ERROR_STATUS, MESSAGE_DELIVERED_STATUS } = require('./constants/constants')

const SEND_TO_CONSOLE = conf.NOTIFICATION__SEND_ALL_MESSAGES_TO_CONSOLE || false
const DISABLE_LOGGING = conf.NOTIFICATION__DISABLE_LOGGING || false

const TRANSPORTS = {
    [SMS_TRANSPORT]: sms,
    [EMAIL_TRANSPORT]: email,
    [PUSH_TRANSPORT]: push,
}

async function _sendMessageByAdapter (transport, adapter, messageContext) {
    if (SEND_TO_CONSOLE) {
        if (!DISABLE_LOGGING) console.info(`MESSAGE by ${transport.toUpperCase()} ADAPTER: ${JSON.stringify(messageContext)}`)
        return [true, { fakeAdapter: true }]
    }
    return await adapter.send(messageContext)
}



async function _choseMessageTransport (message) {
    const { phone, user, email } = message

    if (!isEmpty(phone)) {
        return SMS_TRANSPORT
    }
    // TODO(pahaz): we should chose the best transport for the message.
    //  We can chose transport depends on the message.type?
    //  or use something like message.user.profile.preferredNotificationTransport if user want to get messages from TG
    if (!isEmpty(email) || !isEmpty(user.email)) {
        return EMAIL_TRANSPORT
    }
    return PUSH_TRANSPORT
}

const MESSAGE_SENDING_STATUSES = {
    MESSAGE_SENDING_STATUS: true,
    MESSAGE_RESENDING_STATUS: true,
}

async function deliveryMessage (messageId) {
    const { keystone } = await getSchemaCtx('Message')
    const message = await Message.getOne(keystone, { id: messageId })

    if (!message || message.id !== messageId) throw new Error('get message by id has wrong result')
    if (MESSAGE_SENDING_STATUSES[message.status]) return `already-${message.status}`

    const transport = await _choseMessageTransport(message)
    // TODO(pahaz): it's better to use server side fingerprint?!
    const baseAttrs = { dv: message.dv, sender: message.sender }
    const processingMeta = { dv: 1, transport, step: 'init' }

    await Message.update(keystone, message.id, {
        ...baseAttrs,
        status: MESSAGE_PROCESSING_STATUS,
        deliveredAt: null,
        processingMeta,
    })

    try {
        const adapter = TRANSPORTS[transport]
        const messageContext = await adapter.prepareMessageToSend(message)
        processingMeta.step = 'prepared'
        processingMeta.messageContext = messageContext

        const [isOk, deliveryMetadata] = await _sendMessageByAdapter(transport, adapter, messageContext)
        processingMeta.deliveryMetadata = deliveryMetadata
        processingMeta.step = (isOk) ? 'delivered' : 'notDelivered'
        if (!isOk) throw Error('Transport send result is not OK. Check deliveryMetadata')
    } catch (e) {
        console.error(e)
        processingMeta.error = e.stack || String(e)

        await Message.update(keystone, message.id, {
            ...baseAttrs,
            status: MESSAGE_ERROR_STATUS,
            deliveredAt: null,
            processingMeta,
        })

        throw e
    }

    // update meta
    await Message.update(keystone, message.id, {
        ...baseAttrs,
        status: MESSAGE_DELIVERED_STATUS,
        deliveredAt: new Date().toISOString(),
        processingMeta,
    })

    if (processingMeta.error) {
        throw new Error(processingMeta.error)
        // TODO(pahaz): need to think about some repeat logic?
        //  at the moment we just throw the error to worker scheduler!
    }
}

module.exports = {
    deliveryMessage: createTask('deliveryMessage', deliveryMessage),
}
