const fetch = require('node-fetch')
const FormData = require('form-data')

const conf = require('@core/config')

const EMAIL_API_CONFIG = (conf.EMAIL_API_CONFIG) ? JSON.parse(conf.EMAIL_API_CONFIG) : null

async function prepareMessageToSend (messageId) {
    // TODO(pahaz): write the logic here!
    return { to: 'pahaz@example.com', subject: 'test', text: 'Hi!' }
}

async function send ({ to, cc, bcc, subject, text, html } = {}) {
    if (!EMAIL_API_CONFIG) throw new Error('no EMAIL_API_CONFIG')
    if (!to || !to.includes('@')) throw new Error('unsupported to argument format')
    if (!subject) throw new Error('no subject argument')
    if (!text) throw new Error('no text argument')
    const { api_url, token, from } = EMAIL_API_CONFIG
    const form = new FormData()
    form.append('from', from)
    form.append('to', to)
    form.append('subject', subject)
    form.append('text', text)
    if (cc) form.append('cc', cc)
    if (bcc) form.append('bcc', bcc)
    if (html) form.append('html', html)

    const auth = `api:${token}`
    const result = await fetch(
        api_url,
        {
            method: 'POST',
            body: form,
            headers: {
                ...form.getHeaders(),
                'Authorization': `Basic ${Buffer.from(auth).toString('base64')}`,
            },
        })
    const status = result.status
    const json = await result.json()
    const isOk = status === 200
    return [isOk, json]
}

module.exports = {
    prepareMessageToSend,
    send,
}
