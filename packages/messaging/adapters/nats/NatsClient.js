const { connect, StringCodec, JSONCodec } = require('nats')

const conf = require('@open-condo/config')
const { getLogger } = require('@open-condo/keystone/logging')

const logger = getLogger()

const MESSAGING_CONFIG = conf.MESSAGING_CONFIG ? JSON.parse(conf.MESSAGING_CONFIG) : {}

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
                servers: config.url || MESSAGING_CONFIG.brokerUrl,
                reconnect: true,
                maxReconnectAttempts: -1,
            }

            if (config.user && config.pass) {
                connectOpts.user = config.user
                connectOpts.pass = config.pass
            } else if (config.token || MESSAGING_CONFIG.brokerToken) {
                connectOpts.token = config.token || MESSAGING_CONFIG.brokerToken
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

    async publish (topic, data) {
        if (!this.isConnected) {
            logger.warn({ msg: 'NATS not connected, skipping publish', topic })
            return
        }

        try {
            const encoded = this.jsonCodec.encode(data)
            await this.jetstream.publish(topic, encoded)
        } catch (error) {
            logger.error({ msg: 'NATS publish error', err: error, topic })
            throw error
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
