const { get } = require('lodash')

const { SMSAdapter } = require('@condo/domains/notification/adapters/smsAdapter')

const { SMS_TRANSPORT } = require('../constants/constants')
const { renderTemplate } = require('../templates')


async function prepareMessageToSend (message) {
    const phone = get(message, 'phone') || get(message, ['user', 'phone']) || null

    if (!phone) throw new Error('no phone to send SMS')

    const { text } = await renderTemplate(SMS_TRANSPORT, message)

    return { phone, message: text, meta: message.meta }
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
async function send ({ phone, message, meta } = {}) {
    const Adapter = new SMSAdapter()

    return await Adapter.send({ phone, message, meta })
}

module.exports = {
    prepareMessageToSend,
    send,
}
