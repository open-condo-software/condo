const { get } = require('lodash')

const conf = require('@open-condo/config')
const { fetch } = require('@open-condo/keystone/fetch')
const { getByCondition } = require('@open-condo/keystone/schema')
const { i18n } = require('@open-condo/locales/loader')

const { REGION_MESSENGER_TRANSPORT } = require('@condo/domains/notification/constants/constants')
const { NO_REGION_MESSENGER_CHAT_FOR_USER, NO_USER_ID_TO_SEND_REGION_MESSENGER_NOTIFICATION } = require('@condo/domains/notification/constants/errors')
const { renderTemplate } = require('@condo/domains/notification/templates')
const getProxyAgent = require('@condo/domains/notification/utils/serverSchema/getProxyAgent')


async function prepareMessageToSend (message) {
    const userId = get(message, 'user.id')

    if (!userId) throw new Error(NO_USER_ID_TO_SEND_REGION_MESSENGER_NOTIFICATION)

    const regionMessengerUserChat = await getByCondition('RegionMessengerUserChat', {
        user: { id: userId },
        deletedAt: null,
    })
    const regionMessengerChatId = get(regionMessengerUserChat, 'regionMessengerChatId')

    if (!regionMessengerUserChat) throw new Error(NO_REGION_MESSENGER_CHAT_FOR_USER)


    const { text, html, inlineKeyboard } = await renderTemplate(REGION_MESSENGER_TRANSPORT, message)

    return { userId, text, html, regionMessengerChatId, inlineKeyboard }
}

/**
 * Send a Region Messenger notification to chat with user
 * Uses Max API format (not Telegram format)
 */
async function send ({ regionMessengerChatId, text, html, inlineKeyboard } = {}) {
    const messageText = html || text
    const messageData = { text: messageText }



    const response = await fetch(`https://platform-api.max.ru/messages?chat_id=${regionMessengerChatId}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': conf.REGION_MESSENGER_BOT_TOKEN,
        },
        body: JSON.stringify({
            ...messageData,
        }),
    })

    if (!response.ok) throw new Error('Request to region messenger failed')

    const data = await response.json()
    return [true, data]
}

module.exports = {
    prepareMessageToSend,
    send,
}
