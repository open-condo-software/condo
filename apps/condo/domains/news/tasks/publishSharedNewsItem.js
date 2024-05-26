const get = require('lodash/get')

const { fetch } = require('@open-condo/keystone/fetch')
const { getLogger } = require('@open-condo/keystone/logging')
const { getSchemaCtx, getById, find } = require('@open-condo/keystone/schema')
const { createTask } = require('@open-condo/keystone/tasks')

const { NewsItemSharing } = require('@condo/domains/news/utils/serverSchema')

const { STATUSES } = require('../constants/newsItemSharingStatuses')

const logger = getLogger('publishSharedNewsItem')

const DV_SENDER = { dv: 1, sender: { dv: 1, fingerprint: 'publishSharedNewsItem' } }

const DEFAULT_TIMEOUT = 20 * 1000

async function fetchWithTimeout (url, options = {}, timeout = 5000) {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeout)

    try {
        const response = await fetch(url, { ...options, signal: controller.signal })
        clearTimeout(timeoutId)
        return response
    } catch (error) {
        clearTimeout(timeoutId)
        throw error.name === 'AbortError' ? new Error('Timeout') : error
    }
}

async function _publishSharedNewsItem (newsItem, newsItemSharing){
    const { keystone: contextNewsItemSharing } = getSchemaCtx('NewsItemSharing')

    if (!newsItem) {
        throw new Error('no news item')
    }

    // If current news item was processed (not scheduled)
    if (newsItemSharing.status !== STATUSES.SCHEDULED) return
    await NewsItemSharing.update(contextNewsItemSharing, newsItemSharing.id, {
        ...DV_SENDER,
        status: STATUSES.PROCESSING,
    })

    const { title, body, type, validBefore, createdAt, publishedAt, isEmergency } = newsItem
    const sharingParams = get(newsItemSharing, 'sharingParams')

    const scopes = await find('NewsItemScope', { newsItem: { id: newsItem.id } })

    const b2bAppContextId = get( newsItemSharing, 'b2bAppContext')
    const b2bAppContext = await getById('B2BAppContext', b2bAppContextId)

    // Todo @toplenboren! use schema stiching next time!
    const organizationId = get( b2bAppContext, 'organization')
    const organization = await getById('Organization', organizationId)
    const properties = await find('Property', { organization: { id: organizationId } })

    const b2bAppId = get(b2bAppContext, 'app')
    const b2bApp = await getById('B2BApp', b2bAppId)

    const newsSharingConfigId = get(b2bApp, 'newsSharingConfig')
    if (!newsSharingConfigId) {
        throw new Error('news sharing is not supported in provided miniapp')
    }
    const newsSharingConfig = await getById('B2BAppNewsSharingConfig', newsSharingConfigId)

    const publishUrl = get(newsSharingConfig, 'publishUrl')
    const contextSettings = get(b2bAppContext, ['settings'])

    logger.info({ msg: 'newsSharing sending shared news item', newsItemId: newsItem.id, newsItemSharingId: newsItemSharing.id, publishUrl })

    const publishData = {
        orgId: organizationId,
        newsItem: {
            id: newsItem.id,
            title,
            body,
            type,
            scopes,
            validBefore,
            createdAt,
            publishedAt,
            isEmergency,
        },
        newsItemSharing: {
            id: newsItemSharing.id,
            sharingParams,
        },
        contextSettings,

        // todo @toplenboren these will be void!
        properties: properties,
        organization: {
            tin: organization.tin,
            id: organizationId,
            name: organization.name,
        },
    }

    try {
        const response = await fetchWithTimeout(publishUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(publishData),
        }, DEFAULT_TIMEOUT)

        if (response.status !== 200) {
            const parsedResponse = await response.json()

            logger.error({ msg: 'newsSharing error: tried to publish, but failed', parsedResponse })
            await NewsItemSharing.update(contextNewsItemSharing, newsItemSharing.id, {
                ...DV_SENDER,
                status: STATUSES.ERROR,
                lastPostRequest: parsedResponse,
            })
        }

        if (response.status === 200) {
            await NewsItemSharing.update(contextNewsItemSharing, newsItemSharing.id, {
                ...DV_SENDER,
                status: STATUSES.PUBLISHED,
            })
        }
    } catch (err) {
        logger.error({ msg: 'newsSharing error: could not publish shared news item', err  })
        await NewsItemSharing.update(contextNewsItemSharing, newsItemSharing.id, {
            ...DV_SENDER,
            status: STATUSES.ERROR,
            lastPostRequest: err.message,
        })
    }
}

/**
 * Publish given News Item Sharing
 * @param {string} newsItemSharingId
 * @returns {Promise<void>}
 */
async function publishSharedNewsItem (newsItemSharingId) {
    const newsItemSharing = await getById('NewsItemSharing', newsItemSharingId)
    const newsItem = await getById('NewsItem', newsItemSharing.newsItem)

    return await _publishSharedNewsItem(newsItem, newsItemSharing)
}

module.exports = createTask('publishSharedNewsItem', publishSharedNewsItem, 'low')
