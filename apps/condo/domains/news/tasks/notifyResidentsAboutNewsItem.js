const dayjs = require('dayjs')
const get = require('lodash/get')

const conf = require('@open-condo/config')
const { getLogger } = require('@open-condo/keystone/logging')
const { getRedisClient } = require('@open-condo/keystone/redis')
const { getById, find, getSchemaCtx } = require('@open-condo/keystone/schema')
const { createTask } = require('@open-condo/keystone/tasks')

const { SENDING_DELAY_SEC } = require('@condo/domains/news/constants/common')
const { NEWS_TYPE_COMMON } = require('@condo/domains/news/constants/newsTypes')
const { defineMessageType } = require('@condo/domains/news/tasks/notifyResidentsAboutNewsItem.helpers')
const { queryFindResidentsByNewsItemAndScopes } = require('@condo/domains/news/utils/accessSchema')
const { NewsItem } = require('@condo/domains/news/utils/serverSchema')
const { sendMessage } = require('@condo/domains/notification/utils/serverSchema')

const { generateUniqueMessageKey } = require('./notifyResidentsAboutNewsItem.helpers')

const logger = getLogger('notifyResidentsAboutNewsItem')
const cacheClient = getRedisClient('notifyResidentsAboutNewsItem', 'throttleCommonNewsItemsNotifications')

const DV_SENDER = { dv: 1, sender: { dv: 1, fingerprint: 'notifyResidentsAboutNewsItem' } }

/**
 * @param {NewsItem} newsItem
 * @returns {boolean}
 */
function checkSendingPossibility (newsItem) {
    if (newsItem.deletedAt) {
        logger.warn({ message: 'Trying to send deleted news item', newsItem })
        return false
    }

    if (newsItem.sentAt) {
        logger.warn({ message: 'Trying to send news item which already been sent', newsItem })
        return false
    }

    if (!newsItem.isPublished) {
        logger.warn({ message: 'Trying to send unpublished news item', newsItem })
        return false
    }

    return true
}

/**
 * @param {NewsItem} newsItem
 * @returns {Promise<void>}
 */
async function sendNotifications (newsItem) {

    if (!checkSendingPossibility(newsItem)) {
        return
    }

    /** @type {NewsItemScope[]} */
    const scopes = await find('NewsItemScope', { newsItem: { id: newsItem.id } })

    /** @type {Resident[]} */
    const residents = await find('Resident', { deletedAt: null, ...queryFindResidentsByNewsItemAndScopes(newsItem, scopes) })

    const { keystone: contextMessage } = await getSchemaCtx('Message')
    for (const resident of residents) {
        // Throttle common news items. 1 message per hour.
        const throttlingCacheKey = `user:${resident.user}:lastSending`
        if (newsItem.type === NEWS_TYPE_COMMON) {
            const lastCommonNewsItemSentDate = await cacheClient.get(throttlingCacheKey)
            if (lastCommonNewsItemSentDate) {
                logger.info({
                    message: 'Notification about the news item was not sent due to throttling reasons',
                    lastCommonNewsItemSentDate,
                    newsItem,
                    resident,
                })
                continue
            }
        }

        await sendMessage(contextMessage, {
            ...DV_SENDER,
            to: { user: { id: resident.user } },
            lang: conf.DEFAULT_LOCALE,
            type: defineMessageType(newsItem),
            meta: {
                dv: 1,
                title: newsItem.title,
                body: newsItem.body,
                data: {
                    newsItemId: newsItem.id,
                    organizationId: newsItem.organization,
                    userId: resident.user,
                    residentId: resident.id,
                    url: `${conf.SERVER_URL}/newsItem`,
                    validBefore: get(newsItem, 'validBefore', null),
                    // The first truthy value will be returned, or null if no values are found.
                    dateCreated: ['sendAt', 'updatedAt', 'createdAt'].reduce((result, field) => (result || get(newsItem, field)), null),
                },
            },
            uniqKey: generateUniqueMessageKey(resident.user, newsItem.id),
        })

        if (newsItem.type === NEWS_TYPE_COMMON) {
            await cacheClient.set(throttlingCacheKey, dayjs().toISOString(), 'EX', 3600)
        }
    }

    //
    //
    //
    // TODO(AleX83Xpert) move to sendMessageToResidentScopes after it starte to support unitType and unitName
    // sendMessageToResidentScopes(context, {
    //     type: NEWS_ITEM_COMMON_MESSAGE_TYPE,
    //     scopes: Promise.all(scopes.map(async (scope) => {
    //         // if no property - this is news item scope includes all organization
    //         const nruter = {
    //             property: { id: scope.property.id },
    //         }
    //
    //         return nruter
    //     })),
    // })
    //
    //
    //

    // Mark the news item as sent
    const { keystone: contextNewsItem } = await getSchemaCtx('NewsItem')
    await NewsItem.update(contextNewsItem, newsItem.id, { sentAt: dayjs().toISOString(), ...DV_SENDER })

}

/**
 * @param {String} newsItemId in uuid format
 * @returns {Promise<void>}
 */
async function notifyResidentsAboutNewsItem (newsItemId) {
    /** @type {NewsItem} */
    const newsItem = await getById('NewsItem', newsItemId)

    if (!checkSendingPossibility(newsItem)) {
        return
    }

    if (get(newsItem, 'sendAt')) {
        // Send delayed items immediately
        await sendNotifications(newsItem)
    } else {
        // We wait some number of seconds in the case of not delayed news items to take a chance for the user to turn all back
        setTimeout(async () => {
            // Load actual data for news item
            const actualNewsItem = await getById('NewsItem', newsItemId)
            // Checking if the timeout was expired to send the news item
            const now = dayjs().unix()
            if (now - dayjs(actualNewsItem.updatedAt).unix() < SENDING_DELAY_SEC) {
                logger.warn({
                    message: 'The news item was updated less than SENDING_DELAY_SEC seconds ago',
                    actualNewsItem,
                    SENDING_DELAY_SEC,
                    now,
                })
                return
            }

            await sendNotifications(actualNewsItem)
        }, SENDING_DELAY_SEC * 1000)
    }
}

module.exports = createTask('notifyResidentsAboutNewsItem', notifyResidentsAboutNewsItem, { priority: 2 })
