const { getLogger } = require('@open-condo/keystone/logging')
const { getRedisClient } = require('@open-condo/keystone/redis')

const TelegramAuthBotController = require('@condo/domains/user/integration/telegram/BotController')
const {
    TELEGRAM_AUTH_STATUS_PENDING,
    TELEGRAM_AUTH_STATUS_ERROR,
    TELEGRAM_AUTH_STATUS_SUCCESS,
    TELEGRAM_AUTH_REDIS_TTL,
} = require('@condo/domains/user/integration/telegram/constants')
const {
    getUserType,
    generateStartLinkAndKey,
    generateUniqueKey,
    getRedisStartKey,
    getRedisTokenKey,
    getRedisStatusKey,
} = require('@condo/domains/user/integration/telegram/utils')

const logger = getLogger('telegram-auth')
const redisClient = getRedisClient()

class TelegramAuthRoutes {
    #telegramAuthBot = new TelegramAuthBotController()

    constructor () {
        this.#telegramAuthBot.init()
    }

    async startAuth (req, res, next) {
        try {
            const { startLink, startKey } = generateStartLinkAndKey()
            const userType = getUserType(req)
            const uniqueKey = generateUniqueKey()

            await Promise.all([
                redisClient.set(getRedisStartKey(startKey), JSON.stringify({ uniqueKey, userType }), 'EX', TELEGRAM_AUTH_REDIS_TTL),
                redisClient.set(getRedisStatusKey(uniqueKey), TELEGRAM_AUTH_STATUS_PENDING, 'EX', TELEGRAM_AUTH_REDIS_TTL),
            ])

            return res.json({ startLink, uniqueKey })
        } catch (error) {
            logger.error({ msg: 'Telegram auth start error', reqId: req.id, error })
            next(error)
        }
    }

    async getAuthToken (req, res, next) {
        try {
            const { uniqueKey } = req.body

            if (!uniqueKey) {
                return res.status(400).json({ status: TELEGRAM_AUTH_STATUS_ERROR, message: 'Missing uniqueKey' })
            }

            const [status, token] = await Promise.all([
                redisClient.get(getRedisStatusKey(uniqueKey)),
                redisClient.get(getRedisTokenKey(uniqueKey)),
            ])

            if (!status) {
                return res.status(400).json({ status: TELEGRAM_AUTH_STATUS_ERROR, message: 'uniqueKey is expired' })
            }

            if (status === TELEGRAM_AUTH_STATUS_PENDING) {
                return res.json({ status })
            }

            if (status === TELEGRAM_AUTH_STATUS_SUCCESS && token) {
                await Promise.all([
                    redisClient.del(getRedisStatusKey(uniqueKey)),
                    redisClient.del(getRedisTokenKey(uniqueKey)),
                ])
                return res.json({ status, token })
            }

            return res.json({ status: TELEGRAM_AUTH_STATUS_ERROR, message: 'Unexpected state' })
        } catch (error) {
            logger.error({ msg: 'Telegram auth status error', reqId: req.id, error })
            next(error)
        }
    }
}

module.exports = { TelegramAuthRoutes }
