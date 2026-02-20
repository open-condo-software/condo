const { getLogger } = require('@open-condo/keystone/logging')

const { channelRegistry } = require('./ChannelRegistry')

const logger = getLogger()

let adapter = null
let isEnabled = false

/**
 * Initialize the messaging publisher with the given adapter.
 * @param {import('./BaseAdapter').BaseAdapter} messagingAdapter
 * @param {Object} [config]
 * @param {boolean} [config.enabled]
 * @returns {Promise<void>}
 */
const initializePublisher = async (messagingAdapter, config = {}) => {
    isEnabled = config.enabled !== false

    if (!isEnabled) {
        logger.info({ msg: 'Publisher disabled' })
        return
    }

    adapter = messagingAdapter

    if (!adapter.connected) {
        logger.warn({ msg: 'Adapter not connected, publisher will not publish' })
        isEnabled = false
        return
    }

    try {
        await channelRegistry.initializeAll(adapter)
        logger.info({ msg: 'Publisher initialized' })
    } catch (error) {
        logger.error({ msg: 'Failed to initialize publisher channels', err: error })
        isEnabled = false
    }
}

/**
 * Publish a message to a channel topic.
 * @param {Object} params
 * @param {string} params.channel - Channel name
 * @param {string} params.topic - Full topic string
 * @param {*} params.data - Message payload
 * @returns {Promise<void>}
 */
const publish = async ({ channel, topic, data }) => {
    if (!isEnabled || !adapter) {
        return
    }

    try {
        await adapter.publish(topic, data)
        logger.info({ msg: 'Published', topic, channel })
    } catch (error) {
        logger.error({ msg: 'Publish failed', err: error, channel, topic })
    }
}

const closePublisher = async () => {
    adapter = null
    isEnabled = false
}

module.exports = {
    initializePublisher,
    publish,
    closePublisher,
}
