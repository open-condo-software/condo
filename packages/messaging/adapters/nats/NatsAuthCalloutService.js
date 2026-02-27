const jwt = require('jsonwebtoken')
const { connect } = require('nats')
const nkeys = require('nkeys.js')

const conf = require('@open-condo/config')
const { getLogger } = require('@open-condo/keystone/logging')

const { ADMIN_REVOKE_PREFIX, ADMIN_UNREVOKE_PREFIX } = require('../../core/topic')

const { decodeNatsJwt, createUserJwt, createAuthResponseJwt, computePermissions } = require('./natsJwt')

const logger = getLogger()

const MESSAGING_CONFIG = conf.MESSAGING_CONFIG ? JSON.parse(conf.MESSAGING_CONFIG) : {}

const TOKEN_SECRET = MESSAGING_CONFIG.tokenSecret

class NatsAuthCalloutService {
    constructor () {
        this.connection = null
        this.accountKeyPair = null
        this.accountPublicKey = null
        this.isRunning = false
        this.revokedUsers = new Set()
    }

    /**
     * Starts the auth callout service.
     * Connects to NATS as auth-service user and subscribes to $SYS.REQ.USER.AUTH.
     * @param {Object} config
     * @param {string} [config.url] - NATS server URL
     * @param {string} [config.accountSeed] - Account NKey seed for signing
     * @param {string} [config.authUser] - Auth service username
     * @param {string} [config.authPass] - Auth service password
     * @param {string} [config.algorithm] - JWT signing algorithm (default: 'ed25519-nkey')
     * @param {number} [config.userJwtTtl] - User JWT TTL in seconds (default: 1h)
     */
    async start (config = {}) {
        const seed = config.accountSeed || MESSAGING_CONFIG.authAccountSeed
        if (!seed) {
            logger.warn({ msg: 'authAccountSeed not configured, auth callout service disabled' })
            return
        }

        this.algorithm = config.algorithm || 'ed25519-nkey'
        this.userJwtTtl = config.userJwtTtl || 3600

        try {
            this.accountKeyPair = nkeys.fromSeed(Buffer.from(seed))
            this.accountPublicKey = this.accountKeyPair.getPublicKey()
            this.accountName = config.accountName || 'APP'

            logger.info({ msg: 'Auth callout issuer public key', publicKey: this.accountPublicKey })

            this.connection = await connect({
                servers: config.url || MESSAGING_CONFIG.brokerUrl,
                user: config.authUser || MESSAGING_CONFIG.authUser,
                pass: config.authPass || MESSAGING_CONFIG.authPassword,
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

            const revokeSub = this.connection.subscribe(`${ADMIN_REVOKE_PREFIX}.>`)
            ;(async () => {
                for await (const msg of revokeSub) {
                    const userId = msg.subject.slice(ADMIN_REVOKE_PREFIX.length + 1)
                    if (userId) this.revokeUser(userId)
                }
            })()

            const unrevokeSub = this.connection.subscribe(`${ADMIN_UNREVOKE_PREFIX}.>`)
            ;(async () => {
                for await (const msg of unrevokeSub) {
                    const userId = msg.subject.slice(ADMIN_UNREVOKE_PREFIX.length + 1)
                    if (userId) this.unrevokeUser(userId)
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

        const { userId, organizationId } = decoded

        if (!userId || !organizationId) {
            this._respondError(msg, user_nkey, serverId, 'Token missing userId or organizationId')
            return
        }

        if (this.revokedUsers.has(userId)) {
            logger.warn({ msg: 'Auth callout: access denied for revoked user', userId })
            this._respondError(msg, user_nkey, serverId, 'User access revoked')
            return
        }

        const permissions = computePermissions(userId, organizationId)
        const signingConfig = { algorithm: this.algorithm, keyPair: this.accountKeyPair }

        const userJwt = createUserJwt({
            userNkey: user_nkey,
            accountPublicKey: this.accountPublicKey,
            permissions,
            signingConfig,
            accountName: this.accountName,
            ttl: this.userJwtTtl,
        })

        const responseJwt = createAuthResponseJwt({
            userNkey: user_nkey,
            serverId,
            accountPublicKey: this.accountPublicKey,
            userJwt,
            signingConfig,
        })

        logger.info({
            msg: 'Auth callout: access granted',
            userId,
            organizationId,
        })

        msg.respond(new TextEncoder().encode(responseJwt))
    }

    _respondError (msg, userNkey, serverId, errorMessage) {
        logger.warn({ msg: 'Auth callout: access denied', reason: errorMessage })
        const signingConfig = { algorithm: this.algorithm, keyPair: this.accountKeyPair }

        const responseJwt = createAuthResponseJwt({
            userNkey,
            serverId,
            accountPublicKey: this.accountPublicKey,
            error: errorMessage,
            signingConfig,
        })

        msg.respond(new TextEncoder().encode(responseJwt))
    }

    revokeUser (userId) {
        this.revokedUsers.add(userId)
    }

    unrevokeUser (userId) {
        this.revokedUsers.delete(userId)
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

module.exports = { NatsAuthCalloutService }
