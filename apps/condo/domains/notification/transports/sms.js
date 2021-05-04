const fetch = require('node-fetch')

const conf = require('@core/config')

const { INVITE_NEW_EMPLOYEE_MESSAGE_TYPE } = require('../constants')

const SMS_API_CONFIG = (conf.SMS_API_CONFIG) ? JSON.parse(conf.SMS_API_CONFIG) : null

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
                text: `Organization "${organizationName}" invited you as employee.\n` +
                    `Follow the link: ${serverUrl}/auth/invite/${inviteCode}`,
            }
        } else if (message.lang === 'ru') {
            return {
                text: `Администратор организации "${organizationName}" приглашает вас в качестве сотрудника.\n` +
                    `Перейдите по ссылке: ${serverUrl}/auth/invite/${inviteCode}`,
            }
        }
    }

    throw new Error('unknown template or lang')
}

async function prepareMessageToSend (message) {
    const phone = message.phone || (message.user && message.user.phone) || null
    if (!phone) throw new Error('on phone to send')

    const { text } = await renderTemplate(message)

    return { phone, message: text }
}

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
