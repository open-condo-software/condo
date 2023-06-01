const dayjs = require('dayjs')
const get = require('lodash/get')

const conf = require('@open-condo/config')
const { getLogger } = require('@open-condo/keystone/logging')
const { getSchemaCtx } = require('@open-condo/keystone/schema')
const { createTask } = require('@open-condo/keystone/tasks')

const { SENDING_DELAY_SEC } = require('@condo/domains/news/constants/common')
const { defineMessageType } = require('@condo/domains/news/tasks/notifyResidentsAboutNewsItem.helpers')
const { queryFindResidentsByOrganizationAndScopes } = require('@condo/domains/news/utils/accessSchema')
const { NewsItem, NewsItemScope } = require('@condo/domains/news/utils/serverSchema')
const { sendMessage } = require('@condo/domains/notification/utils/serverSchema')
const { Resident } = require('@condo/domains/resident/utils/serverSchema')

const { generateUniqueMessageKey } = require('./notifyResidentsAboutNewsItem.helpers')

const logger = getLogger('notifyResidentsAboutNewsItem')

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
async function sendNotifications (context, newsItem) {

    if (!checkSendingPossibility(newsItem)) {
        return
    }

    const scopes = await NewsItemScope.getAll(context, { newsItem: { id: newsItem.id } })
    const residents = await Resident.getAll(context, queryFindResidentsByOrganizationAndScopes(newsItem.organization.id, scopes))

    const { keystone: contextMessage } = await getSchemaCtx('Message')
    for (const resident of residents) {
        await sendMessage(contextMessage, {
            ...DV_SENDER,
            to: { user: { id: resident.user.id } },
            lang: conf.DEFAULT_LOCALE,
            type: defineMessageType(newsItem),
            meta: {
                dv: 1,
                title: newsItem.title,
                body: newsItem.body,
                data: {
                    newsItemId: newsItem.id,
                    organizationId: newsItem.organization.id,
                    userId: resident.user.id,
                    residentId: resident.id,
                    url: `${conf.SERVER_URL}/newsItem`,
                    validBefore: get(newsItem, 'validBefore', null),
                    // The first truthy value will be returned, or null if no values are found.
                    dateCreated: ['sendAt', 'updatedAt', 'createdAt'].reduce((result, field) => (result || get(newsItem, field)), null),
                },
            },
            uniqKey: generateUniqueMessageKey(resident.user.id, newsItem.id),
        })
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
    const { keystone: context } = await getSchemaCtx('NewsItem')

    const newsItem = await NewsItem.getOne(context, { id: newsItemId })

    if (!checkSendingPossibility(newsItem)) {
        return
    }

    if (get(newsItem, 'sendAt')) {
        // Send delayed items immediately
        await sendNotifications(context, newsItem)
    } else {
        // We wait some number of seconds in the case of not delayed news items to take a chance for the user to turn all back
        setTimeout(async () => {
            // The record can be changed during waiting timeout, for example, a user can edit it, therefore it should be requested again right before sending
            const actualNewsItem = await NewsItem.getOne(context, { id: newsItemId })
            // Checking if the timeout was expired to send the news item
            const now = dayjs().unix()
            if (now - dayjs(actualNewsItem.updatedAt).unix() < SENDING_DELAY_SEC) {
                logger.warn({
                    message: 'NewsItem was updated before sending timeout passed. Do nothing',
                    actualNewsItem,
                    SENDING_DELAY_SEC,
                    now,
                })
                return
            }

            await sendNotifications(context, actualNewsItem)
        }, SENDING_DELAY_SEC * 1000)
    }
}

module.exports = createTask('notifyResidentsAboutNewsItem', notifyResidentsAboutNewsItem, { priority: 2 })
