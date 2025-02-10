const { v4: uuid } = require('uuid')

const { getLogger } = require('@open-condo/keystone/logging')
const { getRedisClient } = require('@open-condo/keystone/redis')

const TelegramAuthBotController = require('./BotController')
const { getUniqueKey } = require('./utils')

const TELEGRAM_AUTH_BOT_URL = process.env.TELEGRAM_AUTH_BOT_URL
const TELEGRAM_AUTH_BOT_WHITE_LIST = process.env.TELEGRAM_AUTH_BOT_WHITE_LIST ? JSON.parse(process.env.TELEGRAM_AUTH_BOT_WHITE_LIST) : []

const logger = getLogger('telegram-auth')
const redisClient = getRedisClient()

class TelegramAuthRoutes {
    #telegramAuthBot = new TelegramAuthBotController()

    constructor () {
        this.#telegramAuthBot.init()
    }

    async startAuth (req, res, next) {
        try {
            const startKey = uuid()
            const uniqueKey = getUniqueKey()
            const startLink = `${TELEGRAM_AUTH_BOT_URL}?start=${startKey}`

            await redisClient.set(`telegram:start:${startKey}`, uniqueKey, 'EX', 300)
            await redisClient.set(`telegram:auth:${uniqueKey}`, '', 'EX', 300)

            return res.send({ startLink, uniqueKey })
        } catch (error) {
            return next(error)
        }
    }

    async getAuthStatus (req, res, next) {
        try {
            const { uniqueKey } = req.body

            if (!uniqueKey) {
                return res.status(400).send({ status: 'error', message: 'Missing uniqueKey' })
            }

            const token = await redisClient.get(`telegram:auth:${uniqueKey}`)

            if (token) {
                await redisClient.del(`telegram:auth:${uniqueKey}`)
                return res.send({ token, status: 'ok' })
            }

            return res.send({ status: 'none' })
        } catch (error) {
            return next(error)
        }
    }
}

module.exports = {
    TelegramAuthRoutes,
}
