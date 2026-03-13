const jwt = require('jsonwebtoken')
const { connect } = require('nats')
const nkeys = require('nkeys.js')

const conf = require('@open-condo/config')
const { getLogger } = require('@open-condo/keystone/logging')

const { decodeNatsJwt, createUserJwt, createAuthResponseJwt, computePermissions } = require('./natsJwt')

const { ADMIN_REVOKE_PREFIX, ADMIN_UNREVOKE_PREFIX, ADMIN_REVOKE_ORG_PREFIX, ADMIN_UNREVOKE_ORG_PREFIX } = require('../../core/topic')


const logger = getLogger()

const MESSAGING_CONFIG = conf.MESSAGING_CONFIG ? JSON.parse(conf.MESSAGING_CONFIG) : {}

const TOKEN_SECRET = MESSAGING_CONFIG.tokenSecret

const MAX_RESTART_DELAY_MS = 30000
const INITIAL_RESTART_DELAY_MS = 1000

class NatsAuthCalloutService {
    constructor () {
        this.connection = null
        this.accountKeyPair = null
        this.accountPublicKey = null
        this.isRunning = false
        this.revokedUsers = new Set()
        this.revokedUserOrgs = new Map()
        this._restartTimer = null
        this._restartDelay = INITIAL_RESTART_DELAY_MS
        this._intentionalStop = false
        this._lastConfig = {}
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
        this._lastConfig = config
        this._intentionalStop = false

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


            this.connection = await connect({
                servers: config.url || MESSAGING_CONFIG.brokerUrl,
                user: config.authUser || MESSAGING_CONFIG.authUser,
                pass: config.authPass || MESSAGING_CONFIG.authPassword,
                reconnect: true,
                maxReconnectAttempts: -1,
                reconnectTimeWait: 2000,
                reconnectJitter: 1000,
                reconnectJitterTLS: 2000,
            })

            const sub = this.connection.subscribe('$SYS.REQ.USER.AUTH')
            this.isRunning = true


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

            const revokeOrgSub = this.connection.subscribe(`${ADMIN_REVOKE_ORG_PREFIX}.>`)
            ;(async () => {
                for await (const msg of revokeOrgSub) {
                    const rest = msg.subject.slice(ADMIN_REVOKE_ORG_PREFIX.length + 1)
                    const [userId, organizationId] = rest.split('.')
                    if (userId && organizationId) this.revokeUserOrganization(userId, organizationId)
                }
            })()

            const unrevokeOrgSub = this.connection.subscribe(`${ADMIN_UNREVOKE_ORG_PREFIX}.>`)
            ;(async () => {
                for await (const msg of unrevokeOrgSub) {
                    const rest = msg.subject.slice(ADMIN_UNREVOKE_ORG_PREFIX.length + 1)
                    const [userId, organizationId] = rest.split('.')
                    if (userId && organizationId) this.unrevokeUserOrganization(userId, organizationId)
                }
            })()

            this.connection.closed().then((err) => {
                this.isRunning = false
                if (err) {
                    logger.error({ msg: 'Auth callout connection closed with error', err })
                }
                if (!this._intentionalStop) {
                    this._scheduleRestart()
                }
            })

            this._restartDelay = INITIAL_RESTART_DELAY_MS
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

        if (!userId) {
            this._respondError(msg, user_nkey, serverId, 'Token missing userId')
            return
        }

        if (this.revokedUsers.has(userId)) {
            logger.warn({ msg: 'Auth callout: access denied for revoked user', userId })
            this._respondError(msg, user_nkey, serverId, 'User access revoked')
            return
        }

        if (organizationId) {
            const revokedOrgs = this.revokedUserOrgs.get(userId)
            if (revokedOrgs && revokedOrgs.has(organizationId)) {
                logger.warn({ msg: 'Auth callout: access denied for revoked user-organization', userId, organizationId })
                this._respondError(msg, user_nkey, serverId, 'Organization access revoked')
                return
            }
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

    revokeUserOrganization (userId, organizationId) {
        if (!this.revokedUserOrgs.has(userId)) {
            this.revokedUserOrgs.set(userId, new Set())
        }
        this.revokedUserOrgs.get(userId).add(organizationId)
    }

    unrevokeUserOrganization (userId, organizationId) {
        const orgs = this.revokedUserOrgs.get(userId)
        if (orgs) {
            orgs.delete(organizationId)
            if (orgs.size === 0) {
                this.revokedUserOrgs.delete(userId)
            }
        }
    }

    _scheduleRestart () {
        if (this._restartTimer) return
        const delay = Math.min(this._restartDelay, MAX_RESTART_DELAY_MS)
        logger.warn({ msg: 'Scheduling auth callout service restart', delayMs: delay })
        this._restartTimer = setTimeout(async () => {
            this._restartTimer = null
            try {
                await this.start(this._lastConfig)
                logger.info({ msg: 'Auth callout service restarted successfully' })
            } catch (err) {
                logger.error({ msg: 'Auth callout service restart failed, will retry', err: err.message })
                this._restartDelay = Math.min(this._restartDelay * 2, MAX_RESTART_DELAY_MS)
                this._scheduleRestart()
            }
        }, delay)
        this._restartTimer.unref()
    }

    async stop () {
        this._intentionalStop = true
        if (this._restartTimer) {
            clearTimeout(this._restartTimer)
            this._restartTimer = null
        }
        if (this.connection) {
            await this.connection.drain()
            await this.connection.close()
            this.connection = null
            this.isRunning = false
        }
    }
}

module.exports = { NatsAuthCalloutService }
