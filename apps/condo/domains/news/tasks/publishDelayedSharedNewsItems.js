const dayjs = require('dayjs')

const { find } = require('@open-condo/keystone/schema')
const { createCronTask } = require('@open-condo/keystone/tasks')

const publishNewsItemSharing = require('./publishNewsItemSharing')

const { STATUSES } = require('../constants/newsItemSharingStatuses')

async function publishDelayedSharedNewsItems () {
    const now = dayjs().toISOString()
    /** @type {NewsItemSharing[]} */
    const newsItemSharings = await find(
        'NewsItemSharing',
        {
            status: STATUSES.SCHEDULED,
            newsItem: {
                isPublished: true,
                deletedAt: null,
                sendAt_lte: now,
            },
            deletedAt: null,
        },
    )

    for (const newsItemSharing of newsItemSharings) {
        await publishNewsItemSharing.delay(newsItemSharing.id)
    }
}

module.exports = createCronTask('publishDelayedSharedNewsItems', '* * * * *', publishDelayedSharedNewsItems)
