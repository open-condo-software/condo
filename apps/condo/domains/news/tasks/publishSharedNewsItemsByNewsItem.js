const { find } = require('@open-condo/keystone/schema')
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

    const sharedNewsItems = await find('NewsItemSharing', { newsItem: { id: newsItemId } })

    for (const newsItemSharing of sharedNewsItems) {
        await publishNewsItemSharing.delay(newsItemSharing.id)
    }
}

module.exports = createTask('publishSharedNewsItemsByNewsItem', publishSharedNewsItemsByNewsItem)
