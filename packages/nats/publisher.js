const { getLogger } = require('@open-condo/keystone/logging')

const { NatsClient } = require('./client')
const { streamRegistry } = require('./streams')

const logger = getLogger('nats')

let natsClient = null
let isEnabled = false

const initializeNatsPublisher = async (config = {}) => {
    isEnabled = config.enabled !== false && process.env.NATS_ENABLED === 'true'

    if (!isEnabled) {
        logger.info({ msg: 'NATS publisher disabled' })
        return
    }

    if (!natsClient) {
        natsClient = new NatsClient()
        try {
            await natsClient.connect(config)
            await streamRegistry.initializeAll(natsClient)
            logger.info({ msg: 'Publisher initialized' })
        } catch (error) {
            logger.error({ msg: 'Failed to initialize NATS publisher', err: error })
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
        logger.info({ msg: 'Published', subject, stream })
    } catch (error) {
        logger.error({ msg: 'NATS publish failed', err: error, stream, subject })
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
