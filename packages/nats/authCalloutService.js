const jwt = require('jsonwebtoken')
const { connect } = require('nats')
const nkeys = require('nkeys.js')

const conf = require('@open-condo/config')
const { getLogger } = require('@open-condo/keystone/logging')

const { decodeNatsJwt, createUserJwt, createAuthResponseJwt, computePermissions } = require('./utils/natsJwt')

const logger = getLogger('nats-auth-callout')

const TOKEN_SECRET = conf.NATS_TOKEN_SECRET || conf.TOKEN_SECRET || 'dev-secret'

class AuthCalloutService {
    constructor () {
        this.connection = null
        this.accountKeyPair = null
        this.accountPublicKey = null
        this.isRunning = false
    }

    /**
     * Starts the auth callout service.
     * Connects to NATS as auth-service user and subscribes to $SYS.REQ.USER.AUTH.
     * @param {Object} config
     * @param {string} [config.url] - NATS server URL
     * @param {string} [config.accountSeed] - Account NKey seed for signing
     * @param {string} [config.authUser] - Auth service username
     * @param {string} [config.authPass] - Auth service password
     */
    async start (config = {}) {
        const seed = config.accountSeed || conf.NATS_AUTH_ACCOUNT_SEED
        if (!seed) {
            logger.warn({ msg: 'NATS_AUTH_ACCOUNT_SEED not configured, auth callout service disabled' })
            return
        }

        try {
            this.accountKeyPair = nkeys.fromSeed(Buffer.from(seed))
            this.accountPublicKey = this.accountKeyPair.getPublicKey()
            this.accountName = config.accountName || 'APP'

            logger.info({ msg: 'Auth callout issuer public key', publicKey: this.accountPublicKey })

            this.connection = await connect({
                servers: config.url || conf.NATS_URL || 'nats://127.0.0.1:4222',
                user: config.authUser || conf.NATS_AUTH_USER || 'auth-service',
                pass: config.authPass || conf.NATS_AUTH_PASSWORD || 'auth-secret',
                reconnect: true,
                maxReconnectAttempts: -1,
            })

            const sub = this.connection.subscribe('$SYS.REQ.USER.AUTH')
            this.isRunning = true

            logger.info({ msg: 'Auth callout service started' })

            ;(async () => {
                for await (const msg of sub) {
                    try {
                        await this._handleAuthRequest(msg)
                    } catch (error) {
                        logger.error({ msg: 'Auth callout handler error', err: error })
                    }
                }
            })()

            this.connection.closed().then((err) => {
                this.isRunning = false
                if (err) {
                    logger.error({ msg: 'Auth callout connection closed with error', err })
                } else {
                    logger.info({ msg: 'Auth callout connection closed' })
                }
            })
        } catch (error) {
            logger.error({ msg: 'Failed to start auth callout service', err: error })
            throw error
        }
    }

    async _handleAuthRequest (msg) {
        const raw = new TextDecoder().decode(msg.data)
        const requestClaims = decodeNatsJwt(raw)
        const natsData = requestClaims.nats
        const { connect_opts, user_nkey, server_id, client_info } = natsData

        const token = connect_opts?.auth_token || connect_opts?.token
        const serverId = server_id?.id || ''

        logger.info({
            msg: 'Auth callout request',
            clientHost: client_info?.host,
            hasToken: !!token,
        })

        if (!token) {
            this._respondError(msg, user_nkey, serverId, 'No auth token provided')
            return
        }

        let decoded
        try {
            decoded = jwt.verify(token, TOKEN_SECRET)
        } catch (error) {
            logger.warn({ msg: 'Auth callout: invalid token', err: error.message })
            this._respondError(msg, user_nkey, serverId, 'Invalid or expired token')
            return
        }

        const { userId, organizationId, allowedStreams } = decoded

        if (!userId || !organizationId) {
            this._respondError(msg, user_nkey, serverId, 'Token missing userId or organizationId')
            return
        }

        if (!allowedStreams || !Array.isArray(allowedStreams) || allowedStreams.length === 0) {
            this._respondError(msg, user_nkey, serverId, 'No allowed streams in token')
            return
        }

        const permissions = computePermissions(allowedStreams, organizationId)

        const userJwt = createUserJwt({
            userNkey: user_nkey,
            accountPublicKey: this.accountPublicKey,
            permissions,
            accountKeyPair: this.accountKeyPair,
            accountName: this.accountName,
        })

        const responseJwt = createAuthResponseJwt({
            userNkey: user_nkey,
            serverId,
            accountPublicKey: this.accountPublicKey,
            userJwt,
            accountKeyPair: this.accountKeyPair,
        })

        logger.info({
            msg: 'Auth callout: access granted',
            userId,
            organizationId,
            streams: allowedStreams,
        })

        msg.respond(new TextEncoder().encode(responseJwt))
    }

    _respondError (msg, userNkey, serverId, errorMessage) {
        logger.warn({ msg: 'Auth callout: access denied', reason: errorMessage })

        const responseJwt = createAuthResponseJwt({
            userNkey,
            serverId,
            accountPublicKey: this.accountPublicKey,
            error: errorMessage,
            accountKeyPair: this.accountKeyPair,
        })

        msg.respond(new TextEncoder().encode(responseJwt))
    }

    async stop () {
        if (this.connection) {
            await this.connection.drain()
            await this.connection.close()
            this.connection = null
            this.isRunning = false
            logger.info({ msg: 'Auth callout service stopped' })
        }
    }
}

module.exports = { AuthCalloutService }
