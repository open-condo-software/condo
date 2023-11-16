const { find, getById } = require('@open-condo/keystone/schema')
const { createTask } = require('@open-condo/keystone/tasks')

/**
 * @param {string} newsItemId
 * @param {Array} sharedNewsItemsIds
 * @returns {Promise<void>}
 */
async function publishSharedNewsItemsByNewsItem (newsItemId, sharedNewsItemsIds) {
    const newsItem = await getById('', { id: newsItemId })
    const sharedNewsItems = await find('NewsItemSharing', { id_in: sharedNewsItemsIds })

    for (const newsItemSharing of sharedNewsItems) {
        await publishSharedNewsItemsByNewsItem.delay(newsItem, newsItemSharing)
    }
}

module.exports = createTask('publishSharedNewsItemsByNewsItem', publishSharedNewsItemsByNewsItem, { priority: 2 })


