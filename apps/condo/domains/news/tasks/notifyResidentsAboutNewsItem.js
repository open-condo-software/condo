const dayjs = require('dayjs')
const get = require('lodash/get')
const truncate = require('lodash/truncate')

const conf = require('@open-condo/config')
const { getLogger } = require('@open-condo/keystone/logging')
const { find } = require('@open-condo/keystone/schema')
const { getSchemaCtx, allItemsQueryByChunks } = require('@open-condo/keystone/schema')
const { createTask } = require('@open-condo/keystone/tasks')

const { NEWS_SENDING_TTL_IN_SEC, MESSAGE_TITLE_MAX_LEN, MESSAGE_BODY_MAX_LEN } = require('@condo/domains/news/constants/common')
const { defineMessageType } = require('@condo/domains/news/tasks/notifyResidentsAboutNewsItem.helpers')
const { queryFindResidentsByOrganizationAndScopes } = require('@condo/domains/news/utils/accessSchema')
const { NewsItem } = require('@condo/domains/news/utils/serverSchema')
const { sendMessage } = require('@condo/domains/notification/utils/serverSchema')
const { RedisGuard } = require('@condo/domains/user/utils/serverSchema/guards')

const { generateUniqueMessageKey } = require('./notifyResidentsAboutNewsItem.helpers')

const logger = getLogger()

const REDIS_GUARD = new RedisGuard()
const action = 'notifyResidentsAboutNewsItem'

const DV_SENDER = { dv: 1, sender: { dv: 1, fingerprint: 'notifyResidentsAboutNewsItem' } }

/**
 * @param {NewsItem} newsItem
 * @returns {boolean}
 */
function checkSendingPossibility (newsItem) {
    if (newsItem.deletedAt) {
        throw new Error('Trying to send deleted news item')
    }

    if (newsItem.sentAt) {
        throw new Error('Trying to send news item which already been sent')
    }

    if (!newsItem.isPublished) {
        throw new Error('Trying to send unpublished news item')
    }

    if (!newsItem.sendAt) {
        throw new Error('Trying to send news item which has not send date')
    }
}

/**
 * @param {NewsItem} newsItem
 * @param {string} taskId
 * @returns {Promise<void>}
 */
async function sendNotifications (newsItem) {
    logger.info({ msg: 'data of news item for sending', data: { newsItem } })

    checkSendingPossibility(newsItem)

    const scopes = await find('NewsItemScope', { newsItem: { id: newsItem.id, deletedAt: null }, deletedAt: null })

    const gelAllLikeScopes = scopes.map((scope) => ({ unitType: scope.unitType, unitName: scope.unitName, property: { id: scope.property } }))

    const residentsData = []

    // NOTE(pahaz): use find here!
    await allItemsQueryByChunks({
        schemaName: 'Resident',
        where: {
            ...queryFindResidentsByOrganizationAndScopes(newsItem.organization.id, gelAllLikeScopes),
            deletedAt: null,
        },
        chunkSize: 50,
        chunkProcessor: (chunk) => {
            residentsData.push(...chunk.map((resident) => ({
                id: resident.id,
                user: { id: resident.user },
            })))

            return []
        },
    })

    const residentsIdsByUser = residentsData.reduce((result, resident) => ({
        ...result,
        [resident.user.id]: [
            ...get(result, resident.user.id, []),
            resident.id,
        ],
    }), {})

    const { keystone: contextMessage } = getSchemaCtx('Message')
    for (const resident of residentsData) {
        try {
            await sendMessage(contextMessage, {
                ...DV_SENDER,
                to: { user: { id: resident.user.id } },
                lang: conf.DEFAULT_LOCALE,
                type: defineMessageType(newsItem),
                meta: {
                    dv: 1,
                    title: truncate(newsItem.title, { length: MESSAGE_TITLE_MAX_LEN, separator: ' ', omission: '...' }),
                    body: truncate(newsItem.body, { length: MESSAGE_BODY_MAX_LEN, separator: ' ', omission: '...' }),
                    data: {
                        newsItemId: newsItem.id,
                        organizationId: newsItem.organization.id,
                        userId: resident.user.id,
                        residentId: resident.id,
                        userRelatedResidentsIds: get(residentsIdsByUser, resident.user.id, []).join(','),
                        url: `${conf.SERVER_URL}/newsItem/${newsItem.id}`,
                        validBefore: get(newsItem, 'validBefore', null),
                        // The first truthy value will be returned, or null if no values are found.
                        dateCreated: ['sendAt', 'publishedAt', 'updatedAt', 'createdAt'].reduce((result, field) => (result || get(newsItem, field)), null),
                    },
                },
                uniqKey: generateUniqueMessageKey(resident.user.id, newsItem.id),
            })
        } catch (err) {
            logger.error({
                msg: 'failed to send message to a resident',
                err,
                data: { newsItemId: get(newsItem, 'id'), residentId: get(resident, 'id') },
            })
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
    const { keystone: contextNewsItem } = getSchemaCtx('NewsItem')
    await NewsItem.update(contextNewsItem, newsItem.id, { sentAt: dayjs().toISOString(), ...DV_SENDER })

}

/**
 * @param {String} newsItemId in uuid format
 * @returns {Promise<void|string>}
 */
async function notifyResidentsAboutNewsItem (newsItemId) {
    try {
        // TODO(pahaz): isLocked doesn't work well ...
        const isLocked = await REDIS_GUARD.isLocked(newsItemId, action)
        if (isLocked) {
            const timeRemain = await REDIS_GUARD.lockTimeRemain(newsItemId, action)
            throw new Error(`Trying to send news item which already was sent recently (time remain: ${timeRemain})`)
        }

        await REDIS_GUARD.lock(newsItemId, action, NEWS_SENDING_TTL_IN_SEC)

        const { keystone: context } = getSchemaCtx('NewsItem')

        const newsItem = await NewsItem.getOne(
            context,
            { id: newsItemId },
            'id organization { id } type title body ' +
            'validBefore publishedAt updatedAt createdAt deletedAt sentAt isPublished sendAt'
        )

        await sendNotifications(newsItem)

        await REDIS_GUARD.unlock(newsItemId, action)
    } catch (err) {
        logger.error({
            msg: 'failed to send news to residents',
            err,
            data: { newsItemId },
        })
        throw err
    }
}

module.exports = {
    notifyResidentsAboutNewsItem,
    notifyResidentsAboutNewsItemTask: createTask('notifyResidentsAboutNewsItem', notifyResidentsAboutNewsItem),
}
