const set = require('lodash/set')

const conf = require('@open-condo/config')
const { getLogger } = require('@open-condo/keystone/logging')
const { getSchemaCtx } = require('@open-condo/keystone/schema')
const { createTask } = require('@open-condo/keystone/tasks')

const { discoverServiceConsumers } = require('@condo/domains/resident/utils/serverSchema')

const DV_SENDER = { dv: 1, sender: { dv: 1, fingerprint: 'discoverServiceConsumersTask' } }
const logger = getLogger('notifyResidentsAboutNewsItem')

let isTestFeatureFlagOn = conf.NODE_ENV === 'test'

/**
 * @param {boolean} val
 */
const setFeatureFlag = (val) => {
    isTestFeatureFlagOn = val
}

/**
 * @returns {boolean}
 */
const getFeatureFlag = () => {
    return isTestFeatureFlagOn
}

/**
 * @param {DiscoverServiceConsumersInput} data
 * @returns {Promise<void>}
 */
async function discoverServiceConsumersTask (data) {
    const { keystone: context } = getSchemaCtx('Resident')

    if (conf.NODE_ENV === 'test') {
        set(context, ['req', 'headers', 'feature-flags'], isTestFeatureFlagOn ? 'true' : 'false')
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
    setFeatureFlag,
    getFeatureFlag,
}
