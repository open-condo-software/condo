const conf = require('@open-condo/config')
const { AuthCalloutService, SubscriptionRelayService, initializeNatsPublisher } = require('@open-condo/nats')

let authCalloutService = null
let subscriptionRelayService = null

async function initNats () {
    if (conf.PHASE === 'build') return

    const isEnabled = conf.NATS_ENABLED !== 'false'

    if (!isEnabled) {
        console.log('[NATS] Publisher disabled')
        return
    }

    try {
        if (conf.NATS_AUTH_ACCOUNT_SEED) {
            authCalloutService = new AuthCalloutService()
            await authCalloutService.start({
                url: conf.NATS_URL,
                accountSeed: conf.NATS_AUTH_ACCOUNT_SEED,
                authUser: conf.NATS_AUTH_USER || 'auth-service',
                authPass: conf.NATS_AUTH_PASSWORD || 'auth-secret',
            })
            console.log('[NATS] Auth callout service started')
        } else {
            console.log('[NATS] NATS_AUTH_ACCOUNT_SEED not set, auth callout service disabled')
        }

        await initializeNatsPublisher({
            url: conf.NATS_URL,
            user: conf.NATS_SERVER_USER || 'condo-server',
            pass: conf.NATS_SERVER_PASSWORD || 'server-secret',
            enabled: isEnabled,
        })
        console.log('[NATS] Publisher initialized')

        subscriptionRelayService = new SubscriptionRelayService()
        await subscriptionRelayService.start({
            url: conf.NATS_URL,
            user: conf.NATS_SERVER_USER || 'condo-server',
            pass: conf.NATS_SERVER_PASSWORD || 'server-secret',
        })
        console.log('[NATS] Subscription relay service started')
    } catch (error) {
        console.error('[NATS] Failed to initialize:', error)
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
