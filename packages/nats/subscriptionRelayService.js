const { connect, JSONCodec } = require('nats')

const conf = require('@open-condo/config')
const { getLogger } = require('@open-condo/keystone/logging')

const logger = getLogger('nats-subscription-relay')

/**
 * Server-side subscription relay service.
 *
 * Since NATS does not enforce SUB permissions in auth_callout non-operator mode,
 * this service uses PUB permissions (which ARE enforced) as the access control mechanism.
 *
 * Flow:
 * 1. Client publishes to `_NATS.subscribe.{stream}.{orgId}` with `{ deliverInbox }` in body
 *    - PUB permission for this subject is org-scoped → NATS enforces it
 * 2. This service receives the request, subscribes to `{stream}.{orgId}.>` on behalf of the client
 * 3. Forwards matching messages to the client's `deliverInbox`
 * 4. Client publishes to `_NATS.unsubscribe.{relayId}` to stop
 */
class SubscriptionRelayService {
    constructor () {
        this.connection = null
        this.isRunning = false
        this.relays = new Map()
        this.relayCounter = 0
        this.jc = JSONCodec()
    }

    async start (config = {}) {
        try {
            this.connection = await connect({
                servers: config.url || conf.NATS_URL || 'nats://localhost:4222',
                user: config.user || conf.NATS_SERVER_USER || 'condo-server',
                pass: config.pass || conf.NATS_SERVER_PASSWORD || 'server-secret',
                name: 'subscription-relay',
                reconnect: true,
                maxReconnectAttempts: -1,
            })

            this.isRunning = true

            const subscribeSub = this.connection.subscribe('_NATS.subscribe.>')
            const unsubscribeSub = this.connection.subscribe('_NATS.unsubscribe.>')

            ;(async () => {
                for await (const msg of subscribeSub) {
                    try {
                        this._handleSubscribeRequest(msg)
                    } catch (error) {
                        logger.error({ msg: 'Error handling subscribe request', err: error })
                    }
                }
            })()

            ;(async () => {
                for await (const msg of unsubscribeSub) {
                    try {
                        this._handleUnsubscribeRequest(msg)
                    } catch (error) {
                        logger.error({ msg: 'Error handling unsubscribe request', err: error })
                    }
                }
            })()

            this.connection.closed().then((err) => {
                this.isRunning = false
                this._cleanupAll()
                if (err) {
                    logger.error({ msg: 'Relay connection closed with error', err })
                } else {
                    logger.info({ msg: 'Relay connection closed' })
                }
            })

            logger.info({ msg: 'Subscription relay service started' })
        } catch (error) {
            logger.error({ msg: 'Failed to start subscription relay service', err: error })
            throw error
        }
    }

    _handleSubscribeRequest (msg) {
        const parts = msg.subject.split('.')
        if (parts.length < 4) {
            logger.warn({ msg: 'Invalid subscribe request subject', subject: msg.subject })
            return
        }

        const streamName = parts[2]
        const orgId = parts[3]

        let data
        try {
            data = this.jc.decode(msg.data)
        } catch {
            logger.warn({ msg: 'Invalid subscribe request body' })
            return
        }

        const { deliverInbox } = data
        if (!deliverInbox) {
            logger.warn({ msg: 'Missing deliverInbox in subscribe request' })
            return
        }

        const relayId = `relay-${++this.relayCounter}`
        const streamSubject = `${streamName}.${orgId}.>`

        const streamSub = this.connection.subscribe(streamSubject)
        const relay = {
            id: relayId,
            streamName,
            orgId,
            deliverInbox,
            streamSubject,
            subscription: streamSub,
        }

        this.relays.set(relayId, relay)

        ;(async () => {
            for await (const streamMsg of streamSub) {
                try {
                    this.connection.publish(deliverInbox, streamMsg.data)
                } catch (error) {
                    logger.error({ msg: 'Error forwarding message', relayId, err: error })
                }
            }
            this.relays.delete(relayId)
        })()

        if (msg.reply) {
            this.connection.publish(msg.reply, this.jc.encode({ relayId, status: 'ok' }))
        }

        logger.info({
            msg: 'Relay created',
            relayId,
            streamSubject,
            deliverInbox,
        })
    }

    _handleUnsubscribeRequest (msg) {
        const parts = msg.subject.split('.')
        const relayId = parts[2]

        const relay = this.relays.get(relayId)
        if (relay) {
            relay.subscription.unsubscribe()
            this.relays.delete(relayId)
            logger.info({ msg: 'Relay removed', relayId })
        }

        if (msg.reply) {
            this.connection.publish(msg.reply, this.jc.encode({ status: 'ok' }))
        }
    }

    _cleanupAll () {
        for (const [relayId, relay] of this.relays) {
            try {
                relay.subscription.unsubscribe()
            } catch {
                // ignore
            }
        }
        this.relays.clear()
    }

    async stop () {
        this._cleanupAll()
        if (this.connection) {
            await this.connection.drain()
            await this.connection.close()
            this.connection = null
            this.isRunning = false
            logger.info({ msg: 'Subscription relay service stopped' })
        }
    }
}

module.exports = { SubscriptionRelayService }
