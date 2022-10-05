const { default: Redlock } = require('redlock')
const fetch = require('node-fetch')

const { createTask, taskQueue } = require('@condo/keystone/tasks')
const { getSchemaCtx } = require('@condo/keystone/schema')
const { getLogger } = require('@condo/keystone/logging')
const { WebHookSubscription } = require('@condo/domains/webhook/utils/serverSchema')
const { execGqlAsUser } = require('@condo/domains/common/utils/codegeneration/generate.server.utils')

const { buildWebHookGQLQuery } = require('./utils/buildWebHookGQLQuery.utils')

const logger = getLogger('webhook/tasks')

const LOCK_DURATION = 30 * 1000 // 30 sec
const MAX_UPDATE_PACK_SIZE = 100


async function sendWebHook (subscriptionId) {
    const { keystone } = await getSchemaCtx('WebHookSubscription')

    const rlock = new Redlock([taskQueue.client])
    let lock = await rlock.acquire([`sendWebHook:${subscriptionId}`], LOCK_DURATION)
    logger.info({ message: 'acquire task lock', subscriptionId })
    try {
        const subscription = await WebHookSubscription.getOne(keystone, { id: subscriptionId })
        if (!subscription) return 'notFound'

        const { webhook: { user }, model, fields, filters, lastUpdatedAt, lastUpdatedAtOffset } = subscription

        const { query } = await buildWebHookGQLQuery(model, fields)

        const objs = await execGqlAsUser(keystone, user, {
            query,
            variables: {
                first: MAX_UPDATE_PACK_SIZE,
                skip: lastUpdatedAtOffset,
                where: { ...filters, updatedAt_gt: lastUpdatedAt },
            },
            dataPath: 'objs',
        })

        if (objs.length <= 0) return 'empty'

        const url = subscription.webhook.url
        const response = await fetch(url, {
            method: 'POST',
            body: JSON.stringify(objs),
            headers: { 'Content-Type': 'application/json' },
        })

        if (!response.ok) { // status < 200 || status >= 300
            throw new Error(`webhook fetch status: ${response.status}`)
        }

        // update lastUpdatedAt lastUpdatedAtOffset

        return 'ok'

    } finally {
        logger.info({ message: 'release task lock', subscriptionId })
        await lock.release()
    }
}

/**
 * Tries to deliver webhooks
 * @param model String
 * @returns {Promise<string>}
 */
async function sendWebHooks (model) {
    const { keystone } = await getSchemaCtx('WebHookSubscription')
    const subscriptions = await WebHookSubscription.getAll(keystone, { model })

    for (const subscription of subscriptions) {
        const { webhook: { user }, fields, filters, lastUpdatedAt, lastUpdatedAtOffset } = subscription

        const { count } = await buildWebHookGQLQuery(model, fields)

        const countOfSynchronize = await execGqlAsUser(keystone, user, {
            query: count,
            variables: {
                skip: lastUpdatedAtOffset,
                where: { ...filters, updatedAt_gt: lastUpdatedAt },
            },
            dataPath: 'meta.count',
        })

        if (countOfSynchronize) sendWebHook.delay(subscription.id)
    }

    return 'ok'
}

module.exports = {
    sendWebHooks: createTask('sendWebHooks', sendWebHooks),
    sendWebHook: createTask('sendWebHook', sendWebHook),
}
