const dayjs = require('dayjs')
const get = require('lodash/get')

const { getLogger } = require('@open-condo/keystone/logging')
const { getById, find, getSchemaCtx } = require('@open-condo/keystone/schema')
const { createTask } = require('@open-condo/keystone/tasks')

const { SENDING_DELAY_SEC } = require('@condo/domains/news/constants/common')
const { queryFindResidentsByNewsItemAndScopes } = require('@condo/domains/news/utils/accessSchema')
const { NewsItem } = require('@condo/domains/news/utils/serverSchema')

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
async function sendNotifications (newsItem) {

    if (!checkSendingPossibility(newsItem)) {
        return
    }

    const scopes = await find('NewsItemScope', { newsItem: { id: newsItem.id } })

    /** @type {Resident[]} */
    const residents = await find('Resident', queryFindResidentsByNewsItemAndScopes(newsItem, scopes))

    //
    //
    //
    // TODO(DOMA-5400) send messages to residents
    console.debug(`Send news item ${newsItem.id} to residents ${residents.map((resident) => resident.id).join(',')}`)
    //
    //
    //

    // Mark the news item as sent
    const { keystone: context } = await getSchemaCtx('NewsItem')
    await NewsItem.update(context, newsItem.id, { sentAt: dayjs().toISOString(), ...DV_SENDER })

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
