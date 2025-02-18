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
    validateTelegramAuthConfig,
    getAuthLink,
    signUniqueKey,
    verifyUniqueKey,
} = require('@condo/domains/user/integration/telegram/utils')

const { syncUser } = require('./sync/syncUser')
const { startAuthedSession } = require('./utils')

const TELEGRAM_AUTH_CONFIG = conf.TELEGRAM_AUTH_CONFIG ? JSON.parse(conf.TELEGRAM_AUTH_CONFIG) : {}
const logger = getLogger('telegram-auth')
const redisClient = getRedisClient()

class TelegramAuthRoutes {
    constructor () {
        validateTelegramAuthConfig(TELEGRAM_AUTH_CONFIG)
    }

    async startAuth (req, res, next) {
        try {
            const userType = getUserType(req)
            const checks = { nonce: generators.nonce(), state: generators.state() }
            const { startLink, uniqueKey } = await fetch(getAuthLink(TELEGRAM_AUTH_CONFIG, checks)).then(res => res.json())

            if (!startLink || !uniqueKey) {
                return res.status(500).json({ status: TELEGRAM_AUTH_STATUS_ERROR, message: 'Internal server error' })
            }

            await redisClient.set(
                getRedisStateKey(uniqueKey),
                JSON.stringify({ status: TELEGRAM_AUTH_STATUS_PENDING, token: null, payload: { userType, checks } }),
                'EX', TELEGRAM_AUTH_REDIS_TTL
            )
            //client gets signed token that we can verify and pass in redis as key
            return res.json({ startLink, uniqueKey: signUniqueKey(uniqueKey, TELEGRAM_AUTH_CONFIG.secretKey) })
        } catch (error) {
            logger.error({ msg: 'Telegram auth start error', reqId: req.id, error })
            next(error)
        }
    }

    async completeAuth (req, res, next) {
        try {
            const { authCode, state, uniqueKey } = req.query
            const session = parseJson(await redisClient.get(getRedisStateKey(uniqueKey)))
            if (!session || session.payload.checks.state !== state) return res.end()

            const tokenData = await fetch(TELEGRAM_AUTH_CONFIG.tokenUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    authCode,
                    clientId: TELEGRAM_AUTH_CONFIG.clientId,
                    clientSecret: TELEGRAM_AUTH_CONFIG.clientSecret,
                    redirectUri: TELEGRAM_AUTH_CONFIG.callbackUrl,
                }),
            }).then(res => res.json())

            if (!tokenData.idToken) {
                logger.error({ msg: 'Telegram auth no id token', reqId })
                return res.end()
            }

            const decodedToken = decodeIdToken(tokenData.idToken)
            if (session.payload.checks.nonce !== decodedToken.nonce) return res.end()

            const userInfo = {
                userId: decodedToken.sub,
                name: `${decodedToken.firstName} ${decodedToken.lastName || ''}`.trim(),
                phoneNumber: decodedToken.phoneNumber,
            }

            const { keystone: context } = getSchemaCtx('User')
            const { id } = await syncUser({ context, userInfo, userType: session.payload.userType })
            const token = await startAuthedSession(id, context._sessionManager._sessionStore)

            await redisClient.set(
                getRedisStateKey(uniqueKey),
                JSON.stringify({ status: TELEGRAM_AUTH_STATUS_SUCCESS, token, payload: session.payload }),
                'EX', TELEGRAM_AUTH_REDIS_TTL
            )

            return res.end()
        } catch (error) {
            logger.error({ msg: 'Telegram auth callback error', err: error, reqId: req.id })
            next(error)
        }
    }

    async getAuthToken (req, res, next) {
        try {
            const { uniqueKey } = req.body
            if (!uniqueKey) return res.status(400).json({ status: TELEGRAM_AUTH_STATUS_ERROR, message: 'Missing uniqueKey' })

            const verifiedUniqueKey = verifyUniqueKey(uniqueKey, TELEGRAM_AUTH_CONFIG.secretKey)

            if (!verifiedUniqueKey) return res.status(400).json({ status: TELEGRAM_AUTH_STATUS_ERROR, message: 'uniqueKey is incorrect' })
            
            const session = parseJson(await redisClient.get(getRedisStateKey(verifiedUniqueKey)))
            if (!session) return res.status(400).json({ status: TELEGRAM_AUTH_STATUS_ERROR, message: 'uniqueKey is expired' })

            return res.json(session.status === TELEGRAM_AUTH_STATUS_SUCCESS && session.token
                ? { status: session.status, token: session.token }
                : { status: session.status })
        } catch (error) {
            logger.error({ msg: 'Telegram auth status error', reqId: req.id, error })
            next(error)
        }
    }
}

module.exports = { TelegramAuthRoutes }
