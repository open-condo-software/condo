const { connect, JSONCodec } = require('nats')

const conf = require('@open-condo/config')
const { getLogger } = require('@open-condo/keystone/logging')

const {
    CHANNEL_DEFINITIONS_BY_NAME,
    ADMIN_REVOKE_PREFIX,
    ADMIN_UNREVOKE_PREFIX,
    buildRelaySubscribePattern,
    buildRelayUnsubscribePattern,
} = require('../../core/topic')

const logger = getLogger()

const MESSAGING_CONFIG = conf.MESSAGING_CONFIG ? JSON.parse(conf.MESSAGING_CONFIG) : {}

const RELAY_QUEUE_GROUP = 'messaging-relay'
const DEFAULT_RELAY_TTL_MS = 5 * 60 * 1000
const DEFAULT_CLEANUP_INTERVAL_MS = 60 * 1000

/**
 * Server-side subscription relay service.
 *
 * Since NATS does not enforce SUB permissions in auth_callout non-operator mode,
 * this service uses PUB permissions (which ARE enforced) as the access control mechanism.
 *
 * Flow:
 * 1. Client publishes to `_MESSAGING.subscribe.user.<userId>.<entity>` or
 *    `_MESSAGING.subscribe.organization.<orgId>.<entity>` with `{ deliverInbox }` in body
 *    - PUB permission for these topics is user/org-scoped → NATS enforces it
 * 2. This service receives the request, subscribes to the actual topic on behalf of the client
 * 3. Forwards matching messages to the client's `deliverInbox`
 * 4. Client publishes to `_MESSAGING.unsubscribe.{relayId}` to stop
 */
class NatsSubscriptionRelay {
    constructor () {
        this.connection = null
        this.isRunning = false
        this.relays = new Map()
        this.userRelays = new Map()
        this.revokedUsers = new Set()
        this.relayCounter = 0
        this.jc = JSONCodec()
        this._cleanupTimer = null
        this.relayTtlMs = DEFAULT_RELAY_TTL_MS
    }

    async start (config = {}) {
        try {
            if (config.relayTtlMs !== undefined) {
                this.relayTtlMs = config.relayTtlMs
            }

            this.connection = await connect({
                servers: config.url || MESSAGING_CONFIG.brokerUrl,
                user: config.user || MESSAGING_CONFIG.serverUser,
                pass: config.pass || MESSAGING_CONFIG.serverPassword,
                name: 'subscription-relay',
                reconnect: true,
                maxReconnectAttempts: -1,
            })

            this.isRunning = true

            this._startCleanupTimer(config.cleanupIntervalMs || DEFAULT_CLEANUP_INTERVAL_MS)

            const subscribeSub = this.connection.subscribe(buildRelaySubscribePattern(), { queue: RELAY_QUEUE_GROUP })
            const unsubscribeSub = this.connection.subscribe(buildRelayUnsubscribePattern(), { queue: RELAY_QUEUE_GROUP })

            ;(async () => {
                for await (const msg of subscribeSub) {
                    try {
                        this._handleSubscribeRequest(msg)
                    } catch (error) {
                        logger.error({ msg: 'Error handling subscribe request', err: error })
                    }
                }
            })()

            ;(async () => {
                for await (const msg of unsubscribeSub) {
                    try {
                        this._handleUnsubscribeRequest(msg)
                    } catch (error) {
                        logger.error({ msg: 'Error handling unsubscribe request', err: error })
                    }
                }
            })()

            const revokeSub = this.connection.subscribe(`${ADMIN_REVOKE_PREFIX}.>`)
            ;(async () => {
                for await (const msg of revokeSub) {
                    const userId = msg.subject.slice(ADMIN_REVOKE_PREFIX.length + 1)
                    if (userId) this.revokeUser(userId)
                }
            })()

            const unrevokeSub = this.connection.subscribe(`${ADMIN_UNREVOKE_PREFIX}.>`)
            ;(async () => {
                for await (const msg of unrevokeSub) {
                    const userId = msg.subject.slice(ADMIN_UNREVOKE_PREFIX.length + 1)
                    if (userId) this.unrevokeUser(userId)
                }
            })()

            this.connection.closed().then((err) => {
                this.isRunning = false
                this._cleanupAll()
                if (err) {
                    logger.error({ msg: 'Relay connection closed with error', err })
                }
            })

        } catch (error) {
            logger.error({ msg: 'Failed to start subscription relay service', err: error })
            throw error
        }
    }

    _handleSubscribeRequest (msg) {
        const parts = msg.subject.split('.')
        // _MESSAGING.subscribe.<channel>.<id>[.<entity>]
        if (parts.length < 4) {
            logger.warn({ msg: 'Invalid subscribe request topic', topic: msg.subject })
            return
        }

        const channel = parts[2]
        const channelDef = CHANNEL_DEFINITIONS_BY_NAME[channel]
        if (!channelDef) {
            logger.warn({ msg: 'Unknown channel in subscribe request', channel, topic: msg.subject })
            return
        }

        const channelParts = parts.slice(3)
        const actualTopic = channelDef.buildActualTopic(channelParts)
        const userId = channelDef.extractUserId(channelParts)

        let data
        try {
            data = this.jc.decode(msg.data)
        } catch {
            logger.warn({ msg: 'Invalid subscribe request body' })
            return
        }

        const { deliverInbox, requestingUserId } = data
        if (!deliverInbox) {
            logger.warn({ msg: 'Missing deliverInbox in subscribe request' })
            return
        }

        if (typeof deliverInbox !== 'string' || !deliverInbox.startsWith('_INBOX.')) {
            logger.warn({ msg: 'Invalid deliverInbox format', deliverInbox })
            return
        }

        if ((userId && this.revokedUsers.has(userId)) || (requestingUserId && this.revokedUsers.has(requestingUserId))) {
            logger.warn({ msg: 'Relay request rejected for revoked user', userId })
            if (msg.reply) {
                this.connection.publish(msg.reply, this.jc.encode({ status: 'error', reason: 'access revoked' }))
            }
            return
        }

        const relayId = `relay-${++this.relayCounter}`

        const channelSub = this.connection.subscribe(actualTopic)
        const relay = {
            id: relayId,
            channel,
            userId,
            requestingUserId: requestingUserId || userId || null,
            deliverInbox,
            actualTopic,
            subscription: channelSub,
            createdAt: Date.now(),
        }

        this.relays.set(relayId, relay)
        const trackingUserId = relay.requestingUserId || userId
        if (trackingUserId) {
            if (!this.userRelays.has(trackingUserId)) {
                this.userRelays.set(trackingUserId, new Set())
            }
            this.userRelays.get(trackingUserId).add(relayId)
        }

        (async () => {
            for await (const channelMsg of channelSub) {
                try {
                    this.connection.publish(deliverInbox, channelMsg.data)
                } catch (error) {
                    logger.error({ msg: 'Error forwarding message', relayId, err: error })
                }
            }
            this.relays.delete(relayId)
        })()

        if (msg.reply) {
            this.connection.publish(msg.reply, this.jc.encode({ relayId, status: 'ok' }))
        }

    }

    _handleUnsubscribeRequest (msg) {
        const parts = msg.subject.split('.')
        // _MESSAGING.unsubscribe.<userId>.<relayId>
        if (parts.length < 4) {
            logger.warn({ msg: 'Invalid unsubscribe request topic', topic: msg.subject })
            return
        }

        const userId = parts[2]
        const relayId = parts[3]

        const relay = this.relays.get(relayId)
        if (relay && relay.requestingUserId !== userId) {
            logger.warn({ msg: 'Unsubscribe rejected: relay does not belong to user', relayId, userId })
            return
        }

        this._removeRelay(relayId)

        if (msg.reply) {
            this.connection.publish(msg.reply, this.jc.encode({ status: 'ok' }))
        }
    }

    _removeRelay (relayId) {
        const relay = this.relays.get(relayId)
        if (!relay) return false

        relay.subscription.unsubscribe()
        this.relays.delete(relayId)

        const trackingUserId = relay.requestingUserId || relay.userId
        if (trackingUserId) {
            const userSet = this.userRelays.get(trackingUserId)
            if (userSet) {
                userSet.delete(relayId)
                if (userSet.size === 0) {
                    this.userRelays.delete(trackingUserId)
                }
            }
        }

        return true
    }

    /**
     * Immediately revokes all relay subscriptions for a given user.
     * Call this when a user is deleted, blocked, or loses access.
     * @param {string} userId
     * @returns {number} Number of relays revoked
     */
    revokeUser (userId) {
        this.revokedUsers.add(userId)

        const relayIds = this.userRelays.get(userId)
        if (!relayIds || relayIds.size === 0) return 0

        const ids = [...relayIds]
        let count = 0
        for (const relayId of ids) {
            if (this._removeRelay(relayId)) count++
        }
        return count
    }

    /**
     * Removes a user from the revoked set (e.g. if they are re-activated).
     * @param {string} userId
     */
    unrevokeUser (userId) {
        this.revokedUsers.delete(userId)
    }

    _startCleanupTimer (intervalMs) {
        this._cleanupTimer = setInterval(() => {
            this._sweepExpiredRelays()
        }, intervalMs)
        this._cleanupTimer.unref()
    }

    _sweepExpiredRelays () {
        const now = Date.now()
        const expired = []
        for (const [relayId, relay] of this.relays) {
            if (now - relay.createdAt > this.relayTtlMs) {
                expired.push(relayId)
            }
        }
        for (const relayId of expired) {
            this._removeRelay(relayId)
        }
        if (expired.length > 0) {
            logger.warn({ msg: 'Swept expired relays', count: expired.length, remaining: this.relays.size })
        }
    }

    _cleanupAll () {
        if (this._cleanupTimer) {
            clearInterval(this._cleanupTimer)
            this._cleanupTimer = null
        }
        for (const [relayId, relay] of this.relays) {
            try {
                relay.subscription.unsubscribe()
            } catch {
                // ignore
            }
        }
        this.relays.clear()
        this.userRelays.clear()
        this.revokedUsers.clear()
    }

    async stop () {
        this._cleanupAll()
        if (this.connection) {
            await this.connection.drain()
            await this.connection.close()
            this.connection = null
            this.isRunning = false
            logger.info({ msg: 'Subscription relay service stopped' })
        }
    }
}

module.exports = { NatsSubscriptionRelay }
