// const dayjs = require('dayjs')
// const get = require('lodash/get')
const fetch = require('node-fetch')

// const conf = require('@open-condo/config')
const { getLogger } = require('@open-condo/keystone/logging')
const { getSchemaCtx, getById } = require('@open-condo/keystone/schema')
const { createTask } = require('@open-condo/keystone/tasks')

//const { NEWS_ITEM_SHARING_STATUSES } = require('@condo/domains/news/schema/NewsItemSharing')

const { NewsItemSharing } = require('@condo/domains/news/utils/serverSchema')

const logger = getLogger('publishSharedNewsItem')

const DV_SENDER = { dv: 1, sender: { dv: 1, fingerprint: 'publishSharedNewsItem' } }

async function _publishSharedNewsItem (newsItem, newsItemSharing){

    if (!newsItem)

    // If current news item was processed (not scheduled)
        if (newsItemSharing.status !== 'scheduled') { return }

    const { title, body } = newsItem

    // const b2bAppContextId = get( newsItemSharing, 'b2bAppContext')
    // const b2bAppContext = await getById('B2BAppContext', b2bAppContextId)
    //
    // const newsItemSharingProviderId = get(newsItemSharing, 'newsItemSharingProvider')
    // const newsItemSharingProvider = await getById('NewsItemSharingProvider', newsItemSharingProviderId)

    // const postUrl = get(newsItemSharingProvider, 'newsItemPostUrl')
    // const chatId = get(b2bAppContext, ['settings', 'chatId'])

    try {
        const response = await fetch('not implemented', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                title,
                body,
                chatId: 'not implemented',
            }),
        })

        if (response.ok) {
            const parsedResponse = await response.json()

            const { keystone: contextNewsItemSharing } = await getSchemaCtx('NewsItemSharing')
            await NewsItemSharing.update(contextNewsItemSharing, newsItemSharing.id, { status: 'published', ...DV_SENDER })

            // const { keystone: context } = getSchemaCtx('NewsItemSharing')
            // await NewsItemSharing.update(context, newsItemSharing.id, {
            //     ...DV_SENDER,
            //     status: 'published',
            // })
        }
    } catch (err) {
        logger.log(err)
    }
}

async function publishSharedNewsItem (newsItemSharingId) {
    const newsItemSharing = await getById('NewsItemSharing', newsItemSharingId)
    const newsItem = await getById('NewsItem', newsItemSharing.newsItem)

    await _publishSharedNewsItem(newsItem, newsItemSharing)
}

module.exports = createTask('publishSharedNewsItem', publishSharedNewsItem, { priority: 3 })
