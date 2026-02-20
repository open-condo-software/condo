const conf = require('@open-condo/config')
const { getLogger } = require('@open-condo/keystone/logging')
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
        try {
            await adapter.startAuthService({
                url: conf.MESSAGING_BROKER_URL,
                accountSeed: conf.MESSAGING_AUTH_ACCOUNT_SEED,
                authUser: conf.MESSAGING_AUTH_USER,
                authPass: conf.MESSAGING_AUTH_PASSWORD,
            })
            logger.info({ msg: 'Auth callout service started' })
        } catch (error) {
            logger.error({ msg: 'Failed to start auth callout service', err: error })
        }
    } else {
        logger.info({ msg: 'MESSAGING_AUTH_ACCOUNT_SEED not set, auth callout service disabled' })
    }

    try {
        await adapter.connect({
            url: conf.MESSAGING_BROKER_URL,
            user: conf.MESSAGING_SERVER_USER,
            pass: conf.MESSAGING_SERVER_PASSWORD,
        })
        await initializePublisher(adapter, { enabled: true })
        logger.info({ msg: 'Publisher initialized' })
    } catch (error) {
        logger.error({ msg: 'Failed to initialize publisher', err: error })
    }

    try {
        await adapter.startRelayService({
            url: conf.MESSAGING_BROKER_URL,
            user: conf.MESSAGING_SERVER_USER,
            pass: conf.MESSAGING_SERVER_PASSWORD,
        })
        logger.info({ msg: 'Subscription relay service started' })
    } catch (error) {
        logger.error({ msg: 'Failed to start subscription relay service', err: error })
    }
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
 * Single entry point for messaging setup.
 * Configures access control, registers channels, and initializes the adapter.
 * @param {Object} config
 * @param {Function} config.getPermittedOrganizations - Function to get organizations where user has permissions
 */
function setupMessaging (config = {}) {
    configure({
        getPermittedOrganizations: config.getPermittedOrganizations,
    })

    require('./messagingChannels')

    initMessaging()
}

module.exports = { setupMessaging, closeMessaging }
