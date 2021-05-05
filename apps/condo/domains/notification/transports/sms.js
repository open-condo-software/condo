const fetch = require('node-fetch')

const conf = require('@core/config')

const { SMS_TRANSPORT } = require('../constants')
const { renderTemplate } = require('../templates')

const SMS_API_CONFIG = (conf.SMS_API_CONFIG) ? JSON.parse(conf.SMS_API_CONFIG) : null

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
    if (!SMS_API_CONFIG) throw new Error('no SMS_API_CONFIG')
    if (!/^[+]7[0-9]{10}$/g.test(phone)) throw new Error('unsupported phone number')
    const { api_url, token, from } = SMS_API_CONFIG

    const result = await fetch(
        // NOTE: &test=1 for testing
        `${api_url}/sms/send?api_id=${token}&to=${phone}&from=${from}&json=1`,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: `msg=${encodeURI(message)}`,
        })
    const json = await result.json()
    const status = json['status_code']
    const isOk = status === 100
    return [isOk, json]
}

module.exports = {
    prepareMessageToSend,
    send,
}
