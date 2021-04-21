const fetch = require('node-fetch')

const conf = require('@core/config')

const SMS_API_CONFIG = (conf.SMS_API_CONFIG) ? JSON.parse(conf.SMS_API_CONFIG) : null

async function prepareMessageToSend (messageId) {
    // TODO(pahaz): write the logic here!
    return { phone: '+79068888888', message: 'hello!' }
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
