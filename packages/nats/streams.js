const { z } = require('zod')

const { getLogger } = require('@open-condo/keystone/logging')

const logger = getLogger('nats-streams')

/**
 * Stream naming conventions:
 * - Must be kebab-case (lowercase with hyphens)
 * - Must end with one of the allowed suffixes: -changes, -events, -notifications
 * - Must be 3-50 characters long
 * - Examples: ticket-changes, billing-events, system-notifications
 */
const streamNameSchema = z
    .string()
    .min(3, 'Stream name must be at least 3 characters long')
    .max(50, 'Stream name must be at most 50 characters long')
    .regex(
        /^[a-z][a-z0-9]*(-[a-z0-9]+)*-(changes|events|notifications)$/,
        'Stream name must be kebab-case and end with -changes, -events, or -notifications'
    )

/**
 * Subject pattern validation:
 * - Must start with stream name
 * - Can include wildcards: * (single token) or > (multiple tokens)
 * - Must use dot notation
 * - Examples: ticket-changes.123.>, billing-events.*.payment
 */
const subjectPatternSchema = z
    .string()
    .regex(
        /^[a-z][a-z0-9-]*(\.[a-z0-9-*>]+)*$/,
        'Subject must be dot-separated tokens in lowercase, with optional wildcards (* or >)'
    )

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
     * @returns {Promise<void>}
     */
    async initializeAll (natsClient) {
        if (!natsClient || !natsClient.connection) {
            logger.warn({ msg: 'NATS client not connected, skipping stream initialization' })
            return
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

                    await jsm.streams.add(streamConfig)
                    logger.info({ msg: 'Stream initialized', stream: config.name })
                } catch (error) {
                    if (error && error.message && error.message.includes('already in use')) {
                        logger.info({ msg: 'Stream already exists', stream: config.name })
                    } else {
                        logger.error({ msg: 'Failed to create stream', stream: config.name, err: error })
                    }
                }
            }
        } catch (error) {
            logger.error({ msg: 'Failed to initialize streams', err: error })
        }
    }
}

const streamRegistry = new StreamRegistry()

module.exports = { streamRegistry, StreamRegistry, streamNameSchema, subjectPatternSchema }
