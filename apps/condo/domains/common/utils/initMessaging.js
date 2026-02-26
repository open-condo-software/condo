const conf = require('@open-condo/config')
const { getLogger } = require('@open-condo/keystone/logging')
const { find } = require('@open-condo/keystone/schema')
const { configure, createAdapter, initializePublisher } = require('@open-condo/messaging')

const logger = getLogger()

let adapter = null

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

    adapter = createAdapter()

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
 * Checks whether a user is an active employee of the given organization.
 * Active = accepted, not rejected, not blocked, not soft-deleted.
 *
 * @param {Object} context - Keystone context (with skipAccessControl)
 * @param {string} userId
 * @param {string} organizationId
 * @returns {Promise<boolean>}
 */
async function isActiveEmployee (context, userId, organizationId) {
    const employees = await find('OrganizationEmployee', {
        user: { id: userId },
        organization: { id: organizationId },
        isAccepted: true,
        isRejected: false,
        isBlocked: false,
        deletedAt: null,
    })
    return employees.length > 0
}

/**
 * Single entry point for messaging setup.
 * Configures access control and starts the messaging adapter.
 */
function setupMessaging () {
    configure({
        isActiveEmployee,
    })

    initMessaging().catch((error) => {
        logger.error({ msg: 'Failed to initialize messaging', err: error })
    })
}

module.exports = { setupMessaging, closeMessaging, isActiveEmployee, revokeMessagingUser, unrevokeMessagingUser }
