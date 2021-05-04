const { createTask } = require('@core/keystone/tasks')
const { getSchemaCtx } = require('@core/keystone/schema')

const { Message } = require('@condo/domains/notification/utils/serverSchema')

const sms = require('./transports/sms')
const email = require('./transports/email')
const { SMS_TRANSPORT, EMAIL_TRANSPORT, MESSAGE_SENDING_STATUS, MESSAGE_RESENDING_STATUS, MESSAGE_PROCESSING_STATUS, MESSAGE_ERROR_STATUS, MESSAGE_DELIVERED_STATUS } = require('./constants')

const TRANSPORTS = {
    [SMS_TRANSPORT]: sms,
    [EMAIL_TRANSPORT]: email,
}

async function sendMessageByTransport (messageId, transport) {
    const { keystone } = await getSchemaCtx('Message')
    const messages = await Message.getAll(keystone, { id: messageId })
    const message = messages[0]

    if (message.id !== messageId) throw new Error('get message by id wrong result')
    if (message.status !== MESSAGE_SENDING_STATUS && message.status !== MESSAGE_RESENDING_STATUS) {
        return `already-${message.status}`
    }

    const baseAttrs = {
        // TODO(pahaz): it's better to use server side fingerprint?!
        dv: message.dv,
        sender: message.sender,
    }

    const processingMeta = { dv: 1, transport, step: 'init' }
    await Message.update(keystone, message.id, {
        ...baseAttrs,
        status: MESSAGE_PROCESSING_STATUS,
        deliveredAt: null,
        processingMeta,
    })

    try {
        const adapter = TRANSPORTS[transport]
        const context = await adapter.prepareMessageToSend(message)
        processingMeta.step = 'prepared'
        processingMeta.context = context

        await adapter.send(context)
        processingMeta.step = 'delivered'
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
    sendMessageByTransport: createTask('sendMessageByTransport', sendMessageByTransport),
}
