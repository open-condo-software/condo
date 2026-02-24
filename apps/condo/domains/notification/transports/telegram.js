const conf = require('@open-condo/config')
const { getByCondition } = require('@open-condo/keystone/schema')

const { TELEGRAM_TRANSPORT } = require('@condo/domains/notification/constants/constants')
const { NO_TELEGRAM_CHAT_FOR_USER, NO_USER_ID_TO_SEND_TELEGRAM_NOTIFICATION } = require('@condo/domains/notification/constants/errors')
const { renderTemplate } = require('@condo/domains/notification/templates')


async function prepareMessageToSend (message) {
    const userId = message?.user?.id

    if (!userId) throw new Error(NO_USER_ID_TO_SEND_TELEGRAM_NOTIFICATION)

    const telegramUserChat = await getByCondition('TelegramUserChat', {
        user: { id: userId },
        deletedAt: null,
    })
    const telegramChatId = telegramUserChat?.telegramChatId

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
            inline_keyboard: inlineKeyboard,
        }
    }

    const response = await fetch(`https://api.telegram.org/bot${conf.TELEGRAM_EMPLOYEE_BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            chat_id: telegramChatId,
            ...messageData,
        }),
    })

    if (!response.ok) {
        throw new Error(`Failed to send Telegram message: ${response.statusText}`)
    }

    const data = await response.json()

    return [true, data]
}

module.exports = {
    prepareMessageToSend,
    send,
}
