const { getLogger } = require('@open-condo/keystone/logging')
const { getSchemaCtx } = require('@open-condo/keystone/schema')

const { discoverServiceConsumers: discoverServiceConsumersMutation } = require('@condo/domains/resident/utils/serverSchema')

const DV_SENDER = { dv: 1, sender: { dv: 1, fingerprint: 'discoverServiceConsumersTask' } }
const logger = getLogger('discoverServiceConsumers')

/**
 * @param {DiscoverServiceConsumersInput} data
 * @returns {Promise<void>}
 */
async function discoverServiceConsumers (data) {
    const { keystone: context } = getSchemaCtx('Resident')

    try {
        const result = await discoverServiceConsumersMutation(context, { ...data, ...DV_SENDER })
        logger.info({ msg: 'Done', result })
    } catch (err) {
        logger.error({ msg: 'Error', err })
    }
}

module.exports = {
    discoverServiceConsumers,
}
