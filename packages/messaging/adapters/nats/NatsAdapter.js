const { getLogger } = require('@open-condo/keystone/logging')

const { NatsAuthCalloutService } = require('./NatsAuthCalloutService')
const { NatsClient } = require('./NatsClient')
const { NatsSubscriptionRelay } = require('./NatsSubscriptionRelay')

const { BaseAdapter } = require('../../core/BaseAdapter')
const { ADMIN_REVOKE_PREFIX, ADMIN_UNREVOKE_PREFIX } = require('../../core/topic')

const logger = getLogger()

/**
 * NATS messaging adapter.
 * Implements the BaseAdapter interface for NATS + JetStream.
 */
class NatsAdapter extends BaseAdapter {
    constructor () {
        super()
        this.client = new NatsClient()
        this.authService = null
        this.relayService = null
    }

    async connect (config) {
        await this.client.connect(config)
    }

    async disconnect () {
        await this.client.close()
    }

    get connected () {
        return this.client.isConnected
    }

    async ensureChannel (channelConfig) {
        if (!this.client.connection) {
            throw new Error('NATS client not connected')
        }

        const jsm = await this.client.connection.jetstreamManager()

        const streamConfig = {
            name: channelConfig.name,
            subjects: channelConfig.topics,
            max_age: channelConfig.ttl * 1e9,
            storage: channelConfig.storage,
            retention: channelConfig.retention,
            discard: channelConfig.discard,
            max_consumers: channelConfig.maxConsumers,
        }

        let existing = null
        try {
            existing = await jsm.streams.info(channelConfig.name)
        } catch {
            // stream does not exist yet
        }

        if (!existing) {
            await jsm.streams.add(streamConfig)
            return { created: true, updated: false }
        }

        const cur = existing.config
        const needsUpdate =
            JSON.stringify(cur.subjects) !== JSON.stringify(streamConfig.subjects) ||
            cur.max_age !== streamConfig.max_age ||
            cur.storage !== streamConfig.storage ||
            cur.retention !== streamConfig.retention ||
            cur.discard !== streamConfig.discard ||
            cur.max_consumers !== streamConfig.max_consumers

        if (needsUpdate) {
            await jsm.streams.update(streamConfig.name, streamConfig)
            return { created: false, updated: true }
        }

        return { created: false, updated: false }
    }

    async deleteChannel (name) {
        if (!this.client.connection) {
            logger.warn({ msg: 'NATS client not connected, skipping channel deletion' })
            return false
        }

        try {
            const jsm = await this.client.connection.jetstreamManager()
            await jsm.streams.delete(name)
            logger.info({ msg: 'Channel deleted', channel: name })
            return true
        } catch (error) {
            logger.error({ msg: 'Failed to delete channel', channel: name, err: error })
            return false
        }
    }

    async publish (topic, data) {
        await this.client.publish(topic, data)
    }

    async subscribe (pattern, callback) {
        if (!this.client.connection) {
            throw new Error('NATS client not connected')
        }

        const sub = this.client.connection.subscribe(pattern)
        ;(async () => {
            for await (const msg of sub) {
                try {
                    const data = this.client.jsonCodec.decode(msg.data)
                    await callback(data, msg)
                } catch (error) {
                    logger.error({ msg: 'Error in subscription callback', pattern, err: error })
                }
            }
        })()

        return sub
    }

    async startAuthService (config) {
        this.authService = new NatsAuthCalloutService()
        await this.authService.start(config)
    }

    async stopAuthService () {
        if (this.authService) {
            await this.authService.stop()
            this.authService = null
        }
    }

    async startRelayService (config) {
        this.relayService = new NatsSubscriptionRelay()
        await this.relayService.start(config)
    }

    async stopRelayService () {
        if (this.relayService) {
            await this.relayService.stop()
            this.relayService = null
        }
    }

    /**
     * Revokes a user's messaging access across all services.
     * - Auth callout rejects future connection/reconnection attempts
     * - Relay service tears down existing relays and rejects new ones
     * @param {string} userId
     * @returns {number} Number of relays torn down
     */
    revokeUser (userId) {
        if (this.client?.connection && !this.client.connection.isClosed()) {
            this.client.connection.publish(`${ADMIN_REVOKE_PREFIX}.${userId}`)
            logger.info({ msg: 'Published revocation via NATS', userId })
        }
        if (this.authService) this.authService.revokeUser(userId)
        if (this.relayService) return this.relayService.revokeUser(userId)
        return 0
    }

    /**
     * Re-enables a previously revoked user's messaging access.
     * @param {string} userId
     */
    unrevokeUser (userId) {
        if (this.client?.connection && !this.client.connection.isClosed()) {
            this.client.connection.publish(`${ADMIN_UNREVOKE_PREFIX}.${userId}`)
        }
        if (this.authService) this.authService.unrevokeUser(userId)
        if (this.relayService) this.relayService.unrevokeUser(userId)
    }
}

module.exports = { NatsAdapter }
