const { find, getById } = require('@open-condo/keystone/schema')
const { createTask } = require('@open-condo/keystone/tasks')

const { publishSharedNewsItem } = require('./publishSharedNewsItem')

/**
 * @param {string} newsItemId
 * @param {Array} sharedNewsItemsIds
 * @returns {Promise<void>}
 */
async function publishSharedNewsItemsByNewsItem (newsItemId, sharedNewsItemsIds) {
    const newsItem = await getById('NewsItem', { id: newsItemId })
    const sharedNewsItems = await find('NewsItemSharing', { id_in: sharedNewsItemsIds })

    for (const newsItemSharing of sharedNewsItems) {
        await publishSharedNewsItem.delay(newsItem, newsItemSharing)
    }
}

module.exports = createTask('publishSharedNewsItemsByNewsItem', publishSharedNewsItemsByNewsItem)
