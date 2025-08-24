const conf = require('@open-condo/config')
const { fetch } = require('@open-condo/keystone/fetch')
const { getLogger } = require('@open-condo/keystone/logging')

const logger = getLogger('')

const USER_DATA_WEBHOOK_URL = conf.USER_DATA_WEBHOOK_URL ? JSON.parse(conf.USER_DATA_WEBHOOK_URL) : null

if (USER_DATA_WEBHOOK_URL && !USER_DATA_WEBHOOK_URL.emailMarketingFlow) {
    throw new Error('Wrong USER_DATA_WEBHOOK_URL value')
}

async function sendUserDataWebhook (data) {
    if (!USER_DATA_WEBHOOK_URL) {
        logger.error({ msg: 'USER_DATA_WEBHOOK_URL is blank or has incorrect value', data: USER_DATA_WEBHOOK_URL })
        return
    }

    try {
        await fetch(USER_DATA_WEBHOOK_URL.emailMarketingFlow, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        })

        logger.info({ msg: 'User data webhook sent successfully', data })
    } catch (error) {
        logger.error({ msg: 'Error sending user data webhook', error, data })
    }
}

module.exports = {
    sendUserDataWebhook,
}
