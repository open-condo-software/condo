const http2 = require('http2')

const { isEmpty, get } = require('lodash')

const { getLogger } = require('@open-condo/keystone/logging')
const { getRedisClient } = require('@open-condo/keystone/redis')

const { getCurrTimeStamp } = require('@condo/domains/common/utils/date')
const { RedisGuard } = require('@condo/domains/user/utils/serverSchema/guards')

const SESSION_LIFE_TIME = 60 * 60 * 24
const SESSION_PING_INTERVAL = 60
// const APPLE_API_ENDPOINT = 'https://api.sandbox.push.apple.com'
const APPLE_API_ENDPOINT = 'https://api.push.apple.com'

const logger = getLogger('APNs Session')

/**
 * http2 session handler, connects to url or APPLE_API_ENDPOINT and keeps connection open for SESSION_LIFE_TIME seconds,
 * so it can be reused multiple times. For each worker separate connection will be created.
 * Pings backend each SESSION_PING_INTERVAL seconds, closes connection after SESSION_LIFE_TIME seconds and reopens new one.
 * Takes care of session breakage, reopens session on demand.
 *
 * Usage: const session = new AppleSession(); session.request(...); session.errorHandler(error);
 */
class AppleSession {
    #ENDPOINT = null
    #session = null
    #expires = null
    #timerId = null
    #redisGuard = new RedisGuard()
    #redisClient = getRedisClient()
    #channel = 'guard_lock:apple_session'

    constructor (url = APPLE_API_ENDPOINT) {
        this.disconnect = this.disconnect.bind(this)
        this.errorHandler = this.errorHandler.bind(this)
        this.pingHandler = this.pingHandler.bind(this)
        this.request = this.request.bind(this)
        this.#ENDPOINT = url
    }

    /**
     * Checks is session is still alive
     * @returns {boolean}
     */
    #validateSession () {
        return !(isEmpty(this.#session) || get(this.#session, 'closed') || get(this.#session, 'destroyed'))
    }

    /**
     * Closes session if it is still alive, cleans session data and ping interval
     */
    async disconnect () {
        if (this.#timerId) clearInterval(this.#timerId)
        if (this.#validateSession()) this.#session.close()
        await this.#redisGuard.unlock('apple_session', 'connect')

        this.#session = null
        this.#expires = null
    }

    /**
     * Handles ping replies from backend
     * @param error
     */
    pingHandler (error) {
        if (error) this.errorHandler(error)
    }

    /**
     * Handles session errors, closes session, logs errors
     * @param error
     */
    async errorHandler (error) {
        await this.disconnect()

        logger.error({ msg: 'sessionErrorHandler', error })
    }

    async #setupConnection (currTime) {
        this.#expires = currTime + SESSION_LIFE_TIME
        await this.#redisGuard.lock('apple_session', 'connect')
        this.#session = http2.connect(this.#ENDPOINT)

        this.#session.on('error', this.errorHandler)
        this.#session.on('socketError', this.errorHandler)
        this.#session.on('goaway', this.errorHandler)

        this.#timerId = setInterval(this.pingHandler, SESSION_PING_INTERVAL * 1000)
    }

    /**
     * Created new session if not alive yet, forced or previous session is expired. Does nothing in other case.
     * Sets error handler on some session events. Sets ping interval to check session health.
     * @param force
     */
    async #connect (force = false) {
        const currTime = getCurrTimeStamp()
        const isExpired = !isEmpty(this.#expires) && currTime >= this.#expires

        if (this.#validateSession() && !force && !isExpired) return
        if (isExpired) await this.disconnect()

        const isLocked = await this.#redisGuard.isLocked('apple_session', 'connect')
        if (isLocked) {
            this.#redisClient.subscribe(this.#channel)
            this.#redisClient.on('message', async (channel, message) => {
                if (message === 'key_deleted') {
                    await this.#setupConnection()
                    return
                }
            })
        } else {
            await this.#setupConnection()
        }
    }

    async request (...args) {
        await this.#connect()

        return await this.#session.request(...args)
    }

    /**
     * Creates session if no alive session available then returns current session object
     * @returns {session}
     */
    async get () {
        await this.#connect()

        return this.#session
    }
}

module.exports = AppleSession