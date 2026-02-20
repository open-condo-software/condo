const conf = require('@open-condo/config')
const { getLogger } = require('@open-condo/keystone/logging')
const { AuthCalloutService, SubscriptionRelayService, initializeNatsPublisher } = require('@open-condo/nats')

const logger = getLogger('nats')

let authCalloutService = null
let subscriptionRelayService = null

async function initNats () {
    if (conf.PHASE === 'build') return

    if (conf.NATS_ENABLED !== 'true') {
        logger.info({ msg: 'NATS disabled (set NATS_ENABLED=true to enable)' })
        return
    }

    if (!conf.NATS_URL) {
        logger.warn({ msg: 'NATS_ENABLED is true but NATS_URL is not set, skipping initialization' })
        return
    }

    if (conf.NATS_AUTH_ACCOUNT_SEED) {
        try {
            authCalloutService = new AuthCalloutService()
            await authCalloutService.start({
                url: conf.NATS_URL,
                accountSeed: conf.NATS_AUTH_ACCOUNT_SEED,
                authUser: conf.NATS_AUTH_USER,
                authPass: conf.NATS_AUTH_PASSWORD,
            })
            logger.info({ msg: 'Auth callout service started' })
        } catch (error) {
            logger.error({ msg: 'Failed to start auth callout service', err: error })
            authCalloutService = null
        }
    } else {
        logger.info({ msg: 'NATS_AUTH_ACCOUNT_SEED not set, auth callout service disabled' })
    }

    try {
        await initializeNatsPublisher({
            url: conf.NATS_URL,
            user: conf.NATS_SERVER_USER,
            pass: conf.NATS_SERVER_PASSWORD,
            enabled: true,
        })
        logger.info({ msg: 'Publisher initialized' })
    } catch (error) {
        logger.error({ msg: 'Failed to initialize publisher', err: error })
    }

    try {
        subscriptionRelayService = new SubscriptionRelayService()
        await subscriptionRelayService.start({
            url: conf.NATS_URL,
            user: conf.NATS_SERVER_USER,
            pass: conf.NATS_SERVER_PASSWORD,
        })
        logger.info({ msg: 'Subscription relay service started' })
    } catch (error) {
        logger.error({ msg: 'Failed to start subscription relay service', err: error })
        subscriptionRelayService = null
    }
}

async function closeNats () {
    if (subscriptionRelayService) {
        await subscriptionRelayService.stop()
        subscriptionRelayService = null
    }
    if (authCalloutService) {
        await authCalloutService.stop()
        authCalloutService = null
    }
}

module.exports = { initNats, closeNats }
