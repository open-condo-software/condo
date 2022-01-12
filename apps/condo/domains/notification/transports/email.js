const fetch = require('node-fetch')
const FormData = require('form-data')

const conf = require('@core/config')

const { EMAIL_TRANSPORT } = require('../constants')
const { renderTemplate } = require('../templates')

const EMAIL_API_CONFIG = conf.EMAIL_API_CONFIG ? JSON.parse(conf.EMAIL_API_CONFIG) : null

async function prepareMessageToSend(message) {
    const email = message.email || (message.user && message.user.email) || null
    if (!email) throw new Error('on email to send')

    const { subject, text, html } = await renderTemplate(EMAIL_TRANSPORT, message)

    return { to: email, subject, text, html }
}

/**
 * Send a email message by remote API service
 *
 * @param {Object} args - send email arguments
 * @param {string} args.to - Email address `To` recipient(s). Example: "Bob <bob@host.com>". You can use commas to separate multiple recipients.
 * @param {string} args.cc - Email address for `Cc` (Carbon Copy)
 * @param {string} args.bcc - Email address for `Bcc` (Blind Carbon Copy)
 * @param {string} args.subject - Message subject
 * @param {string} args.text - Body of the message. (text version)
 * @param {string} args.html - Body of the message. (HTML version)
 * @typedef {[boolean, Object]} StatusAndMetadata
 * @return {StatusAndMetadata} Status and delivery Metadata (debug only)
 */
async function send({ to, cc, bcc, subject, text, html } = {}) {
    if (!EMAIL_API_CONFIG) throw new Error('no EMAIL_API_CONFIG')
    if (!to || !to.includes('@')) throw new Error('unsupported to argument format')
    if (!subject) throw new Error('no subject argument')
    if (!text && !html) throw new Error('no text or html argument')
    const { api_url, token, from } = EMAIL_API_CONFIG
    const form = new FormData()
    form.append('from', from)
    form.append('to', to)
    form.append('subject', subject)
    if (text) form.append('text', text)
    if (cc) form.append('cc', cc)
    if (bcc) form.append('bcc', bcc)
    if (html) form.append('html', html)

    const auth = `api:${token}`
    const result = await fetch(api_url, {
        method: 'POST',
        body: form,
        headers: {
            ...form.getHeaders(),
            Authorization: `Basic ${Buffer.from(auth).toString('base64')}`,
        },
    })
    const status = result.status

    let context, isSent
    if (status === 200) {
        isSent = true
        context = await result.json()
    } else {
        const text = await result.text()
        isSent = false
        context = { text, status }
    }
    return [isSent, context]
}

module.exports = {
    prepareMessageToSend,
    send,
}
