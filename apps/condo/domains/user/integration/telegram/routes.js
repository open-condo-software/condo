const { v4: uuid } = require('uuid')

const { getLogger } = require('@open-condo/keystone/logging')
const { getRedisClient } = require('@open-condo/keystone/redis')

const TelegramAuthBotController = require('./BotController')
const { STATUS_SUCCESS, STATUS_ERROR, STATUS_PENDING } = require('./constants')
const { getUniqueKey } = require('./utils')

const TELEGRAM_AUTH_BOT_URL = process.env.TELEGRAM_AUTH_BOT_URL

const logger = getLogger('telegram-auth')
const redisClient = getRedisClient()

class TelegramAuthRoutes {
    #telegramAuthBot = new TelegramAuthBotController()

    constructor () {
        this.#telegramAuthBot.init()
    }

    async startAuth (req, res, next) {
        const reqId = req.id

        try {
            const startKey = uuid()
            const uniqueKey = getUniqueKey()
            const startLink = `${TELEGRAM_AUTH_BOT_URL}?start=${startKey}`

            await redisClient.set(`telegram:start:${startKey}`, uniqueKey, 'EX', 300)
            await redisClient.set(`telegram:auth:${uniqueKey}`, STATUS_PENDING, 'EX', 300)

            return res.send({ startLink, uniqueKey })
        } catch (error) {
            logger.error({ msg: 'Telegram auth start error', reqId, error })
            return next(error)
        }
    }

    async getAuthStatus (req, res, next) {
        const reqId = req.id

        try {
            const { uniqueKey } = req.body

            if (!uniqueKey) {
                return res.status(400).send({ status: 'error', message: 'Missing uniqueKey' })
            }

            const token = await redisClient.get(`telegram:auth:${uniqueKey}`)

            if (token === null) {
                return res.status(400).send({ status: STATUS_ERROR, message: 'uniqueKey is expired' })
            } else if (token === STATUS_PENDING) {
                return res.send({ status: STATUS_PENDING })
            } else {
                await redisClient.del(`telegram:auth:${uniqueKey}`)
                return res.send({ token, status: STATUS_SUCCESS })
            }
        } catch (error) {
            logger.error({ msg: 'Telegram auth status error', reqId, error })
            return next(error)
        }
    }
}

module.exports = {
    TelegramAuthRoutes,
}
