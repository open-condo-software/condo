const { connect, JSONCodec } = require('nats')

const conf = require('@open-condo/config')
const { getLogger } = require('@open-condo/keystone/logging')

const logger = getLogger()

const MESSAGING_CONFIG = conf.MESSAGING_CONFIG ? JSON.parse(conf.MESSAGING_CONFIG) : {}

const MAX_RECONNECT_DELAY_MS = 30000
const INITIAL_RECONNECT_DELAY_MS = 1000

class NatsClient {
    connection = null
    jetstream = null
    jsonCodec = JSONCodec()
    isConnected = false
    _reconnectTimer = null
    _reconnectDelay = INITIAL_RECONNECT_DELAY_MS
    _intentionalClose = false
    _lastConfig = {}

    async connect (config) {
        if (this.isConnected) return

        this._lastConfig = config
        this._intentionalClose = false

        try {
            const connectOpts = {
                servers: config.url || MESSAGING_CONFIG.brokerUrl,
                reconnect: true,
                maxReconnectAttempts: -1,
                reconnectTimeWait: 2000,
                reconnectJitter: 1000,
                reconnectJitterTLS: 2000,
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

            this.connection.closed().then((err) => {
                this.isConnected = false
                if (err) {
                    logger.error({ msg: 'NATS connection closed with error', err })
                }
                if (!this._intentionalClose) {
                    this._scheduleReconnect()
                }
            })

            this._reconnectDelay = INITIAL_RECONNECT_DELAY_MS
        } catch (error) {
            logger.error({ msg: 'NATS connection error', err: error })
            throw error
        }
    }

    _scheduleReconnect () {
        if (this._reconnectTimer) return
        const delay = Math.min(this._reconnectDelay, MAX_RECONNECT_DELAY_MS)
        logger.warn({ msg: 'Scheduling NATS client reconnect', delayMs: delay })
        this._reconnectTimer = setTimeout(async () => {
            this._reconnectTimer = null
            try {
                await this.connect(this._lastConfig)
                logger.info({ msg: 'NATS client reconnected successfully' })
            } catch (err) {
                logger.error({ msg: 'NATS client reconnect failed, will retry', err: err.message })
                this._reconnectDelay = Math.min(this._reconnectDelay * 2, MAX_RECONNECT_DELAY_MS)
                this._scheduleReconnect()
            }
        }, delay)
        this._reconnectTimer.unref()
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
        this._intentionalClose = true
        if (this._reconnectTimer) {
            clearTimeout(this._reconnectTimer)
            this._reconnectTimer = null
        }
        if (this.connection) {
            await this.connection.close()
            this.isConnected = false
        }
    }
}

module.exports = { NatsClient }
