const { get } = require('lodash')

const conf = require('@open-condo/config')
const { getLogger } = require('@open-condo/keystone/logging')
const { getById } = require('@open-condo/keystone/schema')


const logger = getLogger()
const MARKETING_WEBHOOKS_URL = (conf.MARKETING_WEBHOOKS_URL) ? JSON.parse(conf.MARKETING_WEBHOOKS_URL) : null
if (MARKETING_WEBHOOKS_URL && !MARKETING_WEBHOOKS_URL.organizations) {
    throw new Error('Wrong MARKETING_WEBHOOKS_URL value')
}

async function pushEmailDataToMarketingAdapter () {
    if (!MARKETING_WEBHOOKS_URL) {
        logger.error({ msg: 'MARKETING_WEBHOOKS_URL is blank or has incorrect value', data: MARKETING_WEBHOOKS_URL })
        return
    }
    const { tin, name: orgName, createdBy } = organization
    const fingerprint = get(organization, ['sender', 'fingerprint'])
    const { phone: userPhone, name: userName, email } = await getById('User', createdBy.id)
    try {
        const data = {
            orgName,
            userName,
            userPhone,
            tin,
            email,
            fromSbbol: fingerprint === SBBOL_FINGERPRINT_NAME,
        }
        await axios.post(MARKETING_WEBHOOKS_URL.organizations, data)
        logger.info({ msg: 'Posted data to marketing adapter', url: MARKETING_WEBHOOKS_URL.organizations, data })
    } catch (err) {
        logger.warn({ msg: 'Request to marketing adapter failed', err })
    }
}

module.exports = {
    pushEmailDataToMarketingAdapter,
}