const { getLogger } = require('@open-condo/keystone/logging')
const { getSchemaCtx } = require('@open-condo/keystone/schema')
const { createTask } = require('@open-condo/keystone/tasks')

const { discoverServiceConsumers } = require('@condo/domains/resident/utils/serverSchema')

const DV_SENDER = { dv: 1, sender: { dv: 1, fingerprint: 'discoverServiceConsumersTask' } }
const logger = getLogger()

/**
 * @param {DiscoverServiceConsumersInput} data
 * @returns {Promise<void>}
 */
async function discoverServiceConsumersTask (data) {
    const { keystone: context } = getSchemaCtx('Resident')

    try {
        const result = await discoverServiceConsumers(context, { ...data, ...DV_SENDER })
        logger.info({ message: 'discoverServiceConsumers done', data: result })
    } catch (err) {
        logger.error({ message: 'discoverServiceConsumers fail', err })
    }
}

module.exports = {
    discoverServiceConsumersTask: createTask('discoverServiceConsumers', discoverServiceConsumersTask),
}
