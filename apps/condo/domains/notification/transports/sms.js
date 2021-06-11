const { SMS_TRANSPORT } = require('../constants')
const { renderTemplate } = require('../templates')

const { SMSAdapter } = require('@condo/domains/notification/adapters/smsAdapter')

async function prepareMessageToSend (message) {
    const phone = message.phone || (message.user && message.user.phone) || null
    if (!phone) throw new Error('on phone to send')

    const { text } = await renderTemplate(SMS_TRANSPORT, message)

    return { phone, message: text }
}

/**
 * Send a SMS message by remote API service
 *
 * @param {Object} args - send sms arguments
 * @param {string} args.phone - Phone number to send to. Example: "+79068088888"
 * @param {string} args.message - Message text
 * @typedef {[boolean, Object]} StatusAndMetadata
 * @return {StatusAndMetadata} Status and delivery Metadata (debug only)
 */
async function send ({ phone, message } = {}) {
    const Adapter = new SMSAdapter()
    const result = await Adapter.send({ phone, message })
    return result
}

module.exports = {
    prepareMessageToSend,
    send,
}
