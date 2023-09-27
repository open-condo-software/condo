const dayjs = require('dayjs')

const { find } = require('@open-condo/keystone/schema')

const { notifyResidentsAboutNewsItemTaskWorker } = require('./notifyResidentsAboutNewsItemTaskWorker')

async function notifyResidentsAboutDelayedNewsItemsCronTaskWorker () {
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
        await notifyResidentsAboutNewsItemTaskWorker.delay(newsItem.id)
    }
}

module.exports = {
    notifyResidentsAboutDelayedNewsItemsCronTaskWorker,
}
