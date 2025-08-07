const fetch = require('node-fetch')
const { get } = require('lodash')

const { getLogger } = require('@open-condo/keystone/logging')

const conf = require('@open-condo/config')

const USER_DATA_WEBHOOK_URL = get(conf, 'USER_DATA_WEBHOOK_URL', null)

const logger = getLogger('sendUserDataWebhook')

async function sendUserDataWebhook (data) {
    if (!USER_DATA_WEBHOOK_URL) {
        return
    }

    try {
        const payload = {
            oldEmail: get(data, 'oldEmail', null),
            newEmail: get(data, 'newEmail', null),
            isEmailVerified: get(data, 'isEmailVerified', false),
            marketingConsent: get(data, 'marketingConsent', false),
        }

        const response = await fetch(USER_DATA_WEBHOOK_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        })

        if (!response.ok) {
            const errorBody = await response.text()
            logger.error({ msg: 'Failed to send user data webhook', status: response.status, body: errorBody, payload })
        } else {
            logger.info({ msg: 'User data webhook sent successfully', payload })
        }
    } catch (error) {
        logger.error({ msg: 'Error sending user data webhook', error, data })
    }
}

module.exports = {
    sendUserDataWebhook,
}
