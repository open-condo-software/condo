const dayjs = require('dayjs')

const { find } = require('@open-condo/keystone/schema')
const { createCronTask } = require('@open-condo/keystone/tasks')

const { notifyResidentsAboutNewsItemTask } = require('./notifyResidentsAboutNewsItem')

async function notifyResidentsAboutDelayedNewsItems () {
    const now = dayjs().toISOString()
    /** @type {NewsItem[]} */
    const newsItems = await find(
        'NewsItem',
        {
            isPublished: true,
            deletedAt: null,
            sentAt: null,
            deliverAt_not: null,
            deliverAt_lte: now,
        },
    )

    for (const newsItem of newsItems) {
        await notifyResidentsAboutNewsItemTask.delay(newsItem.id)
    }
}

module.exports = createCronTask('notifyResidentsAboutDelayedNewsItems', '* * * * *', notifyResidentsAboutDelayedNewsItems)
