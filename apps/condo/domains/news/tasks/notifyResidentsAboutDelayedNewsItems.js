const dayjs = require('dayjs')

const { find } = require('@open-condo/keystone/schema')
const { createCronTask } = require('@open-condo/keystone/tasks')

const { notifyResidentsAboutNewsItem } = require('./notifyResidentsAboutNewsItem')

async function notifyResidentsAboutDelayedNewsItems () {
    /** @type {NewsItem[]} */
    const newsItems = await find(
        'NewsItems',
        // TODO(AleX83Xpert) use organization's timezone to detect the moment for sending
        { deletedAt: null, sentAt_not: null, sendAt_not: null, sendAt_lte: dayjs().toISOString() },
    )

    for (const newsItem of newsItems) {
        await notifyResidentsAboutNewsItem.delay(newsItem.id)
    }
}

module.exports = {
    notifyResidentsAboutDelayedNewsItems: createCronTask('notifyResidentsAboutDelayedNewsItems', '*/5 * * * *', notifyResidentsAboutDelayedNewsItems),
}
