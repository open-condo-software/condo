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
            const connectOpts = {
                servers: config.url || process.env.NATS_URL || 'nats://127.0.0.1:4222',
                reconnect: true,
                maxReconnectAttempts: -1,
            }

            if (config.user && config.pass) {
                connectOpts.user = config.user
                connectOpts.pass = config.pass
            } else if (config.token || process.env.NATS_TOKEN) {
                connectOpts.token = config.token || process.env.NATS_TOKEN
            }

            this.connection = await connect(connectOpts)

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
