const axios = require('axios')
const { get } = require('lodash')

const conf = require('@open-condo/config')
const { getByCondition } = require('@open-condo/keystone/schema')

const { TELEGRAM_TRANSPORT } = require('@condo/domains/notification/constants/constants')
const { NO_TELEGRAM_CHAT_FOR_USER, NO_USER_ID_TO_SEND_TELEGRAM_NOTIFICATION } = require('@condo/domains/notification/constants/errors')
const { renderTemplate } = require('@condo/domains/notification/templates')


async function prepareMessageToSend (message) {
    const userId = get(message, 'user.id')

    if (!userId) throw new Error(NO_USER_ID_TO_SEND_TELEGRAM_NOTIFICATION)

    const telegramUserChat = await getByCondition('TelegramUserChat', {
        user: { id: userId },
        deletedAt: null,
    })
    const telegramChatId = get(telegramUserChat, 'telegramChatId')

    if (!telegramUserChat) throw new Error(NO_TELEGRAM_CHAT_FOR_USER)

    const { text, html } = await renderTemplate(TELEGRAM_TRANSPORT, message)

    return { userId, text, html, telegramChatId }
}

/**
 * Send a Telegram notification to chat with user
 */
async function send ({ telegramChatId, text, html } = {}) {
    const messageData = html ? { text: html, parse_mode: 'HTML' } : { text }

    const result = await axios.post(`https://api.telegram.org/bot${conf.TELEGRAM_EMPLOYEE_BOT_TOKEN}/sendMessage`, {
        chat_id: telegramChatId,
        ...messageData,
    })

    return [true, result.data]
}

module.exports = {
    prepareMessageToSend,
    send,
}
