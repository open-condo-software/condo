const { get } = require('lodash')

const conf = require('@open-condo/config')
const { fetch } = require('@open-condo/keystone/fetch')
const { getByCondition } = require('@open-condo/keystone/schema')

const { TELEGRAM_TRANSPORT } = require('@condo/domains/notification/constants/constants')
const { NO_TELEGRAM_CHAT_FOR_USER, NO_USER_ID_TO_SEND_TELEGRAM_NOTIFICATION } = require('@condo/domains/notification/constants/errors')
const { renderTemplate } = require('@condo/domains/notification/templates')
const getProxyAgent = require('@condo/domains/notification/utils/serverSchema/getProxyAgent')


async function prepareMessageToSend (message) {
    const userId = get(message, 'user.id')

    if (!userId) throw new Error(NO_USER_ID_TO_SEND_TELEGRAM_NOTIFICATION)

    const telegramUserChat = await getByCondition('TelegramUserChat', {
        user: { id: userId },
        deletedAt: null,
    })
    const telegramChatId = get(telegramUserChat, 'telegramChatId')

    if (!telegramUserChat) throw new Error(NO_TELEGRAM_CHAT_FOR_USER)

    const { text, html, inlineKeyboard } = await renderTemplate(TELEGRAM_TRANSPORT, message)

    return { userId, text, html, telegramChatId, inlineKeyboard }
}

/**
 * Send a Telegram notification to chat with user
 */
async function send ({ telegramChatId, text, html, inlineKeyboard } = {}) {
    const messageData = html ? { text: html, parse_mode: 'HTML' } : { text }

    if (inlineKeyboard) {
        messageData.reply_markup = {
            ...messageData.reply_markup,
            inline_keyboard: inlineKeyboard,
        }
    }

    const proxyAgent = getProxyAgent()

    const response = await fetch(`https://api.telegram.org/bot${conf.TELEGRAM_EMPLOYEE_BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            chat_id: telegramChatId,
            ...messageData,
        }),
        agent: proxyAgent,
    })

    if (!response.ok) throw new Error('Request to telegram failed')
    
    const data = await response.json()
    return [true, data]
}

module.exports = {
    prepareMessageToSend,
    send,
}
