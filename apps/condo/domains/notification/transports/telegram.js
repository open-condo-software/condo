const axios = require('axios')
const { get } = require('lodash')

const conf = require('@open-condo/config')
const { getByCondition } = require('@open-condo/keystone/schema')

const { TELEGRAM_TRANSPORT } = require('../constants/constants')
const { renderTemplate } = require('../templates')


async function prepareMessageToSend (message) {
    const userId = get(message, 'user.id')

    if (!userId) throw new Error('no userId to send telegram notification')

    const { text, html } = await renderTemplate(TELEGRAM_TRANSPORT, message)

    return { userId, message: text, html }
}

/**
 * Send a Telegram notification to chat with user
 */
async function send ({ userId, message, html } = {}) {
    const telegramUserChat = await getByCondition('TelegramUserChat', {
        user: { id: userId },
        deletedAt: null,
    })

    if (!telegramUserChat) throw new Error('no telegram chat with user id')

    const result = await axios.post(`https://api.telegram.org/bot${conf.TELEGRAM_EMPLOYEE_BOT_TOKEN}/sendMessage`, {
        chat_id: telegramUserChat.telegramChatId,
        text: html,
        parse_mode: 'HTML',
    })

    return [true, result.data]
}

module.exports = {
    prepareMessageToSend,
    send,
}
