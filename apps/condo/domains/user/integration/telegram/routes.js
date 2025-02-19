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
    getRedisSessionKey,
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

//Currently anyone can use this auth but we want to restrict access for random clients

class TelegramAuthRoutes {
    constructor () {
        validateTelegramAuthConfig(TELEGRAM_AUTH_CONFIG)
    }

    async startAuth (req, res, next) {
        try {
            const userType = getUserType(req)
            const checks = { nonce: generators.nonce(), state: generators.state() }
            //Start link is url to telegram bot within start auth key
            //uniqueKey is helper to link responses from bot
            const { startLink, uniqueKey } = await fetch(getAuthLink(TELEGRAM_AUTH_CONFIG, checks)).then(res => res.json())

            if (!startLink || !uniqueKey) {
                return res.status(500).json({ status: TELEGRAM_AUTH_STATUS_ERROR, message: 'Internal server error' })
            }

            await redisClient.set(
                getRedisSessionKey(uniqueKey),
                JSON.stringify({
                    status: TELEGRAM_AUTH_STATUS_PENDING,
                    token: null,
                    payload: { userType, checks },
                }),
                'EX', TELEGRAM_AUTH_REDIS_TTL
            )
            //client gets signed token that we can verify and pass in redis as key
            //Probably just adding prefix for redis is enough but with sign we can be sure that noone can iterate over redis keys 
            return res.json({ startLink, uniqueKey: signUniqueKey(uniqueKey, TELEGRAM_AUTH_CONFIG.secretKey) })
        } catch (error) {
            logger.error({ msg: 'Telegram auth start error', reqId: req.id, error })
            next(error)
        }
    }

    async completeAuth (req, res, next) {
        try {
            //This handler protected by state value that exists only between condo and tg bot
            const { authCode, state, uniqueKey } = req.query
            const session = parseJson(await redisClient.get(getRedisSessionKey(uniqueKey)))
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

            if (!tokenData || !tokenData.idToken) {
                logger.error({ msg: 'Telegram auth no id token', reqId: req.id })
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
                getRedisSessionKey(uniqueKey),
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
            
            const session = parseJson(await redisClient.get(getRedisSessionKey(verifiedUniqueKey)))
            if (!session) return res.status(400).json({ status: TELEGRAM_AUTH_STATUS_ERROR, message: 'uniqueKey is expired' })

            if (session.status === TELEGRAM_AUTH_STATUS_SUCCESS && session.token) {
                //User got token and we can del all auth session data
                await redisClient.del(getRedisSessionKey(verifiedUniqueKey))
                return res.json({ status: session.status, token: session.token })
            } else {
                return res.json({ status: session.status })
            }
            

        } catch (error) {
            logger.error({ msg: 'Telegram auth status error', reqId: req.id, error })
            next(error)
        }
    }
}

module.exports = { TelegramAuthRoutes }
