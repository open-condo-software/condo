const { generators } = require('openid-client')

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
    generateUniqueKey,
    getRedisTokenKey,
    getRedisStatusKey,
} = require('@condo/domains/user/integration/telegram/utils')


const { syncUser } = require('./sync/syncUser')
const { startAuthedSession } = require('./utils')


const logger = getLogger('telegram-auth')
const redisClient = getRedisClient()

class TelegramAuthRoutes {
    async startAuth (req, res, next) {
        try {
            const checks = { nonce: generators.nonce(), state: generators.state() }

            const response = await fetch(`https://auth-bot.app.localhost:8009/telegram/authorize?nonce=${checks.nonce}&state=${checks.state}`)
            const { startLink, reqId } = await response.json()

            const userType = getUserType(req)
            const uniqueKey = generateUniqueKey()

            redisClient.set(getRedisStatusKey(uniqueKey), TELEGRAM_AUTH_STATUS_PENDING, 'EX', TELEGRAM_AUTH_REDIS_TTL)

            return res.json({ startLink, uniqueKey })
        } catch (error) {
            logger.error({ msg: 'Telegram auth start error', reqId: req.id, error })
            next(error)
        }
    }

    async completeAuth (req, res, next) {
        const reqId = req.id
        try {
            const { authCode } = req.query
            const response = await fetch(`https://auth-bot.app.localhost:8009/telegram/token?authCode=${authCode}`)
            const data = await response.json()

            const userinfoResponse = await fetch('https://auth-bot.app.localhost:8009/telegram/userinfo', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ accessToken: data.accessToken }),
            })

            const userinfo = await userinfoResponse.json()

            // const { id } = await syncUser({ context, userInfo, userType })
            //
            // return await this.#authenticateUser(req, res, context, id)
            res.end()
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

    // async #authenticateUser (chatId, startData, userInfo, locale) {
    //     try {
    //         const { uniqueKey, userType } = JSON.parse(startData)
    //
    //         const status = await redisClient.get(getRedisStatusKey(uniqueKey))
    //         if (status !== TELEGRAM_AUTH_STATUS_PENDING) {
    //             return this.#sendMessage(chatId, 'telegram.auth.error', locale)
    //         }
    //
    //         const { keystone: context } = getSchemaCtx('User')
    //         const { id } = await syncUser({ context, userInfo, userType })
    //         const token = await startAuthedSession(id, context._sessionManager._sessionStore)
    //
    //         this.#sendMessage(chatId, 'telegram.auth.contact.complete', locale)
    //     } catch (error) {
    //         this.#sendMessage(chatId, 'telegram.auth.error', locale)
    //     }
    // }
}

module.exports = { TelegramAuthRoutes }
