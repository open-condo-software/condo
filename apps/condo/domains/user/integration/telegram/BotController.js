const { get } = require('lodash')
const TelegramBot = require('node-telegram-bot-api')

const conf = require('@open-condo/config')
const { getRedisClient } = require('@open-condo/keystone/redis')
const { getSchemaCtx } = require('@open-condo/keystone/schema')
const { i18n } = require('@open-condo/locales/loader')

const {
    TELEGRAM_AUTH_REDIS_START,
    TELEGRAM_AUTH_REDIS_PENDING,
    TELEGRAM_AUTH_REDIS_TOKEN,
} = require('@condo/domains/user/integration/telegram/constants')
const { syncUser } = require('@condo/domains/user/integration/telegram/sync/syncUser')
const { startAuthedSession } = require('@condo/domains/user/integration/telegram/utils')

const TELEGRAM_AUTH_BOT_TOKEN = process.env.TELEGRAM_AUTH_BOT_TOKEN
const redisClient = getRedisClient()

class TelegramAuthBotController {
    #bot

    constructor () {
        this.#bot = new TelegramBot(TELEGRAM_AUTH_BOT_TOKEN, { polling: true })
    }

    init () {
        this.#bot.onText(/\/start (.+)/, this.#handleStart.bind(this))
        this.#bot.on('contact', this.#handleContact.bind(this))
    }

    async #handleStart (message, match) {
        const chatId = get(message, 'chat.id')
        const locale = get(message, 'from.language_code', conf.DEFAULT_LOCALE)
        const startKey = match[1]

        if (!chatId || !startKey) return

        await redisClient.set(`${TELEGRAM_AUTH_REDIS_PENDING}${chatId}`, startKey, 'EX', 300)

        this.#sendMessage(chatId, 'telegram.auth.start.response', locale, {
            reply_markup: {
                keyboard: [[{ text: i18n('telegram.auth.start.shareButton', { locale }), request_contact: true }]],
                one_time_keyboard: true,
                resize_keyboard: true,
            },
        })
    }

    async #handleContact (message) {
        const chatId = get(message, 'chat.id')
        const fromId = get(message, 'from.id')
        const contact = get(message, 'contact')
        const locale = get(message, 'from.language_code', conf.DEFAULT_LOCALE)

        if (!chatId || !contact) return

        const { phone_number: phoneNumber, first_name: firstName, user_id: userId } = contact

        if (fromId !== userId) {
            return this.#sendMessage(chatId, 'telegram.auth.contact.wrongContact', locale)
        }

        const startKey = await redisClient.get(`${TELEGRAM_AUTH_REDIS_PENDING}${chatId}`)
        await redisClient.del(`${TELEGRAM_AUTH_REDIS_PENDING}${chatId}`)

        if (!startKey) {
            return this.#sendMessage(chatId, 'telegram.auth.contact.error', locale)
        }

        await this.#authenticateUser(chatId, startKey, { phoneNumber, firstName, userId }, locale)
    }

    async #authenticateUser (chatId, startKey, userInfo, locale) {
        let uniqueKey, userType
        try {
            const storedValue = await redisClient.get(`${TELEGRAM_AUTH_REDIS_START}${startKey}`)

            if (!storedValue) {
                return this.#sendMessage(chatId, 'telegram.auth.contact.error', locale)
            }

            ({ uniqueKey, userType } = JSON.parse(storedValue))
            await redisClient.del(`${TELEGRAM_AUTH_REDIS_START}${startKey}`)

            const { keystone: context } = getSchemaCtx('User')
            const { id } = await syncUser({ context, userInfo, userType })
            const token = await startAuthedSession(id, context._sessionManager._sessionStore)

            await redisClient.set(`${TELEGRAM_AUTH_REDIS_TOKEN}${uniqueKey}`, token, 'EX', 300)

            this.#sendMessage(chatId, 'telegram.auth.contact.complete', locale)
        } catch (error) {
            this.#sendMessage(chatId, 'telegram.auth.contact.error', locale)
        }
    }

    #sendMessage (chatId, translationKey, locale, options = {}) {
        const messageText = i18n(translationKey, { locale })
        this.#bot.sendMessage(chatId, messageText, options)
    }
}

module.exports = TelegramAuthBotController
