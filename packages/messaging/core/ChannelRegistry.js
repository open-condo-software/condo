const { getLogger } = require('@open-condo/keystone/logging')

const { CHANNEL_USER, CHANNEL_ORGANIZATION } = require('./topic')

const logger = getLogger()

/**
 * @typedef {Object} ChannelConfig
 * @property {string} name
 * @property {number} ttl
 * @property {string[]} subjects
 * @property {'memory' | 'file'} storage
 * @property {'limits' | 'interest' | 'workqueue'} retention
 * @property {'old' | 'new'} discard
 * @property {number} maxConsumers
 * @property {string} [description]
 */

const CHANNELS = [
    {
        name: CHANNEL_USER,
        ttl: 3600,
        subjects: [`${CHANNEL_USER}.>`],
        storage: 'memory',
        retention: 'interest',
        discard: 'old',
        maxConsumers: -1,
        description: 'Personal user channel for private data delivery',
    },
    {
        name: CHANNEL_ORGANIZATION,
        ttl: 3600,
        subjects: [`${CHANNEL_ORGANIZATION}.>`],
        storage: 'memory',
        retention: 'interest',
        discard: 'old',
        maxConsumers: -1,
        description: 'Organization channel for entity change notifications',
    },
]

/**
 * Initialize the two built-in channels (user, organization) on the given adapter.
 * @param {import('./BaseAdapter').BaseAdapter} adapter
 * @returns {Promise<{ created: string[], updated: string[], upToDate: string[], failed: string[] }>}
 */
async function initializeChannels (adapter) {
    const result = { created: [], updated: [], upToDate: [], failed: [] }

    if (!adapter || !adapter.connected) {
        logger.warn({ msg: 'Adapter not connected, skipping channel initialization' })
        return result
    }

    for (const config of CHANNELS) {
        try {
            const res = await adapter.ensureChannel(config)
            if (res.created) {
                result.created.push(config.name)
                logger.info({ msg: 'Channel created', channel: config.name })
            } else if (res.updated) {
                result.updated.push(config.name)
                logger.info({ msg: 'Channel updated', channel: config.name })
            } else {
                result.upToDate.push(config.name)
                logger.info({ msg: 'Channel up to date', channel: config.name })
            }
        } catch (error) {
            result.failed.push(config.name)
            logger.error({ msg: 'Failed to initialize channel', channel: config.name, err: error })
        }
    }

    return result
}

module.exports = {
    CHANNELS,
    initializeChannels,
}
