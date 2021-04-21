const { createTask } = require('@core/keystone/tasks')
const sms = require('./transports/sms')
const email = require('./transports/email')
const { SMS_TRANSPORT, EMAIL_TRANSPORT } = require('./constants')

const TRANSPORTS = {
    [SMS_TRANSPORT]: sms,
    [EMAIL_TRANSPORT]: email,
}

async function sendMessageByTransport (messageId, transport) {
    const adapter = TRANSPORTS[transport]
    const context = await adapter.prepareMessageToSend(messageId)
    await adapter.send(context)
}

module.exports = {
    sendMessageByTransport: createTask('sendMessageByTransport', sendMessageByTransport),
}
