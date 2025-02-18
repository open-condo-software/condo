const { generators } = require('openid-client')

const conf = require('@open-condo/config')
const { fetch } = require('@open-condo/keystone/fetch')
const { getLogger } = require('@open-condo/keystone/logging')
const { getRedisClient } = require('@open-condo/keystone/redis')
const { getSchemaCtx } = require('@open-condo/keystone/schema')

const {
    TELEGRAM_AUTH_STATUS_PENDING,
    TELEGRAM_AUTH_STATUS_ERROR,
    TELEGRAM_AUTH_STATUS_SUCCESS,
    TELEGRAM_AUTH_REDIS_TTL,
} = require('@condo/domains/user/integration/telegram/constants')
const {
    getUserType,
    getRedisStateKey,
    decodeIdToken,
    parseJson,
} = require('@condo/domains/user/integration/telegram/utils')

const { syncUser } = require('./sync/syncUser')
const { startAuthedSession } = require('./utils')

const TELEGRAM_AUTH_CONFIG = conf.TELEGRAM_AUTH_CONFIG ? JSON.parse(conf.TELEGRAM_AUTH_CONFIG) : {}

const logger = getLogger('telegram-auth')
const redisClient = getRedisClient()

class TelegramAuthRoutes {
    async startAuth (req, res, next) {
        try {
            const userType = getUserType(req)
            const checks = { nonce: generators.nonce(), state: generators.state() }
            const callbackUri = TELEGRAM_AUTH_CONFIG.callbackUrl

            const link = new URL(TELEGRAM_AUTH_CONFIG.authUrl)
            link.searchParams.set('state', checks.state)
            link.searchParams.set('clientId', TELEGRAM_AUTH_CONFIG.clientId)
            link.searchParams.set('redirectUri', callbackUri)
            link.searchParams.set('nonce', checks.nonce)

            const response = await fetch(link.toString())
            const { startLink, uniqueKey } = await response.json()

            await redisClient.set(
                getRedisStateKey(uniqueKey),
                JSON.stringify({ status: TELEGRAM_AUTH_STATUS_PENDING, token: null, payload: { userType } }),
                'EX',
                TELEGRAM_AUTH_REDIS_TTL
            )

            return res.json({ startLink, uniqueKey })
        } catch (error) {
            logger.error({ msg: 'Telegram auth start error', reqId: req.id, error })
            next(error)
        }
    }

    async completeAuth (req, res, next) {
        const reqId = req.id
        try {
            const { authCode, uniqueKey } = req.query
            const response = await fetch('https://auth-bot.app.localhost:8009/telegram/token', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ authCode, clientId: TELEGRAM_AUTH_CONFIG.clientId, clientSecret: TELEGRAM_AUTH_CONFIG.clientSecret }),
            })

            const data = await response.json()

            if (!data.idToken) {
                throw new Error('Missing idToken')
            }

            const idToken = data.idToken

            const decodedToken = decodeIdToken(idToken)
            const userInfo = {
                userId: decodedToken.sub,
                name: `${decodedToken.firstName} ${decodedToken.lastName ? decodedToken.lastName : ''}`,
                phoneNumber: decodedToken.phoneNumber,
            }

            let state = parseJson(await redisClient.get(getRedisStateKey(uniqueKey)))
            const { keystone: context } = getSchemaCtx('User')
            const { id } = await syncUser({ context, userInfo, userType: state.payload.userType })
            const token = await startAuthedSession(id, context._sessionManager._sessionStore)

            await redisClient.set(
                getRedisStateKey(uniqueKey),
                JSON.stringify({ status: TELEGRAM_AUTH_STATUS_SUCCESS, token, payload: state.payload }),
                'EX',
                TELEGRAM_AUTH_REDIS_TTL
            )

            return res.end()
        } catch (error) {
            logger.error({ msg: 'Telegram auth callback error', err: error, reqId })
            return next(error)
        }
    }

    async getAuthToken (req, res, next) {
        try {
            const { uniqueKey } = req.body
            if (!uniqueKey) {
                return res.status(400).json({ status: TELEGRAM_AUTH_STATUS_ERROR, message: 'Missing uniqueKey' })
            }

            const state = parseJson(await redisClient.get(getRedisStateKey(uniqueKey)))
            if (!state.status) {
                return res.status(400).json({ status: TELEGRAM_AUTH_STATUS_ERROR, message: 'uniqueKey is expired' })
            }

            if (state.status === TELEGRAM_AUTH_STATUS_PENDING) {
                return res.json({ status: state.status })
            }

            if (state.status === TELEGRAM_AUTH_STATUS_SUCCESS && state.token) {
                return res.json({ status: state.status, token: state.token })
            }

            return res.json({ status: TELEGRAM_AUTH_STATUS_ERROR })
        } catch (error) {
            logger.error({ msg: 'Telegram auth status error', reqId: req.id, error })
            next(error)
        }
    }
}

module.exports = { TelegramAuthRoutes }
