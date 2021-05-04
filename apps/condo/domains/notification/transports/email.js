const fetch = require('node-fetch')
const FormData = require('form-data')

const conf = require('@core/config')

const { INVITE_NEW_EMPLOYEE_MESSAGE_TYPE } = require('../constants')

const EMAIL_API_CONFIG = (conf.EMAIL_API_CONFIG) ? JSON.parse(conf.EMAIL_API_CONFIG) : null

async function renderTemplate (message) {
    // TODO(pahaz): we need to decide where to store templates! HArDCODE!
    // TODO(pahaz): write the logic here!
    //  1) we should find message template by TYPE + LANG
    //  2) we should render the template and return transport context

    const serverUrl = conf.SERVER_URL
    if (message.type === INVITE_NEW_EMPLOYEE_MESSAGE_TYPE) {
        const { organizationName, inviteCode } = message.meta

        if (message.lang === 'en') {
            return {
                subject: 'You are invited to join organization as employee',
                text: `Organization "${organizationName}" invited you as employee.\n` +
                    `Click to the link to join: ${serverUrl}/auth/invite/${inviteCode}`,
            }
        } else if (message.lang === 'ru') {
            return {
                subject: 'Вас пригласили присоединиться к организации в качестве сотрудника',
                text: `Администратор организации "${organizationName}" приглашает вас в качестве сотрудника.\n` +
                    `Перейдите по ссылке, чтобы присоединиться: ${serverUrl}/auth/invite/${inviteCode}`,
            }
        }
    }

    throw new Error('unknown template or lang')
}

async function prepareMessageToSend (message) {
    const email = message.email || (message.user && message.user.email) || null
    if (!email) throw new Error('on email to send')

    const { subject, text, html } = await renderTemplate(message)

    return { to: email, subject, text, html }
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
