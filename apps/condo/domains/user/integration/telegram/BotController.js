const connectRedis = require('connect-redis')
const session = require('express-session')
const IORedis = require('ioredis')
const { get } = require('lodash')
const TelegramBot = require('node-telegram-bot-api')
const uidSafe = require('uid-safe').sync

const conf = require('@open-condo/config')
const { getLogger } = require('@open-condo/keystone/logging')
const { getRedisClient } = require('@open-condo/keystone/redis')
const { getSchemaCtx } = require('@open-condo/keystone/schema')
const { setSession } = require('@open-condo/keystone/session')

const cookieSignature = require('cookie-signature')

const { syncUser } = require('./sync/syncUser')

const { User } = require('../../utils/serverSchema')



const TELEGRAM_AUTH_BOT_TOKEN = process.env.TELEGRAM_AUTH_BOT_TOKEN

const redisClient = getRedisClient()
const RedisStore = connectRedis(session)
const sessionStore = new RedisStore({ client: redisClient })

async function startAuthedSession (userId) {
    const id = uidSafe(24)
    const payload = {
        sessionId: id,
        keystoneListKey: 'User',
        keystoneItemId: userId,
    }
    await setSession(sessionStore, payload)
    return cookieSignature.sign(id, conf.COOKIE_SECRET)
}

class TelegramAuthBotController {
    #bot = null

    constructor () {
        this.#bot = new TelegramBot(TELEGRAM_AUTH_BOT_TOKEN, { polling: true })
    }

    init () {
        this.#bot.onText(/\/start (.+)/, async (message, match) => {
            const chatId = get(message, 'chat.id', null)
            const startKey = match[1]

            if (!chatId || !startKey) return

            await redisClient.set(`telegram-auth:pending:${chatId}`, startKey, 'EX', 300)

            const options = {
                parse_mode: 'MarkdownV2',
                reply_markup: {
                    keyboard: [
                        [
                            {
                                text: '📱 Поделиться номером',
                                request_contact: true,
                            },
                        ],
                    ],
                    one_time_keyboard: true,
                    resize_keyboard: true,
                },
            }

            this.#bot.sendMessage(chatId, 'Поделитесь своим контактом', options)
        })

        this.#bot.on('contact', async (message) => {
            const chatId = get(message, 'chat.id', null)
            const fromId = get(message, 'from.id', null)
            const contact = get(message, 'contact', null)

            if (!chatId || !contact) return

            const { phone_number: phoneNumber, first_name: firstName, user_id: userId } = contact

            if (fromId !== userId) {
                return this.#bot.sendMessage(chatId, 'Поделитесь своим контактом')
            }

            const startKey = await redisClient.get(`telegram-auth:pending:${chatId}`)
            if (!startKey) return this.#bot.sendMessage(chatId, 'Ошибка: ключ авторизации не найден. Начните авторизацию заново')

            const { keystone: context } = getSchemaCtx('User')

            const { id } = await syncUser({ context, userInfo: { phoneNumber, firstName }, userType: 'telegram' })
            
            const token = await startAuthedSession(id)
            const uniqueKey = await redisClient.get(`telegram:start:${startKey}`)
            await redisClient.set(`telegram:auth:${uniqueKey}`, token, 'EX', 300)

            this.#bot.sendMessage(chatId, '✅ Авторизация завершена! Вернитесь в приложение.')
        })
    }
}

module.exports = TelegramAuthBotController
