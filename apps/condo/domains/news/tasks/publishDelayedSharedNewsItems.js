const dayjs = require('dayjs')

const { find } = require('@open-condo/keystone/schema')
const { createCronTask } = require('@open-condo/keystone/tasks')

const publishSharedNewsItemsByNewsItem = require('./publishSharedNewsItemsByNewsItem')

async function publishDelayedSharedNewsItems () {
    const now = dayjs().toISOString()
    /** @type {NewsItem[]} */
    const newsItems = await find(
        'NewsItem',
        {
            isPublished: true,
            deletedAt: null,
            sentAt: null,
            sendAt_lte: now,
        },
    )

    for (const newsItem of newsItems) {
        await publishSharedNewsItemsByNewsItem.delay(newsItem.id)
    }
}

module.exports = createCronTask('publishDelayedSharedNewsItems', '* * * * *', publishDelayedSharedNewsItems)
