const { z } = require('zod')

const { getLogger } = require('@open-condo/keystone/logging')

const {
    streamNameSchema,
    subjectPatternSchema,
    buildSubject,
    buildRelaySubscribeSubject,
    buildRelayUnsubscribeSubject,
    buildRelaySubscribePattern,
    buildRelayUnsubscribePattern,
    RELAY_SUBSCRIBE_PREFIX,
    RELAY_UNSUBSCRIBE_PREFIX,
} = require('./subject')

const logger = getLogger('nats')

/**
 * @typedef {Object} StreamAccessConfig
 * @property {boolean | string | ((args: { authentication: { item: Record<string, unknown> }, context: Record<string, unknown>, organizationId: string, subject: string }) => boolean | Promise<boolean>)} [read]
 */

/**
 * @typedef {Object} StreamConfig
 * @property {string} name
 * @property {number} ttl
 * @property {string[]} subjects
 * @property {'memory' | 'file'} storage
 * @property {'limits' | 'interest' | 'workqueue'} retention
 * @property {'old' | 'new'} discard
 * @property {number} maxConsumers
 * @property {string} [description]
 * @property {StreamAccessConfig} [access]
 */

/**
 * @typedef {Object} StreamRegistrationConfig
 * @property {string[]} [subjects]
 * @property {number} [ttl]
 * @property {'memory' | 'file'} [storage]
 * @property {'limits' | 'interest' | 'workqueue'} [retention]
 * @property {'old' | 'new'} [discard]
 * @property {number} [maxConsumers]
 * @property {string} [description]
 * @property {StreamAccessConfig} [access]
 */

class StreamRegistry {
    constructor () {
        /** @type {Map<string, StreamConfig>} */
        this.streams = new Map()
    }

    /**
     * @param {string} streamName
     * @param {StreamRegistrationConfig} config
     * @returns {StreamConfig}
     */
    register (streamName, config = {}) {
        try {
            streamNameSchema.parse(streamName)
        } catch (error) {
            if (error instanceof z.ZodError) {
                const errorMessage = error.issues.map((issue) => issue.message).join(', ')
                throw new Error(`Invalid stream name "${streamName}": ${errorMessage}`)
            }
            throw error
        }

        const subjects = config.subjects || [`${streamName}.>`]

        for (const subject of subjects) {
            try {
                subjectPatternSchema.parse(subject)
            } catch (error) {
                if (error instanceof z.ZodError) {
                    const errorMessage = error.issues.map((issue) => issue.message).join(', ')
                    throw new Error(`Invalid subject pattern "${subject}": ${errorMessage}`)
                }
                throw error
            }

            if (!subject.startsWith(streamName)) {
                throw new Error(
                    `Subject "${subject}" must start with stream name "${streamName}"`
                )
            }
        }

        /** @type {StreamConfig} */
        const streamConfig = {
            name: streamName,
            ttl: config.ttl || 3600,
            subjects,
            storage: config.storage || 'memory',
            retention: config.retention || 'interest',
            discard: config.discard || 'old',
            maxConsumers: config.maxConsumers !== undefined ? config.maxConsumers : -1,
            description: config.description,
            access: config.access,
        }

        this.streams.set(streamName, streamConfig)
        logger.info({ 
            msg: 'Stream registered', 
            stream: streamName, 
            ttl: streamConfig.ttl,
            description: streamConfig.description,
        })
        
        return streamConfig
    }

    /**
     * @param {string} streamName
     * @returns {boolean}
     */
    unregister (streamName) {
        const deleted = this.streams.delete(streamName)
        if (deleted) {
            logger.info({ msg: 'Stream unregistered', stream: streamName })
        }
        return deleted
    }

    /**
     * @param {string} streamName
     * @returns {StreamConfig | undefined}
     */
    get (streamName) {
        return this.streams.get(streamName)
    }

    /**
     * @returns {StreamConfig[]}
     */
    getAll () {
        return Array.from(this.streams.values())
    }

    /**
     * @param {{ connection: { jetstreamManager: () => Promise<any> } }} natsClient
     * @returns {Promise<{ created: string[], updated: string[], upToDate: string[], failed: string[] }>}
     */
    async initializeAll (natsClient) {
        const result = { created: [], updated: [], upToDate: [], failed: [] }

        if (!natsClient || !natsClient.connection) {
            logger.warn({ msg: 'NATS client not connected, skipping stream initialization' })
            return result
        }

        try {
            const jsm = await natsClient.connection.jetstreamManager()

            for (const config of this.streams.values()) {
                try {
                    const streamConfig = {
                        name: config.name,
                        subjects: config.subjects,
                        max_age: config.ttl * 1e9,
                        storage: config.storage,
                        retention: config.retention,
                        discard: config.discard,
                        max_consumers: config.maxConsumers,
                    }

                    let existing = null
                    try {
                        existing = await jsm.streams.info(config.name)
                    } catch {
                        // stream does not exist yet
                    }

                    if (!existing) {
                        await jsm.streams.add(streamConfig)
                        result.created.push(config.name)
                        logger.info({ msg: 'Stream created', stream: config.name })
                    } else {
                        const cur = existing.config
                        const needsUpdate =
                            JSON.stringify(cur.subjects) !== JSON.stringify(streamConfig.subjects) ||
                            cur.max_age !== streamConfig.max_age ||
                            cur.storage !== streamConfig.storage ||
                            cur.retention !== streamConfig.retention ||
                            cur.discard !== streamConfig.discard ||
                            cur.max_consumers !== streamConfig.max_consumers

                        if (needsUpdate) {
                            await jsm.streams.update(streamConfig)
                            result.updated.push(config.name)
                            logger.info({ msg: 'Stream updated', stream: config.name })
                        } else {
                            result.upToDate.push(config.name)
                            logger.info({ msg: 'Stream up to date', stream: config.name })
                        }
                    }
                } catch (error) {
                    result.failed.push(config.name)
                    logger.error({ msg: 'Failed to initialize stream', stream: config.name, err: error })
                }
            }
        } catch (error) {
            logger.error({ msg: 'Failed to initialize streams', err: error })
        }

        return result
    }

    /**
     * @param {{ connection: { jetstreamManager: () => Promise<any> } }} natsClient
     * @param {string} streamName
     * @returns {Promise<boolean>}
     */
    async deleteStream (natsClient, streamName) {
        if (!natsClient || !natsClient.connection) {
            logger.warn({ msg: 'NATS client not connected, skipping stream deletion' })
            return false
        }

        try {
            const jsm = await natsClient.connection.jetstreamManager()
            await jsm.streams.delete(streamName)
            this.streams.delete(streamName)
            logger.info({ msg: 'Stream deleted', stream: streamName })
            return true
        } catch (error) {
            logger.error({ msg: 'Failed to delete stream', stream: streamName, err: error })
            return false
        }
    }
}

const streamRegistry = new StreamRegistry()

module.exports = {
    streamRegistry,
    StreamRegistry,
    streamNameSchema,
    subjectPatternSchema,
    buildSubject,
    buildRelaySubscribeSubject,
    buildRelayUnsubscribeSubject,
    buildRelaySubscribePattern,
    buildRelayUnsubscribePattern,
    RELAY_SUBSCRIBE_PREFIX,
    RELAY_UNSUBSCRIBE_PREFIX,
}
