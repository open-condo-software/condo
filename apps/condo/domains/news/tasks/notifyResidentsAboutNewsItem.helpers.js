const { NEWS_TYPE_COMMON, NEWS_TYPE_EMERGENCY } = require('@condo/domains/news/constants/newsTypes')
const {
    NEWS_ITEM_COMMON_MESSAGE_TYPE,
    NEWS_ITEM_EMERGENCY_MESSAGE_TYPE,
} = require('@condo/domains/notification/constants/constants')

/**
 * @param {NewsItem} newsItem
 * @returns {string}
 */
function defineMessageType (newsItem) {
    switch (newsItem.type) {
        case NEWS_TYPE_EMERGENCY:
            return NEWS_ITEM_EMERGENCY_MESSAGE_TYPE
        case NEWS_TYPE_COMMON:
        default:
            return NEWS_ITEM_COMMON_MESSAGE_TYPE
    }
}

function generateUniqueMessageKey (userId, newsItemId) {
    return `user:${userId}_newsItem:${newsItemId}`
}

module.exports = { defineMessageType, generateUniqueMessageKey }
