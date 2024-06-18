const get = require('lodash/get')

const { fetch } = require('@open-condo/keystone/fetch')
const { getLogger } = require('@open-condo/keystone/logging')
const { getSchemaCtx, getById, find } = require('@open-condo/keystone/schema')
const { createTask } = require('@open-condo/keystone/tasks')

const { STATUSES } = require('@condo/domains/news/constants/newsItemSharingStatuses')
const { NewsItemSharing } = require('@condo/domains/news/utils/serverSchema')


const logger = getLogger('publishNewsItemSharing')

const DV_SENDER = { dv: 1, sender: { dv: 1, fingerprint: 'publishNewsItemSharing' } }

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

async function _publishNewsItemSharing (newsItem, newsItemSharing){
    const { keystone: contextNewsItemSharing } = getSchemaCtx('NewsItemSharing')

    if (!newsItem) {
        throw new Error('no news item')
    }

    if (newsItemSharing.status !== STATUSES.SCHEDULED) return
    await NewsItemSharing.update(contextNewsItemSharing, newsItemSharing.id, {
        ...DV_SENDER,
        status: STATUSES.PROCESSING,
    })

    const { title, body, type, validBefore } = newsItem
    const sharingParams = get(newsItemSharing, 'sharingParams')

    const scopes = await find('NewsItemScope', { newsItem: { id: newsItem.id } })

    const b2bAppContextId = get( newsItemSharing, 'b2bAppContext')
    const b2bAppContext = await getById('B2BAppContext', b2bAppContextId)

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

    logger.info({ msg: 'newsSharing sending shared news item', newsItemId: newsItem.id, newsItemSharingId: newsItemSharing.id, publishUrl })

    const publishData = {
        newsItem: {
            id: newsItem.id,
            title,
            body,
            type,
            scopes,
            validBefore: validBefore ? validBefore : undefined,
        },

        newsItemSharing: {
            id: newsItemSharing.id,
            sharingParams,
        },

        properties: properties.map(property => ({
            id: property.id,
            address: property.address,
            addressMeta: property.addressMeta,
        })),

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
async function publishNewsItemSharing (newsItemSharingId) {
    const newsItemSharing = await getById('NewsItemSharing', newsItemSharingId)
    const newsItem = await getById('NewsItem', newsItemSharing.newsItem)

    return await _publishNewsItemSharing(newsItem, newsItemSharing)
}

module.exports = createTask('publishNewsItemSharing', publishNewsItemSharing, 'low')
