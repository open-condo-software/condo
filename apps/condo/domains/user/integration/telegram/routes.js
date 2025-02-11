const crypto = require('crypto')

const { v4: uuid } = require('uuid')

const { getLogger } = require('@open-condo/keystone/logging')
const { getRedisClient } = require('@open-condo/keystone/redis')

const TelegramAuthBotController = require('@condo/domains/user/integration/telegram/BotController')
const {
    TELEGRAM_AUTH_STATUS_PENDING,
    TELEGRAM_AUTH_STATUS_ERROR,
    TELEGRAM_AUTH_STATUS_SUCCESS,
    TELEGRAM_AUTH_REDIS_START,
    TELEGRAM_AUTH_REDIS_TOKEN,
} = require('@condo/domains/user/integration/telegram/constants')
const { getUserType } = require('@condo/domains/user/integration/telegram/utils')

const TELEGRAM_AUTH_BOT_URL = process.env.TELEGRAM_AUTH_BOT_URL

const logger = getLogger('telegram-auth')
const redisClient = getRedisClient()

class TelegramAuthRoutes {
    #telegramAuthBot = new TelegramAuthBotController()

    constructor () {
        this.#telegramAuthBot.init()
    }

    async startAuth (req, res, next) {
        try {
            const userType = getUserType(req)
            const startKey = uuid()
            const uniqueKey = crypto.randomBytes(32).toString('hex')
            const startLink = `${TELEGRAM_AUTH_BOT_URL}?start=${startKey}`

            await Promise.all([
                redisClient.set(`${TELEGRAM_AUTH_REDIS_START}${startKey}`, JSON.stringify({ uniqueKey, userType }), 'EX', 300),
                redisClient.set(`${TELEGRAM_AUTH_REDIS_TOKEN}${uniqueKey}`, TELEGRAM_AUTH_STATUS_PENDING, 'EX', 300),
            ])

            res.send({ startLink, uniqueKey })
        } catch (error) {
            logger.error({ msg: 'Telegram auth start error', reqId: req.id, error })
            next(error)
        }
    }

    async getAuthStatus (req, res, next) {
        try {
            const { uniqueKey } = req.body
            if (!uniqueKey) {
                return res.status(400).json({ status: 'error', message: 'Missing uniqueKey' })
            }

            const token = await redisClient.get(`${TELEGRAM_AUTH_REDIS_TOKEN}${uniqueKey}`)
            if (token === null) {
                return res.status(400).json({ status: TELEGRAM_AUTH_STATUS_ERROR, message: 'uniqueKey is expired' })
            }

            if (token === TELEGRAM_AUTH_STATUS_PENDING) {
                return res.json({ status: TELEGRAM_AUTH_STATUS_PENDING })
            }

            await redisClient.del(`${TELEGRAM_AUTH_REDIS_TOKEN}${uniqueKey}`)
            res.json({ token, status: TELEGRAM_AUTH_STATUS_SUCCESS })
        } catch (error) {
            logger.error({ msg: 'Telegram auth status error', reqId: req.id, error })
            next(error)
        }
    }
}

module.exports = { TelegramAuthRoutes }
