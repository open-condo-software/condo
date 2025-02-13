const { get } = require('lodash')
const TelegramBot = require('node-telegram-bot-api')

const conf = require('@open-condo/config')
const { getRedisClient } = require('@open-condo/keystone/redis')
const { getSchemaCtx } = require('@open-condo/keystone/schema')
const { i18n } = require('@open-condo/locales/loader')

const {
    TELEGRAM_AUTH_STATUS_PENDING,
    TELEGRAM_AUTH_STATUS_SUCCESS,
} = require('@condo/domains/user/integration/telegram/constants')
const { syncUser } = require('@condo/domains/user/integration/telegram/sync/syncUser')
const {
    startAuthedSession,
    getRedisBotStateKey,
    getRedisStartKey,
    getRedisTokenKey,
    getRedisStatusKey,
} = require('@condo/domains/user/integration/telegram/utils')

const TELEGRAM_AUTH_BOT_TOKEN = conf.TELEGRAM_AUTH_BOT_TOKEN
const redisClient = getRedisClient()

class TelegramAuthBotController {
    #bot = null
    constructor () {
        if (TELEGRAM_AUTH_BOT_TOKEN) {
            this.#bot = new TelegramBot(TELEGRAM_AUTH_BOT_TOKEN, { polling: true })
        }
    }

    init () {
        if (this.#bot) {
            this.#bot.onText(/\/start (.+)/, this.#handleStart.bind(this))
            this.#bot.on('contact', this.#handleContact.bind(this))
        }
    }

    async #handleStart (message, match) {
        const chatId = get(message, 'chat.id')
        const locale = get(message, 'from.language_code', conf.DEFAULT_LOCALE)
        const startKey = match[1]

        if (!chatId || !startKey) return

        const startData = await redisClient.get(getRedisStartKey(startKey))
        await  redisClient.del(getRedisStartKey(startKey))

        if (!startData) {
            return this.#sendMessage(chatId, 'telegram.auth.error', locale)
        }

        await redisClient.set(getRedisBotStateKey(chatId), startData, 'EX', 300)

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

        const {
            phone_number: phoneNumber,
            first_name: firstName,
            last_name: lastName,
            user_id: userId,
        } = contact

        if (fromId !== userId) {
            return this.#sendMessage(chatId, 'telegram.auth.contact.wrongContact', locale)
        }

        const startData = await redisClient.get(getRedisBotStateKey(chatId))
        await redisClient.del(getRedisBotStateKey(chatId))

        if (!startData) {
            return this.#sendMessage(chatId, 'telegram.auth.error', locale)
        }

        await this.#authenticateUser(chatId, startData, { phoneNumber, firstName, lastName, userId }, locale)
    }

    async #authenticateUser (chatId, startData, userInfo, locale) {
        let uniqueKey, userType
        try {
            ({ uniqueKey, userType } = JSON.parse(startData))

            const status = await redisClient.get(getRedisStatusKey(uniqueKey))
            if (status !== TELEGRAM_AUTH_STATUS_PENDING) {
                return this.#sendMessage(chatId, 'telegram.auth.error', locale)
            }

            const { keystone: context } = getSchemaCtx('User')
            const { id } = await syncUser({ context, userInfo, userType })
            const token = await startAuthedSession(id, context._sessionManager._sessionStore)

            await Promise.all([
                redisClient.set(getRedisTokenKey(uniqueKey), token, 'EX', 300),
                redisClient.set(getRedisStatusKey(uniqueKey), TELEGRAM_AUTH_STATUS_SUCCESS, 'EX', 300),
            ])

            this.#sendMessage(chatId, 'telegram.auth.contact.complete', locale)
        } catch (error) {
            this.#sendMessage(chatId, 'telegram.auth.error', locale)
        }
    }

    #sendMessage (chatId, translationKey, locale, options = {}) {
        const messageText = i18n(translationKey, { locale })
        this.#bot.sendMessage(chatId, messageText, options)
    }
}

module.exports = TelegramAuthBotController
