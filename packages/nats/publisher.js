const { getLogger } = require('@open-condo/keystone/logging')

const { NatsClient } = require('./client')
const { streamRegistry } = require('./streams')

const logger = getLogger('nats-publisher')

let natsClient = null
let isEnabled = false

const initializeNatsPublisher = async (config = {}) => {
    isEnabled = config.enabled !== false && process.env.NATS_ENABLED !== 'false'

    if (!isEnabled) {
        logger.info({ msg: 'NATS publisher disabled' })
        return
    }

    if (!natsClient) {
        natsClient = new NatsClient()
        try {
            await natsClient.connect(config)
            await streamRegistry.initializeAll(natsClient)
            console.log('[NATS] ✅ Publisher initialized')
        } catch (error) {
            logger.error({ msg: 'Failed to initialize NATS publisher', err: error })
            console.error('[NATS] ❌ Publisher initialization failed:', error.message)
            isEnabled = false
        }
    }

    return natsClient
}

const publish = async ({ stream, subject, data }) => {
    if (!isEnabled || !natsClient) {
        return
    }

    try {
        await natsClient.publish(stream, subject, data)
        console.log(`[NATS] 📤 Published to ${subject}`)
    } catch (error) {
        logger.error({ msg: 'NATS publish failed', err: error, stream, subject })
        console.error('[NATS] ❌ Publish failed:', error.message)
    }
}

const closeNatsPublisher = async () => {
    if (natsClient) {
        await natsClient.close()
        natsClient = null
        isEnabled = false
    }
}

module.exports = {
    initializeNatsPublisher,
    publish,
    closeNatsPublisher,
}
