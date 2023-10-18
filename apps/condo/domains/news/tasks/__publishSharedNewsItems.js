const dayjs = require('dayjs')
const get = require('lodash/get')
const truncate = require('lodash/truncate')

const conf = require('@open-condo/config')
const { getLogger } = require('@open-condo/keystone/logging')
const { getSchemaCtx, find, getById } = require('@open-condo/keystone/schema')
const { createTask } = require('@open-condo/keystone/tasks')

const { loadListByChunks } = require('@condo/domains/common/utils/serverSchema')
const { SENDING_DELAY_SEC } = require('@condo/domains/news/constants/common')
const { NEWS_ITEM_SHARING_STATUSES } = require('@condo/domains/news/schema/NewsItemSharing')

const { NewsItemSharing } = require('../utils/serverSchema')

const logger = getLogger('publishSharedNewsItem')

const DV_SENDER = { dv: 1, sender: { dv: 1, fingerprint: 'publishSharedNewsItem' } }
const TITLE_MAX_LEN = 50
const BODY_MAX_LEN = 150

async function publishSharedNewsItem (newsItemSharingId) {
    const newsItemSharing = await getById('NewsItemSharing', newsItemSharingId)
    const newsItem = await getById('NewsItem', newsItemSharing.id)

    await _publishSharedNewsItem(newsItem, newsItemSharing)
}

async function _publishSharedNewsItem (newsItem, newsItemSharing){

    // If current news item was processed (not scheduled)
    if (newsItemSharing.status !== NEWS_ITEM_SHARING_STATUSES.SCHEDULED) { return }

    const { title, body } = newsItem

    const b2bAppContextId = get( newsItemSharing, ['b2bAppContext'])
    const b2bAppContext = await getById('B2BAppContext', b2bAppContextId)

    const postUrl = get(b2bAppContext, ['settings', 'postUrl'])
    const chatId = get(b2bAppContext, ['settings', 'chatId'])

    try {
        const response = await fetch(postUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                title,
                body,
                chatId,
            }),
        })

        if (response.statusCode === 200) {
            const { keystone: context } = getSchemaCtx('NewsItemSharing')
            await NewsItemSharing.update(context, newsItemSharing.id, {
                ...{ DV_SENDER },
                status: NEWS_ITEM_SHARING_STATUSES.PUBLISHED,

            })
        }
    } catch (err) {
        console.log(err)
    }
}

/**
 * @param {string} newsItemId
 * @param {Array} sharedNewsItemsIds
 * @returns {Promise<void>}
 */
async function __publishSharedNewsItems (newsItemId, sharedNewsItemsIds) {

    const newsItem = await getById('', { id: newsItemId })
    const sharedNewsItems = await find('NewsItemSharing', { id_in: sharedNewsItemsIds })

    for (const newsItemSharing of sharedNewsItems) {
        await _publishSharedNewsItem(newsItem, newsItemSharing)
    }
}

module.exports = createTask('publishSharedNewsItems', __publishSharedNewsItems, { priority: 2 })
