const crypto = require('crypto')

const { connect, JSONCodec, consumerOpts, createInbox } = require('nats')

const conf = require('@open-condo/config')
const { getLogger } = require('@open-condo/keystone/logging')

const {
    ADMIN_REVOKE_PREFIX,
    ADMIN_UNREVOKE_PREFIX,
    ADMIN_REVOKE_ORG_PREFIX,
    ADMIN_UNREVOKE_ORG_PREFIX,
    APP_PREFIX,
    CHANNEL_ORGANIZATION,
    buildRelaySubscribePattern,
    buildRelayUnsubscribePattern,
} = require('../../core/topic')
const {
    loadRevokedUsers,
    loadRevokedUserOrgs,
    addRevokedUser,
    removeRevokedUser,
    addRevokedUserOrg,
    removeRevokedUserOrg,
} = require('./RevocationStore')

const logger = getLogger()

const MESSAGING_CONFIG = conf.MESSAGING_CONFIG ? JSON.parse(conf.MESSAGING_CONFIG) : {}

const RELAY_QUEUE_GROUP = 'messaging-relay'
const DEFAULT_RELAY_TTL_MS = 5 * 60 * 1000
const DEFAULT_CLEANUP_INTERVAL_MS = 60 * 1000
const DEFAULT_MAX_RELAYS_PER_USER = 50

/**
 * Server-side subscription relay service.
 *
 * Since NATS does not enforce SUB permissions in auth_callout non-operator mode,
 * this service uses PUB permissions (which ARE enforced) as the access control mechanism.
 *
 * Flow:
 * 1. Client publishes to `_MESSAGING.subscribe.<userId>.<actualTopic>` with `{ deliverInbox }` in body
 *    (e.g. `_MESSAGING.subscribe.<userId>.condo.user.<userId>.notification`)
 *    - PUB permission includes userId + actual topic → NATS enforces identity + access
 * 2. This service receives the request, subscribes to the actual topic on behalf of the client
 * 3. Forwards matching messages to the client's `deliverInbox`
 * 4. Client publishes to `_MESSAGING.unsubscribe.{relayId}` to stop
 */
const MAX_RESTART_DELAY_MS = 30000
const INITIAL_RESTART_DELAY_MS = 1000

class NatsSubscriptionRelay {
    constructor () {
        this.connection = null
        this.isRunning = false
        this.relays = new Map()
        this.userRelays = new Map()
        this.revokedUsers = new Set()
        this.revokedUserOrgs = new Map()
        this.jc = JSONCodec()
        this._cleanupTimer = null
        this._restartTimer = null
        this._restartDelay = INITIAL_RESTART_DELAY_MS
        this._intentionalStop = false
        this._lastConfig = {}
        this.relayTtlMs = DEFAULT_RELAY_TTL_MS
    }

    async start (config = {}) {
        try {
            this._lastConfig = config
            this._intentionalStop = false

            if (config.relayTtlMs !== undefined) {
                this.relayTtlMs = config.relayTtlMs
            }
            this.maxRelaysPerUser = config.maxRelaysPerUser || DEFAULT_MAX_RELAYS_PER_USER

            this.connection = await connect({
                servers: config.url || MESSAGING_CONFIG.brokerUrl,
                user: config.user || MESSAGING_CONFIG.serverUser,
                pass: config.pass || MESSAGING_CONFIG.serverPassword,
                name: 'subscription-relay',
                reconnect: true,
                maxReconnectAttempts: -1,
                reconnectTimeWait: 2000,
                reconnectJitter: 1000,
                reconnectJitterTLS: 2000,
            })

            this.isRunning = true
            this.js = this.connection.jetstream()

            this._startCleanupTimer(config.cleanupIntervalMs || DEFAULT_CLEANUP_INTERVAL_MS)

            const subscribeSub = this.connection.subscribe(buildRelaySubscribePattern(), { queue: RELAY_QUEUE_GROUP })
            const unsubscribeSub = this.connection.subscribe(buildRelayUnsubscribePattern(), { queue: RELAY_QUEUE_GROUP })

            ;(async () => {
                for await (const msg of subscribeSub) {
                    try {
                        await this._handleSubscribeRequest(msg)
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

            const revokeOrgSub = this.connection.subscribe(`${ADMIN_REVOKE_ORG_PREFIX}.>`)
            ;(async () => {
                for await (const msg of revokeOrgSub) {
                    const rest = msg.subject.slice(ADMIN_REVOKE_ORG_PREFIX.length + 1)
                    const [userId, organizationId] = rest.split('.')
                    if (userId && organizationId) this.revokeUserOrganization(userId, organizationId)
                }
            })()

            const unrevokeOrgSub = this.connection.subscribe(`${ADMIN_UNREVOKE_ORG_PREFIX}.>`)
            ;(async () => {
                for await (const msg of unrevokeOrgSub) {
                    const rest = msg.subject.slice(ADMIN_UNREVOKE_ORG_PREFIX.length + 1)
                    const [userId, organizationId] = rest.split('.')
                    if (userId && organizationId) this.unrevokeUserOrganization(userId, organizationId)
                }
            })()

            try {
                const [persistedUsers, persistedOrgs] = await Promise.all([
                    loadRevokedUsers(),
                    loadRevokedUserOrgs(),
                ])
                for (const userId of persistedUsers) {
                    this.revokedUsers.add(userId)
                }
                for (const [userId, orgIds] of persistedOrgs) {
                    if (!this.revokedUserOrgs.has(userId)) {
                        this.revokedUserOrgs.set(userId, new Set())
                    }
                    for (const orgId of orgIds) {
                        this.revokedUserOrgs.get(userId).add(orgId)
                    }
                }
            } catch (err) {
                logger.error({ msg: 'Failed to load persisted revocation state', err })
            }

            this.connection.closed().then(async (err) => {
                this.isRunning = false
                const savedRevokedUsers = new Set(this.revokedUsers)
                const savedRevokedUserOrgs = new Map(
                    [...this.revokedUserOrgs].map(([k, v]) => [k, new Set(v)])
                )
                await this._cleanupAll()
                if (err) {
                    logger.error({ msg: 'Relay connection closed with error', err })
                }
                if (!this._intentionalStop) {
                    this.revokedUsers = savedRevokedUsers
                    this.revokedUserOrgs = savedRevokedUserOrgs
                    this._scheduleRestart()
                }
            })

            this._restartDelay = INITIAL_RESTART_DELAY_MS

        } catch (error) {
            logger.error({ msg: 'Failed to start subscription relay service', err: error })
            throw error
        }
    }

    async _handleSubscribeRequest (msg) {
        const parts = msg.subject.split('.')
        // _MESSAGING.subscribe.<userId>.<actualTopic...>
        if (parts.length < 4) {
            logger.warn({ msg: 'Invalid subscribe request topic', topic: msg.subject })
            return
        }

        const requestingUserId = parts[2]
        const actualTopic = parts.slice(3).join('.')

        let data
        try {
            data = this.jc.decode(msg.data)
        } catch {
            logger.warn({ msg: 'Invalid subscribe request body' })
            return
        }

        const { deliverInbox } = data
        if (!deliverInbox) {
            logger.warn({ msg: 'Missing deliverInbox in subscribe request' })
            return
        }

        if (typeof deliverInbox !== 'string' || !deliverInbox.startsWith('_INBOX.')) {
            logger.warn({ msg: 'Invalid deliverInbox format', deliverInbox })
            return
        }

        if (this.revokedUsers.has(requestingUserId)) {
            logger.warn({ msg: 'Relay request rejected for revoked user', userId: requestingUserId })
            if (msg.reply) {
                this.connection.publish(msg.reply, this.jc.encode({ status: 'error', reason: 'access revoked' }))
            }
            return
        }

        const revokedOrgs = this.revokedUserOrgs.get(requestingUserId)
        if (revokedOrgs) {
            const orgPrefix = `${APP_PREFIX}.${CHANNEL_ORGANIZATION}.`
            if (actualTopic.startsWith(orgPrefix)) {
                const orgId = actualTopic.slice(orgPrefix.length).split('.')[0]
                if (revokedOrgs.has(orgId)) {
                    logger.warn({ msg: 'Relay request rejected for revoked user-organization', userId: requestingUserId, organizationId: orgId })
                    if (msg.reply) {
                        this.connection.publish(msg.reply, this.jc.encode({ status: 'error', reason: 'organization access revoked' }))
                    }
                    return
                }
            }
        }

        if (!actualTopic.startsWith(`${APP_PREFIX}.`)) {
            logger.warn({ msg: 'Relay request rejected: topic does not start with app prefix', actualTopic })
            if (msg.reply) {
                this.connection.publish(msg.reply, this.jc.encode({ status: 'error', reason: 'invalid topic' }))
            }
            return
        }

        const userRelaySet = this.userRelays.get(requestingUserId)
        if (userRelaySet && userRelaySet.size >= this.maxRelaysPerUser) {
            logger.warn({ msg: 'Relay limit reached for user', userId: requestingUserId, limit: this.maxRelaysPerUser })
            if (msg.reply) {
                this.connection.publish(msg.reply, this.jc.encode({ status: 'error', reason: 'relay limit reached' }))
            }
            return
        }

        const relayId = `relay-${crypto.randomBytes(12).toString('hex')}`

        let channelSub
        try {
            const opts = consumerOpts()
            opts.ackNone()
            opts.filterSubject(actualTopic)
            opts.deliverTo(createInbox())

            if (data.startTime) {
                opts.startTime(new Date(data.startTime))
            } else {
                opts.deliverNew()
            }

            channelSub = await this.js.subscribe(actualTopic, opts)
        } catch (error) {
            logger.error({ msg: 'Failed to create JetStream consumer for relay', relayId, actualTopic, err: error })
            if (msg.reply) {
                this.connection.publish(msg.reply, this.jc.encode({ status: 'error', reason: 'stream not available' }))
            }
            return
        }

        // Retrieve the consumer name so we can destroy it during cleanup
        let consumerName = null
        let streamName = null
        try {
            const ci = await channelSub.consumerInfo()
            consumerName = ci.name
            streamName = ci.stream_name
        } catch (err) {
            logger.warn({ msg: 'Could not retrieve consumer info for relay', relayId, err: err.message })
        }

        const relay = {
            id: relayId,
            requestingUserId,
            deliverInbox,
            actualTopic,
            subscription: channelSub,
            consumerName,
            streamName,
            createdAt: Date.now(),
        }

        this.relays.set(relayId, relay)
        if (!this.userRelays.has(requestingUserId)) {
            this.userRelays.set(requestingUserId, new Set())
        }
        this.userRelays.get(requestingUserId).add(relayId)

        ;(async () => {
            for await (const channelMsg of channelSub) {
                try {
                    relay.createdAt = Date.now()
                    this.connection.publish(deliverInbox, channelMsg.data)
                } catch (error) {
                    logger.error({ msg: 'Error forwarding message', relayId, err: error })
                }
            }
            this.relays.delete(relayId)
            const userSet = this.userRelays.get(relay.requestingUserId)
            if (userSet) {
                userSet.delete(relayId)
                if (userSet.size === 0) this.userRelays.delete(relay.requestingUserId)
            }
        })()

        if (msg.reply) {
            this.connection.publish(msg.reply, this.jc.encode({ relayId, status: 'ok' }))
        }

    }

    async _handleUnsubscribeRequest (msg) {
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

        await this._removeRelay(relayId)

        if (msg.reply) {
            this.connection.publish(msg.reply, this.jc.encode({ status: 'ok' }))
        }
    }

    async _removeRelay (relayId) {
        const relay = this.relays.get(relayId)
        if (!relay) return false

        try {
            relay.subscription.unsubscribe()
        } catch (err) {
            logger.error({ msg: 'Error unsubscribing relay', relayId, err })
        }

        // Destroy the server-side JetStream consumer to prevent resource leaks
        if (relay.consumerName && relay.streamName) {
            try {
                const jsm = await this.connection.jetstreamManager()
                await jsm.consumers.delete(relay.streamName, relay.consumerName)
            } catch (err) {
                // Consumer may already be gone (ephemeral timeout or server restart)
                logger.warn({ msg: 'Could not delete JetStream consumer (may already be cleaned up)', relayId, consumer: relay.consumerName, err: err.message })
            }
        }

        this.relays.delete(relayId)

        if (relay.requestingUserId) {
            const userSet = this.userRelays.get(relay.requestingUserId)
            if (userSet) {
                userSet.delete(relayId)
                if (userSet.size === 0) {
                    this.userRelays.delete(relay.requestingUserId)
                }
            }
        }

        return true
    }

    async _notifyAndRemoveRelay (relayId, reason) {
        const relay = this.relays.get(relayId)
        if (!relay) return false

        try {
            this.connection.publish(
                relay.deliverInbox,
                this.jc.encode({ __relay_closed: true, relayId, reason })
            )
        } catch (error) {
            logger.error({ msg: 'Error sending relay closed notification', relayId, err: error })
        }

        return this._removeRelay(relayId)
    }

    /**
     * Immediately revokes relay subscriptions for a user in a specific organization.
     * Tears down only relays whose actualTopic matches the organization prefix.
     * @param {string} userId
     * @param {string} organizationId
     * @returns {number} Number of relays revoked
     */
    async revokeUserOrganization (userId, organizationId) {
        if (!this.revokedUserOrgs.has(userId)) {
            this.revokedUserOrgs.set(userId, new Set())
        }
        this.revokedUserOrgs.get(userId).add(organizationId)
        addRevokedUserOrg(userId, organizationId)

        const relayIds = this.userRelays.get(userId)
        if (!relayIds || relayIds.size === 0) return 0

        const orgTopicPrefix = `${APP_PREFIX}.${CHANNEL_ORGANIZATION}.${organizationId}.`
        const ids = [...relayIds]
        let count = 0
        for (const relayId of ids) {
            const relay = this.relays.get(relayId)
            if (relay && relay.actualTopic.startsWith(orgTopicPrefix)) {
                if (await this._notifyAndRemoveRelay(relayId, 'organization access revoked')) count++
            }
        }
        return count
    }

    /**
     * Removes a user-organization pair from the revoked set.
     * @param {string} userId
     * @param {string} organizationId
     */
    unrevokeUserOrganization (userId, organizationId) {
        const orgs = this.revokedUserOrgs.get(userId)
        if (orgs) {
            orgs.delete(organizationId)
            if (orgs.size === 0) {
                this.revokedUserOrgs.delete(userId)
            }
        }
        removeRevokedUserOrg(userId, organizationId)
    }

    /**
     * Immediately revokes all relay subscriptions for a given user.
     * Call this when a user is deleted, blocked, or loses access.
     * @param {string} userId
     * @returns {number} Number of relays revoked
     */
    async revokeUser (userId) {
        this.revokedUsers.add(userId)
        addRevokedUser(userId)

        const relayIds = this.userRelays.get(userId)
        if (!relayIds || relayIds.size === 0) return 0

        const ids = [...relayIds]
        let count = 0
        for (const relayId of ids) {
            if (await this._notifyAndRemoveRelay(relayId, 'access revoked')) count++
        }
        return count
    }

    /**
     * Removes a user from the revoked set (e.g. if they are re-activated).
     * @param {string} userId
     */
    unrevokeUser (userId) {
        this.revokedUsers.delete(userId)
        removeRevokedUser(userId)
    }

    _startCleanupTimer (intervalMs) {
        this._cleanupTimer = setInterval(() => {
            this._sweepExpiredRelays()
        }, intervalMs)
        this._cleanupTimer.unref()
    }

    async _sweepExpiredRelays () {
        const now = Date.now()
        const expired = []
        for (const [relayId, relay] of this.relays) {
            if (now - relay.createdAt > this.relayTtlMs) {
                expired.push(relayId)
            }
        }
        for (const relayId of expired) {
            await this._notifyAndRemoveRelay(relayId, 'expired')
        }
        if (expired.length > 0) {
            logger.warn({ msg: 'Swept expired relays', count: expired.length, remaining: this.relays.size })
        }
    }

    async _cleanupAll () {
        if (this._cleanupTimer) {
            clearInterval(this._cleanupTimer)
            this._cleanupTimer = null
        }
        const cleanupPromises = []
        for (const [relayId, relay] of this.relays) {
            try {
                relay.subscription.unsubscribe()
            } catch {
                // ignore
            }
            // Best-effort destroy of server-side JetStream consumers
            if (relay.consumerName && relay.streamName && this.connection && !this.connection.isClosed()) {
                cleanupPromises.push(
                    this.connection.jetstreamManager()
                        .then(jsm => jsm.consumers.delete(relay.streamName, relay.consumerName))
                        .catch(() => { /* consumer may already be gone */ })
                )
            }
        }
        await Promise.allSettled(cleanupPromises)
        this.relays.clear()
        this.userRelays.clear()
        this.revokedUsers.clear()
        this.revokedUserOrgs.clear()
    }

    _scheduleRestart () {
        if (this._restartTimer) return
        const delay = Math.min(this._restartDelay, MAX_RESTART_DELAY_MS)
        logger.warn({ msg: 'Scheduling relay service restart', delayMs: delay })
        this._restartTimer = setTimeout(async () => {
            this._restartTimer = null
            try {
                await this.start(this._lastConfig)
                logger.info({ msg: 'Relay service restarted successfully' })
            } catch (err) {
                logger.error({ msg: 'Relay service restart failed, will retry', err: err.message })
                this._restartDelay = Math.min(this._restartDelay * 2, MAX_RESTART_DELAY_MS)
                this._scheduleRestart()
            }
        }, delay)
        this._restartTimer.unref()
    }

    async stop () {
        this._intentionalStop = true
        if (this._restartTimer) {
            clearTimeout(this._restartTimer)
            this._restartTimer = null
        }
        await this._cleanupAll()
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
