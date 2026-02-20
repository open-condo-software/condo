const { z } = require('zod')

const { getLogger } = require('@open-condo/keystone/logging')

const {
    channelNameSchema,
    topicPatternSchema,
    buildTopic,
    buildRelaySubscribeTopic,
    buildRelayUnsubscribeTopic,
    buildRelaySubscribePattern,
    buildRelayUnsubscribePattern,
    RELAY_SUBSCRIBE_PREFIX,
    RELAY_UNSUBSCRIBE_PREFIX,
} = require('./topic')

const logger = getLogger()

/**
 * @typedef {Object} ChannelAccessConfig
 * @property {boolean | string | ((args: { authentication: { item: Record<string, unknown> }, context: Record<string, unknown>, organizationId: string, topic: string }) => boolean | Promise<boolean>)} [read]
 */

/**
 * @typedef {Object} ChannelConfig
 * @property {string} name
 * @property {number} ttl
 * @property {string[]} topics
 * @property {'memory' | 'file'} storage
 * @property {'limits' | 'interest' | 'workqueue'} retention
 * @property {'old' | 'new'} discard
 * @property {number} maxConsumers
 * @property {string} [description]
 * @property {ChannelAccessConfig} [access]
 */

/**
 * @typedef {Object} ChannelRegistrationConfig
 * @property {string[]} [topics]
 * @property {number} [ttl]
 * @property {'memory' | 'file'} [storage]
 * @property {'limits' | 'interest' | 'workqueue'} [retention]
 * @property {'old' | 'new'} [discard]
 * @property {number} [maxConsumers]
 * @property {string} [description]
 * @property {ChannelAccessConfig} [access]
 */

class ChannelRegistry {
    constructor () {
        /** @type {Map<string, ChannelConfig>} */
        this.channels = new Map()
    }

    /**
     * @param {string} channelName
     * @param {ChannelRegistrationConfig} config
     * @returns {ChannelConfig}
     */
    register (channelName, config = {}) {
        try {
            channelNameSchema.parse(channelName)
        } catch (error) {
            if (error instanceof z.ZodError) {
                const errorMessage = error.issues.map((issue) => issue.message).join(', ')
                throw new Error(`Invalid channel name "${channelName}": ${errorMessage}`)
            }
            throw error
        }

        const topics = config.topics || [`${channelName}.>`]

        for (const topic of topics) {
            try {
                topicPatternSchema.parse(topic)
            } catch (error) {
                if (error instanceof z.ZodError) {
                    const errorMessage = error.issues.map((issue) => issue.message).join(', ')
                    throw new Error(`Invalid topic pattern "${topic}": ${errorMessage}`)
                }
                throw error
            }

            if (!topic.startsWith(channelName)) {
                throw new Error(
                    `Topic "${topic}" must start with channel name "${channelName}"`
                )
            }
        }

        /** @type {ChannelConfig} */
        const channelConfig = {
            name: channelName,
            ttl: config.ttl || 3600,
            topics,
            storage: config.storage || 'memory',
            retention: config.retention || 'interest',
            discard: config.discard || 'old',
            maxConsumers: config.maxConsumers !== undefined ? config.maxConsumers : -1,
            description: config.description,
            access: config.access,
        }

        this.channels.set(channelName, channelConfig)
        logger.info({
            msg: 'Channel registered',
            channel: channelName,
            ttl: channelConfig.ttl,
            description: channelConfig.description,
        })

        return channelConfig
    }

    /**
     * @param {string} channelName
     * @returns {boolean}
     */
    unregister (channelName) {
        const deleted = this.channels.delete(channelName)
        if (deleted) {
            logger.info({ msg: 'Channel unregistered', channel: channelName })
        }
        return deleted
    }

    /**
     * @param {string} channelName
     * @returns {ChannelConfig | undefined}
     */
    get (channelName) {
        return this.channels.get(channelName)
    }

    /**
     * @returns {ChannelConfig[]}
     */
    getAll () {
        return Array.from(this.channels.values())
    }

    /**
     * Initialize all registered channels on the given adapter.
     * @param {import('./BaseAdapter').BaseAdapter} adapter
     * @returns {Promise<{ created: string[], updated: string[], upToDate: string[], failed: string[] }>}
     */
    async initializeAll (adapter) {
        const result = { created: [], updated: [], upToDate: [], failed: [] }

        if (!adapter || !adapter.connected) {
            logger.warn({ msg: 'Adapter not connected, skipping channel initialization' })
            return result
        }

        for (const config of this.channels.values()) {
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
}

const channelRegistry = new ChannelRegistry()

module.exports = {
    channelRegistry,
    ChannelRegistry,
    channelNameSchema,
    topicPatternSchema,
    buildTopic,
    buildRelaySubscribeTopic,
    buildRelayUnsubscribeTopic,
    buildRelaySubscribePattern,
    buildRelayUnsubscribePattern,
    RELAY_SUBSCRIBE_PREFIX,
    RELAY_UNSUBSCRIBE_PREFIX,
}
