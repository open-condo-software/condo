const { connect, StringCodec, JSONCodec } = require('nats')

const { getLogger } = require('@open-condo/keystone/logging')

const logger = getLogger('nats')

class NatsClient {
    connection = null
    jetstream = null
    stringCodec = StringCodec()
    jsonCodec = JSONCodec()
    isConnected = false

    async connect (config) {
        if (this.isConnected) return

        try {
            this.connection = await connect({
                servers: config.url || process.env.NATS_URL || 'nats://localhost:4222',
                token: config.token || process.env.NATS_TOKEN,
                reconnect: true,
                maxReconnectAttempts: -1,
            })

            this.jetstream = this.connection.jetstream()
            this.isConnected = true

            logger.info({ msg: 'NATS connected successfully', url: config.url })

            this.connection.closed().then((err) => {
                this.isConnected = false
                if (err) {
                    logger.error({ msg: 'NATS connection closed with error', err })
                } else {
                    logger.info({ msg: 'NATS connection closed' })
                }
            })
        } catch (error) {
            logger.error({ msg: 'NATS connection error', err: error })
            throw error
        }
    }

    async publish (streamName, subject, data) {
        if (!this.isConnected) {
            logger.warn({ msg: 'NATS not connected, skipping publish', stream: streamName })
            return
        }

        try {
            const encoded = this.jsonCodec.encode(data)
            await this.jetstream.publish(subject, encoded)
            logger.info({ msg: 'Published to NATS', stream: streamName, subject })
        } catch (error) {
            logger.error({ msg: 'NATS publish error', err: error, stream: streamName, subject })
        }
    }

    async close () {
        if (this.connection) {
            await this.connection.close()
            this.isConnected = false
        }
    }
}

module.exports = { NatsClient }
