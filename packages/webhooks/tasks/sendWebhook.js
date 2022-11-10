const { default: RedLock } = require('redlock')
const dayjs = require('dayjs')
const { taskQueue, createTask } = require('@condo/keystone/tasks')
const { getSchemaCtx } = require('@condo/keystone/schema')
const { getLogger } = require('@condo/keystone/logging')
const { execGqlAsUser } = require('@condo/codegen/generate.server.utils')
const { WebhookSubscription } = require('@condo/webhooks/schema/utils/serverSchema')
const { DEFAULT_MAX_PACK_SIZE } = require('@condo/webhooks/constants')
const { trySendData, buildQuery } = require('@condo/webhooks/tasks/tasks.utils')

const LOCK_DURATION = 30 * 1000 // 30 sec
const OK_STATUS = 'OK'
const BAD_RESPONSE_STATUS = 'BAD_RESPONSE'
const NO_RESPONSE_STATUS = 'NO_RESPONSE'
const NO_SUBSCRIPTION_STATUS = 'NO_SUBSCRIPTION'

const rLock = new RedLock([taskQueue.client])
const logger = getLogger('sendWebhook')



async function sendWebhook (subscriptionId) {
    const { keystone } = await getSchemaCtx('WebhookSubscription')

    const lockKey = `sendWebhook:${subscriptionId}`
    const lock = await rLock.acquire([lockKey], LOCK_DURATION)
    logger.info({ message: 'Lock acquired', subscriptionId })

    try {
        const subscription = await WebhookSubscription.getOne(keystone, { id: subscriptionId })
        if (!subscription) {
            return { status: NO_SUBSCRIPTION_STATUS }
        }

        const {
            model,
            fields,
            filters,
            syncedAt,
            syncedAmount,
            failuresCount,
            maxPackSize,
            url: overrideUrl,
            updatedAt,
            webhook: {
                url: originalUrl,
                user,
            },
        } = subscription

        const url = overrideUrl || originalUrl
        const packSize = maxPackSize || DEFAULT_MAX_PACK_SIZE
        const query = buildQuery(model, fields)

        let lastLoaded = packSize
        let lastSendSuccess = true
        let totalLoaded = syncedAmount
        let lastSyncTime = dayjs().toISOString()
        let lastSubscriptionUpdate = updatedAt

        const where = {
            ...filters,
            updatedAt_gt: syncedAt,
        }

        while (lastLoaded === packSize) {
            // Step 1: Receive another batch
            const objs = await execGqlAsUser(keystone, user, {
                query,
                variables: {
                    first: maxPackSize || DEFAULT_MAX_PACK_SIZE,
                    skip: totalLoaded,
                    where,
                },
                dataPath: 'objs',
                deleted: true,
            })

            lastLoaded = objs.length
            // time is measured by the time of the last response from our server received
            lastSyncTime = dayjs().toISOString()

            // No more objects -> GOTO final update syncedAt
            if (lastLoaded === 0) {
                break
            }
            // Step 2: Send batch to specified url
            const response = await trySendData(url, objs)
            lastSendSuccess = response.ok

            // If not succeed - log and finish task
            if (!lastSendSuccess) {
                const noFailureIncrementInterval = dayjs().subtract(1, 'hour')
                const lastUpdate = dayjs(lastSubscriptionUpdate)
                // NOTE: If no failures before or > 1 hour since last failure passed -> increment failuresCount
                if (failuresCount === 0 || noFailureIncrementInterval.isAfter(lastUpdate)) {
                    await WebhookSubscription.update(keystone, subscriptionId, {
                        failuresCount: failuresCount + 1,
                        dv: 1,
                        sender: { dv: 1, fingerprint: 'sendWebhook' },
                    })
                }

                if (response.status === 523) {
                    logger.error({ message: 'Data was not sent. Reason: Unreachable resource', subscriptionId })
                    return { status: NO_RESPONSE_STATUS }
                } else {
                    logger.error({ message: 'Data was sent, but server response was not ok', status: response.status, subscriptionId })
                    return { status: BAD_RESPONSE_STATUS }
                }

            } else {
                totalLoaded += lastLoaded
                logger.info({ message: 'Data batch was sent', subscriptionId, batchSize: lastLoaded, total: totalLoaded, syncedAt })
            }

            // Step 3: Update subscription state if full batch received. Else condition will lead to final update
            if (lastLoaded === packSize) {
                await WebhookSubscription.update(keystone, subscriptionId, {
                    syncedAmount: totalLoaded,
                    dv: 1,
                    sender: { dv: 1, fingerprint: 'sendWebhook' },
                })
            }
        }

        await WebhookSubscription.update(keystone, subscriptionId, {
            syncedAt: lastSyncTime,
            dv: 1,
            sender: { dv: 1, fingerprint: 'sendWebhook' },
        })

        return { status: OK_STATUS }

    } finally {
        logger.info({ message: 'Lock released', subscriptionId })
        await lock.release()
    }
}

module.exports = {
    trySendData,
    sendWebhook: createTask('sendWebHook', sendWebhook, { priority: 2 }),
}