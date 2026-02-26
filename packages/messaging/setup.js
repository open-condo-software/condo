const conf = require('@open-condo/config')
const { getLogger } = require('@open-condo/keystone/logging')

const { NatsAdapter } = require('./adapters/nats')
const { initializePublisher } = require('./core/Publisher')
const { configure } = require('./utils')

const logger = getLogger()

let adapter = null

/**
 * Initialize the messaging subsystem: adapter, auth service, publisher, relay.
 * Reads configuration from environment variables via @open-condo/config:
 *   - PHASE — if 'build', skips initialization
 *   - MESSAGING_ENABLED — must be 'true' to proceed
 *   - MESSAGING_BROKER_URL — broker connection URL
 *   - MESSAGING_AUTH_ACCOUNT_SEED — if set, starts auth callout service
 *   - MESSAGING_AUTH_USER / MESSAGING_AUTH_PASSWORD — auth service credentials
 *   - MESSAGING_SERVER_USER / MESSAGING_SERVER_PASSWORD — server connection credentials
 *
 * @returns {Promise<void>}
 */
async function initMessaging () {
    if (conf.PHASE === 'build') return

    if (conf.MESSAGING_ENABLED !== 'true') {
        logger.info({ msg: 'Messaging disabled (set MESSAGING_ENABLED=true to enable)' })
        return
    }

    if (!conf.MESSAGING_BROKER_URL) {
        logger.warn({ msg: 'MESSAGING_ENABLED is true but MESSAGING_BROKER_URL is not set, skipping initialization' })
        return
    }

    const adapterName = process.env.MESSAGING_ADAPTER || 'nats'
    if (adapterName !== 'nats') {
        throw new Error(`Unknown messaging adapter: ${adapterName}`)
    }
    adapter = new NatsAdapter()

    if (conf.MESSAGING_AUTH_ACCOUNT_SEED) {
        await adapter.startAuthService({
            url: conf.MESSAGING_BROKER_URL,
            accountSeed: conf.MESSAGING_AUTH_ACCOUNT_SEED,
            authUser: conf.MESSAGING_AUTH_USER,
            authPass: conf.MESSAGING_AUTH_PASSWORD,
        })
        logger.info({ msg: 'Auth callout service started' })
    } else {
        logger.info({ msg: 'MESSAGING_AUTH_ACCOUNT_SEED not set, auth callout service disabled' })
    }

    await adapter.connect({
        url: conf.MESSAGING_BROKER_URL,
        user: conf.MESSAGING_SERVER_USER,
        pass: conf.MESSAGING_SERVER_PASSWORD,
    })

    await initializePublisher(adapter, { enabled: true })
    logger.info({ msg: 'Publisher initialized' })

    await adapter.startRelayService({
        url: conf.MESSAGING_BROKER_URL,
        user: conf.MESSAGING_SERVER_USER,
        pass: conf.MESSAGING_SERVER_PASSWORD,
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
