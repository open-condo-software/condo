const conf = require('@open-condo/config')
const { initializeNatsPublisher } = require('@open-condo/nats')

async function initNats () {
    if (conf.PHASE === 'build') return

    const isEnabled = conf.NATS_ENABLED !== 'false'

    if (!isEnabled) {
        console.log('[NATS] Publisher disabled')
        return
    }

    try {
        await initializeNatsPublisher({
            url: conf.NATS_URL,
            token: conf.NATS_TOKEN,
            enabled: isEnabled,
        })
        console.log('[NATS] Publisher initialized')
    } catch (error) {
        console.error('[NATS] Failed to initialize publisher:', error)
    }
}

module.exports = { initNats }
