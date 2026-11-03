const dayjs = require('dayjs')
const get = require('lodash/get')

const { execGqlAsUser } = require('@open-condo/codegen/generate.server.utils')
const { KVLocker } = require('@open-condo/keystone/locks')
const { getLogger } = require('@open-condo/keystone/logging')
const { getSchemaCtx } = require('@open-condo/keystone/schema')
const { DEFAULT_MAX_PACK_SIZE } = require('@open-condo/webhooks/constants')
const { WebhookSubscription } = require('@open-condo/webhooks/schema/utils/serverSchema')
const { trySendData, buildQuery } = require('@open-condo/webhooks/tasks/tasks.utils')

const LOCK_DURATION = 30 * 1000 // 30 sec
const OK_STATUS = 'OK'
const BAD_RESPONSE_STATUS = 'BAD_RESPONSE'
const NO_RESPONSE_STATUS = 'NO_RESPONSE'
const NO_SUBSCRIPTION_STATUS = 'NO_SUBSCRIPTION'


const locker = new KVLocker({
    lockDuration: LOCK_DURATION,
})
const logger = getLogger()

/**
 *
 * @param subscriptionId
 * @return {Promise<{status: string}>}
 */
async function sendWebhook (subscriptionId) {
    const { keystone } = getSchemaCtx('WebhookSubscription')

    const lockKey = `sendWebhook:${subscriptionId}`
    const lock = await locker.acquire(lockKey)

    try {
        const subscription = await WebhookSubscription.getOne(
            keystone,
            { id: subscriptionId },
            'model fields filters syncedAt syncedAmount failuresCount maxPackSize ' +
            'url updatedAt webhook { url user { id } }'
        )
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
        let lastSyncTime = null
        let lastSubscriptionUpdate = updatedAt

        const where = {
            ...filters,
            updatedAt_gt: syncedAt,
        }
        logger.info({ msg: 'prepare', url, entityId: subscriptionId, entity: 'WebhookSubscription', data: { lastLoaded, packSize } })

        while (lastLoaded === packSize) {
            // Step 1: Receive another batch
            const variables = { first: maxPackSize || DEFAULT_MAX_PACK_SIZE, skip: totalLoaded, where }
            const userId = get(user, 'id')
            logger.info({ msg: 'tryGetData', url, entityId: subscriptionId, entity: 'WebhookSubscription', data: { variables, model, fields, userId } })
            const objs = await execGqlAsUser(keystone, user, {
                query,
                variables,
                dataPath: 'objs',
                deleted: true,
            })
            logger.info({ msg: 'tryGetResult', url, entityId: subscriptionId, entity: 'WebhookSubscription', data: { data: objs, variables, model, fields, userId } })

            lastLoaded = objs.length

            // No more objects -> GOTO final update syncedAt
            if (lastLoaded === 0) {
                break
            }

            // Step 2: Send batch to specified url
            const opts = { model, fields, variables, lastLoaded, totalLoaded, user }
            logger.info({ msg: 'trySendData', url, entityId: subscriptionId, entity: 'WebhookSubscription', data: { data: objs, opts }  })
            const response = await trySendData(url, objs)
            logger.info({ msg: 'trySendResult', url, entityId: subscriptionId, entity: 'WebhookSubscription', status: response.status })

            lastSendSuccess = response.ok

            // If not succeed - log and finish task
            if (!lastSendSuccess) {
                logger.warn({ msg: 'webhook pack was not delivered', url, entityId: subscriptionId, entity: 'WebhookSubscription', status: response.status, data: { totalLoaded, failuresCount } })
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
                    return { status: NO_RESPONSE_STATUS }
                } else {
                    return { status: BAD_RESPONSE_STATUS }
                }

            } else {
                totalLoaded += lastLoaded
                // NOTE: objs are sorted by updatedAt. Reads go to an async replica, so "now" would skip objects not replicated yet
                lastSyncTime = objs[objs.length - 1]?.updatedAt
                if (!lastSyncTime) {
                    logger.warn({ msg: 'no updatedAt in subscription fields, syncedAt falls back to now', entityId: subscriptionId, entity: 'WebhookSubscription', data: { model, fields } })
                    lastSyncTime = dayjs().toISOString()
                }
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

        // NOTE: offset left by an interrupted run - reset it, so it can not drift
        if (!lastSyncTime && syncedAmount > 0) {
            logger.warn({ msg: 'syncedAmount left by an interrupted run, syncedAt is reset to now', entityId: subscriptionId, entity: 'WebhookSubscription', count: syncedAmount, data: { syncedAt } })
            lastSyncTime = dayjs().toISOString()
        }

        // NOTE: nothing was sent - keep syncedAt, so objects not replicated yet are picked up by the next run
        if (!lastSyncTime) {
            return { status: OK_STATUS }
        }

        await WebhookSubscription.update(keystone, subscriptionId, {
            syncedAt: lastSyncTime,
            dv: 1,
            sender: { dv: 1, fingerprint: 'sendWebhook' },
        })

        return { status: OK_STATUS }

    } catch (err) {
        logger.error({ msg: 'Send webhook error', err, entityId: subscriptionId, entity: 'WebhookSubscription' })
    } finally {
        logger.info({ msg: 'Lock released', entityId: subscriptionId, entity: 'WebhookSubscription' })
        await lock.release()
    }
}

module.exports = {
    trySendData,
    sendWebhook,
}
