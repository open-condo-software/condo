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

const logger = getLogger('notifyResidentsAboutNewsItem')

const DV_SENDER = { dv: 1, sender: { dv: 1, fingerprint: 'notifyResidentsAboutNewsItem' } }
const TITLE_MAX_LEN = 50
const BODY_MAX_LEN = 150

/**
 * @param {string} newsItemId
 * @param {Array} sharedNewsItemsIds
 * @returns {Promise<void>}
 */
async function publishSharedNewsItems (newsItemId, sharedNewsItemsIds) {

    const newsItem = await getById('', { id: newsItemId })
    const newsItemSharings = await find('NewsItemSharing', { id_in: sharedNewsItemsIds })

    const { title, body } = newsItem

    for (const newsItemSharing of newsItemSharings) {

        if (newsItemSharing.status !== NEWS_ITEM_SHARING_STATUSES) { continue }

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
                await NewsItemSharing.update(context, newsItemSharing.id, { status: NEWS_ITEM_SHARING_STATUSES.PUBLISHED })
            }
        } catch (err) {
            console.log(err)
        }
    }
}

module.exports = createTask('publishSharedNewsItems', publishSharedNewsItems, { priority: 2 })
