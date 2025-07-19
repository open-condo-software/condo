const get = require('lodash/get')

const { fetch } = require('@open-condo/keystone/fetch')
const { getLogger } = require('@open-condo/keystone/logging')
const { getSchemaCtx, getById, find } = require('@open-condo/keystone/schema')
const { createTask } = require('@open-condo/keystone/tasks')

const { CONTEXT_FINISHED_STATUS } = require('@condo/domains/miniapp/constants')
const { STATUSES } = require('@condo/domains/news/constants/newsItemSharingStatuses')
const { NewsItemSharing } = require('@condo/domains/news/utils/serverSchema')


const logger = getLogger()

const DV_SENDER = { dv: 1, sender: { dv: 1, fingerprint: 'publishNewsItemSharing' } }

const DEFAULT_TIMEOUT = 20 * 1000


async function _publishNewsItemSharing (newsItem, newsItemSharing){
    const { keystone: contextNewsItemSharing } = getSchemaCtx('NewsItemSharing')

    if (!newsItem || !newsItemSharing) {
        throw new Error('no news item or news item sharing')
    }

    if (newsItemSharing.status !== STATUSES.SCHEDULED) return
    await NewsItemSharing.update(contextNewsItemSharing, newsItemSharing.id, {
        ...DV_SENDER,
        status: STATUSES.PROCESSING,
    })

    try {
        const { title, body, type, validBefore, createdAt, publishedAt } = newsItem
        const sharingParams = get(newsItemSharing, 'sharingParams')

        // Check scopes
        const scopes = await find('NewsItemScope', { newsItem: { id: newsItem.id }, deletedAt: null })
        if (!scopes || !Array.isArray(scopes) || scopes.length === 0) {
            throw new Error('No NewsItemScope found. Perhaps they were deleted?')
        }

        // Check b2bAppContext
        const b2bAppContextId = get( newsItemSharing, 'b2bAppContext')
        const b2bAppContext = await getById('B2BAppContext', b2bAppContextId)
        if (!b2bAppContext || b2bAppContext.deletedAt) {
            throw new Error('b2bAppContext is deleted?')
        }
        if (b2bAppContext.status !== CONTEXT_FINISHED_STATUS) {
            throw new Error('b2bAppContext is not in finished status')
        }

        // Check organization
        const organizationId = get( b2bAppContext, 'organization')
        const organization = await getById('Organization', organizationId)
        if (!organization || organization.deletedAt) {
            throw new Error('organization is deleted')
        }

        // Check b2bApp
        const b2bAppId = get(b2bAppContext, 'app')
        const b2bApp = await getById('B2BApp', b2bAppId)
        if (!b2bApp || b2bApp.deletedAt) {
            throw new Error('b2bApp is deleted')
        }

        // Check news sharing config
        const newsSharingConfigId = get(b2bApp, 'newsSharingConfig')
        if (!newsSharingConfigId) {
            throw new Error('news sharing is not supported in provided miniapp')
        }
        const newsSharingConfig = await getById('B2BAppNewsSharingConfig', newsSharingConfigId)
        if (!newsSharingConfig || newsSharingConfig.deletedAt) {
            throw new Error('news sharing config is provided but deleted')
        }

        const publishUrl = get(newsSharingConfig, 'publishUrl')
        if (!publishUrl) {
            throw new Error('No publish url is provided')
        }

        logger.info({
            msg: 'newsSharing sending shared news item',
            entityId: newsItem.id,
            entity: 'NewsItem',
            data: {
                newsItemId: newsItem.id, newsItemSharingId: newsItemSharing.id, publishUrl,
            },
        })

        const properties = await find('Property', { organization: { id: organizationId }, deletedAt: null })

        const publishData = {
            newsItem: {
                id: newsItem.id,
                title,
                body,
                type,
                scopes,
                validBefore: validBefore ? validBefore : undefined,
                createdAt,
                publishedAt,
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

        const response = await fetch(publishUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(publishData),
            abortRequestTimeout: DEFAULT_TIMEOUT,
        })

        if (response.status !== 200) {
            const parsedResponse = await response.json()

            logger.error({ msg: 'newsSharing error: tried to publish, but failed', data: { parsedResponse } })
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