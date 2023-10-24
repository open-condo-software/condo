const axios = require('axios')
const { get } = require('lodash')

const conf = require('@open-condo/config')
const { getByCondition } = require('@open-condo/keystone/schema')

const { TELEGRAM_TRANSPORT } = require('../constants/constants')
const { renderTemplate } = require('../templates')


async function prepareMessageToSend (message) {
    const userId = get(message, 'user.id')

    if (!userId) throw new Error('no userId to send telegram notification')

    const { text } = await renderTemplate(TELEGRAM_TRANSPORT, message)

    console.log('prepareMessageToSend', text)

    return { userId, message: text }
}

/**
 * Send a Telegram notification to chat with user
 */
async function send ({ userId, message } = {}) {
    const telegramUserChat = await getByCondition('TelegramUserChat', {
        user: { id: userId },
        deletedAt: null,
    })

    if (!telegramUserChat) throw new Error('no telegram chat with user id')

    const result = await axios.post(`https://api.telegram.org/bot${conf.TELEGRAM_EMPLOYEE_BOT_TOKEN}/sendMessage`, {
        chat_id: telegramUserChat.telegramChatId,
        text: message,
    })

    return [true, result.data]
}

module.exports = {
    prepareMessageToSend,
    send,
}
