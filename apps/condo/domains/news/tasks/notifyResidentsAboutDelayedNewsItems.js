const dayjs = require('dayjs')

const { find } = require('@open-condo/keystone/schema')

const { notifyResidentsAboutNewsItem } = require('./notifyResidentsAboutNewsItem')

async function notifyResidentsAboutDelayedNewsItems () {
    const now = dayjs().toISOString()
    /** @type {NewsItem[]} */
    const newsItems = await find(
        'NewsItem',
        {
            isPublished: true,
            deletedAt: null,
            sentAt: null,
            sendAt_not: null,
            sendAt_lte: now,
        },
    )

    for (const newsItem of newsItems) {
        await notifyResidentsAboutNewsItem.delay(newsItem.id)
    }
}

module.exports = {
    notifyResidentsAboutDelayedNewsItems,
}
