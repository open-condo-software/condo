const get = require('lodash/get')

const { EmailAdapter } = require('@condo/domains/notification/adapters/emailAdapter')

const { EMAIL_TRANSPORT } = require('../constants/constants')
const { renderTemplate } = require('../templates')


const MAX_TAG_LENGTH = 128

async function prepareMessageToSend (message) {
    const email = get(message, 'email') || get(message, ['user', 'email']) || null

    if (!email) throw new Error('no email to send message')

    const { subject, text, html } = await renderTemplate(EMAIL_TRANSPORT, message)

    const messageType = message.type.slice(0, MAX_TAG_LENGTH)

    return { to: email, emailFrom: message.emailFrom, subject, text, html, meta: message.meta, messageType }
}

/**
 * Send a email message by remote API service
 *
 * Provider is selected via `EMAIL_API_CONFIG.type`
 * See `adapters/emailAdapter.js` and notification domain README for configuration.
 *
 * @param {Object} args - send email arguments
 * @param {string} args.to - Email address `To` recipient(s). Example: "Bob <bob@host.com>". You can use commas to separate multiple recipients.
 * @param {string?} args.emailFrom - The sender's email address. Examples: 'Vasiliy <pupkin@mailforspam.com>', 'duduka@example.com'.
 * @param {string} args.cc - Email address for `Cc` (Carbon Copy)
 * @param {string} args.bcc - Email address for `Bcc` (Blind Carbon Copy)
 * @param {string} args.subject - Message subject
 * @param {string} args.text - Body of the message. (text version)
 * @param {string} args.html - Body of the message. (HTML version)
 * @param {object} args.meta - The `message.meta` field
 * @param {object} args.messageType - we use message type as tag
 * @typedef {[boolean, Object]} StatusAndMetadata
 * @return {StatusAndMetadata} Status and delivery Metadata (debug only)
 */
async function send ({ to, emailFrom = null, cc, bcc, subject, text, html, meta, messageType } = {}) {
    const adapter = new EmailAdapter()

    return await adapter.send({ to, emailFrom, cc, bcc, subject, text, html, meta, messageType })
}

module.exports = {
    prepareMessageToSend,
    send,
}
