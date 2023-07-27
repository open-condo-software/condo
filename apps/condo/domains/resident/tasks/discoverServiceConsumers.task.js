const { getLogger } = require('@open-condo/keystone/logging')
const { getSchemaCtx } = require('@open-condo/keystone/schema')
const { createTask } = require('@open-condo/keystone/tasks')

const { discoverServiceConsumers } = require('@condo/domains/resident/utils/serverSchema')

const DV_SENDER = { dv: 1, sender: { dv: 1, fingerprint: 'discoverServiceConsumersTask' } }
const logger = getLogger('notifyResidentsAboutNewsItem')

/**
 * @param {DiscoverServiceConsumersInput} data
 * @returns {Promise<void>}
 */
async function discoverServiceConsumersTask (data) {
    const { keystone: context } = await getSchemaCtx('Resident')
    await discoverServiceConsumers(context, { ...data, ...DV_SENDER })

    // TODO(DOMA-6556): TESTS
    // TODO(DOMA-6556): PREVENT QUEUE OVERLOADING
}

module.exports = createTask('discoverServiceConsumers', discoverServiceConsumersTask, { priority: 2 })
