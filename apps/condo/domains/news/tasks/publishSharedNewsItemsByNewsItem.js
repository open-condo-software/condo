const { find, getById } = require('@open-condo/keystone/schema')
const { createTask } = require('@open-condo/keystone/tasks')

const publishNewsItemSharing = require('./publishNewsItemSharing')

/**
 * @param {string} newsItemId
 * @returns {Promise<void>}
 */
async function publishSharedNewsItemsByNewsItem (newsItemId) {
    if (!newsItemId) {
        throw new Error('No news item id!')
    }

    const newsItem = await getById('NewsItem', newsItemId)
    if (newsItem.deletedAt) {
        throw new Error('News item was deleted!')
    }

    const sharedNewsItems = await find('NewsItemSharing', { newsItem: { id: newsItemId }, deletedAt: null })

    for (const newsItemSharing of sharedNewsItems) {
        await publishNewsItemSharing.delay(newsItemSharing.id)
    }
}

module.exports = createTask('publishSharedNewsItemsByNewsItem', publishSharedNewsItemsByNewsItem)
