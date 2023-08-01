const set = require('lodash/set')

const conf = require('@open-condo/config')
const { getLogger } = require('@open-condo/keystone/logging')
const { getSchemaCtx } = require('@open-condo/keystone/schema')
const { createTask } = require('@open-condo/keystone/tasks')
const { getIsFeatureFlagsEnabled } = require('@open-condo/keystone/test.utils')

const { discoverServiceConsumers } = require('@condo/domains/resident/utils/serverSchema')

const DV_SENDER = { dv: 1, sender: { dv: 1, fingerprint: 'discoverServiceConsumersTask' } }
const logger = getLogger('notifyResidentsAboutNewsItem')

/**
 * @param {DiscoverServiceConsumersInput} data
 * @returns {Promise<void>}
 */
async function discoverServiceConsumersTask (data) {
    const { keystone: context } = getSchemaCtx('Resident')

    if (conf.NODE_ENV === 'test') {
        set(context, ['req', 'headers', 'feature-flags'], getIsFeatureFlagsEnabled() ? 'true' : 'false')
    }

    try {
        const result = await discoverServiceConsumers(context, { ...data, ...DV_SENDER })
        logger.info({ message: 'discoverServiceConsumers done', result })
    } catch (err) {
        logger.error({ message: 'discoverServiceConsumers fail', err })
    }
}

module.exports = {
    discoverServiceConsumersTask: createTask('discoverServiceConsumers', discoverServiceConsumersTask, { priority: 10 }),
}
