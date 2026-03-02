const conf = require('@open-condo/config')
const { getLogger } = require('@open-condo/keystone/logging')

const { NatsAdapter } = require('./adapters/nats')
const { initializePublisher } = require('./core/Publisher')
const { configure } = require('./utils')

const logger = getLogger()

const MESSAGING_CONFIG = conf.MESSAGING_CONFIG ? JSON.parse(conf.MESSAGING_CONFIG) : {}

let adapter = null

/**
 * Initialize the messaging subsystem: adapter, auth service, publisher, relay.
 * Reads configuration from MESSAGING_CONFIG JSON env var via @open-condo/config.
 *
 * @returns {Promise<void>}
 */
async function initMessaging () {
    if (conf.PHASE === 'build') return

    if (!MESSAGING_CONFIG.enabled) {
        logger.info({ msg: 'Messaging disabled (set MESSAGING_CONFIG.enabled to true)' })
        return
    }

    if (!MESSAGING_CONFIG.brokerUrl) {
        logger.warn({ msg: 'Messaging enabled but brokerUrl is not set, skipping initialization' })
        return
    }

    const adapterName = MESSAGING_CONFIG.adapter || 'nats'
    if (adapterName !== 'nats') {
        throw new Error(`Unknown messaging adapter: ${adapterName}`)
    }
    adapter = new NatsAdapter()

    if (MESSAGING_CONFIG.authAccountSeed) {
        await adapter.startAuthService({
            url: MESSAGING_CONFIG.brokerUrl,
            accountSeed: MESSAGING_CONFIG.authAccountSeed,
            authUser: MESSAGING_CONFIG.authUser,
            authPass: MESSAGING_CONFIG.authPassword,
        })
        logger.info({ msg: 'Auth callout service started' })
    } else {
        logger.info({ msg: 'authAccountSeed not set, auth callout service disabled' })
    }

    await adapter.connect({
        url: MESSAGING_CONFIG.brokerUrl,
        user: MESSAGING_CONFIG.serverUser,
        pass: MESSAGING_CONFIG.serverPassword,
    })

    await initializePublisher(adapter, { enabled: true })
    logger.info({ msg: 'Publisher initialized' })

    await adapter.startRelayService({
        url: MESSAGING_CONFIG.brokerUrl,
        user: MESSAGING_CONFIG.serverUser,
        pass: MESSAGING_CONFIG.serverPassword,
    })
    logger.info({ msg: 'Subscription relay service started' })
}

/**
 * Gracefully shut down the messaging subsystem.
 * @returns {Promise<void>}
 */
async function closeMessaging () {
    if (adapter) {
        await adapter.stopRelayService()
        await adapter.stopAuthService()
        await adapter.disconnect()
        adapter = null
    }
}

/**
 * Immediately revokes a user's messaging access:
 * - Tears down all active relay subscriptions (no more messages)
 * - Blocks new relay requests from this user
 * - Rejects future NATS connection/reconnection attempts
 *
 * Call this when a user is soft-deleted, blocked, or otherwise loses access.
 *
 * @param {string} userId
 * @returns {number} Number of relays torn down (0 if messaging not initialized)
 */
function revokeMessagingUser (userId) {
    if (!adapter) return 0
    return adapter.revokeUser(userId)
}

/**
 * Re-enables a previously revoked user's messaging access.
 * Call this if a user is re-activated after being blocked/deleted.
 *
 * @param {string} userId
 */
function unrevokeMessagingUser (userId) {
    if (!adapter) return
    adapter.unrevokeUser(userId)
}

/**
 * Single entry point for messaging setup.
 * Configures per-channel access control and starts the messaging adapter.
 *
 * @param {Object} config
 * @param {Record<string, function(Object, string, string): Promise<boolean>>} config.accessCheckers
 *   Map of channel name → async (context, userId, targetId) => boolean
 *
 * @example
 *   setupMessaging({
 *       accessCheckers: {
 *           organization: async (context, userId, organizationId) => {
 *               const employees = await find('OrganizationEmployee', { ... })
 *               return employees.length > 0
 *           },
 *       },
 *   })
 */
function setupMessaging (config = {}) {
    const { accessCheckers } = config

    configure({ accessCheckers })

    initMessaging().catch((error) => {
        logger.error({ msg: 'Failed to initialize messaging', err: error })
    })
}

module.exports = {
    initMessaging,
    closeMessaging,
    revokeMessagingUser,
    unrevokeMessagingUser,
    setupMessaging,
}
