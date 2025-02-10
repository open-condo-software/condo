const connectRedis = require('connect-redis')
const cookieSignature = require('cookie-signature')
const session = require('express-session')
const { get } = require('lodash')
const TelegramBot = require('node-telegram-bot-api')
const uidSafe = require('uid-safe').sync

const conf = require('@open-condo/config')
const { getRedisClient } = require('@open-condo/keystone/redis')
const { getSchemaCtx } = require('@open-condo/keystone/schema')
const { setSession } = require('@open-condo/keystone/session')
const { i18n } = require('@open-condo/locales/loader')

const { syncUser } = require('./sync/syncUser')

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

function escapeMarkdownV2 (text) {
    return text.replace(/([_*[\]()~`>#+=|{}.!/:;"'^$%&])/g, '\\$1')
}

class TelegramAuthBotController {
    #bot = null

    constructor () {
        this.#bot = new TelegramBot(TELEGRAM_AUTH_BOT_TOKEN, { polling: true })
    }

    init () {
        this.#bot.onText(/\/start (.+)/, async (message, match) => {
            const chatId = get(message, 'chat.id', null)
            const locale = get(message, 'from.language_code', conf.DEFAULT_LOCALE)
            const startKey = match[1]
            
            if (!chatId || !startKey) return

            await redisClient.set(`telegram-auth:pending:${chatId}`, startKey, 'EX', 300)
            const shareButtonText = i18n('telegram.auth.start.shareButton', { locale })
            const responseMessageText = i18n('telegram.auth.start.response', { locale })
            const options = {
                parse_mode: 'MarkdownV2',
                reply_markup: {
                    keyboard: [
                        [
                            {
                                text: shareButtonText,
                                request_contact: true,
                            },
                        ],
                    ],
                    one_time_keyboard: true,
                    resize_keyboard: true,
                },
            }

            this.#bot.sendMessage(chatId, escapeMarkdownV2(responseMessageText), options)
        })

        this.#bot.on('contact', async (message) => {
            const chatId = get(message, 'chat.id', null)
            const fromId = get(message, 'from.id', null)
            const contact = get(message, 'contact', null)
            const locale = get(message, 'from.language_code', conf.DEFAULT_LOCALE)

            if (!chatId || !contact) return

            const { phone_number: phoneNumber, first_name: firstName, user_id: userId } = contact

            if (fromId !== userId) {
                const wrongContactText = i18n('telegram.auth.contact.wrongContact', { locale })
                return this.#bot.sendMessage(chatId, escapeMarkdownV2(wrongContactText), { parse_mode: 'MarkdownV2' })
            }

            const startKey = await redisClient.get(`telegram-auth:pending:${chatId}`)
            if (!startKey) {
                const notFoundStartKeyText = i18n('telegram.auth.contact.notFoundStartkey', { locale })
                return this.#bot.sendMessage(chatId, escapeMarkdownV2(notFoundStartKeyText), { parse_mode: 'MarkdownV2' })
            }

            const { keystone: context } = getSchemaCtx('User')

            const { id } = await syncUser({ context, userInfo: { phoneNumber, firstName }, userType: 'telegram' })
            
            const token = await startAuthedSession(id)
            const uniqueKey = await redisClient.get(`telegram:start:${startKey}`)

            await redisClient.set(`telegram:auth:${uniqueKey}`, token, 'EX', 300)
            const completeText = i18n('telegram.auth.contact.complete', { locale })
            this.#bot.sendMessage(chatId, escapeMarkdownV2(completeText), { parse_mode: 'MarkdownV2' })
        })
    }
}

module.exports = TelegramAuthBotController
