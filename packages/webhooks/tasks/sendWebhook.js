const dayjs = require('dayjs')
const get = require('lodash/get')
const { default: RedLock } = require('redlock')

const { execGqlAsUser } = require('@open-condo/codegen/generate.server.utils')
const conf = require('@open-condo/config')
const { getKVClient } = require('@open-condo/keystone/kv')
const { getLogger } = require('@open-condo/keystone/logging')
const { getSchemaCtx } = require('@open-condo/keystone/schema')
const { DEFAULT_MAX_PACK_SIZE } = require('@open-condo/webhooks/constants')
const { WebhookSubscription } = require('@open-condo/webhooks/schema/utils/serverSchema')
const { trySendData, buildQuery } = require('@open-condo/webhooks/tasks/tasks.utils')

const IS_BUILD = conf['DATABASE_URL'] === 'undefined'
const LOCK_DURATION = 30 * 1000 // 30 sec
const OK_STATUS = 'OK'
const BAD_RESPONSE_STATUS = 'BAD_RESPONSE'
const NO_RESPONSE_STATUS = 'NO_RESPONSE'
const NO_SUBSCRIPTION_STATUS = 'NO_SUBSCRIPTION'

const rLock = (IS_BUILD) ? undefined : new RedLock([getKVClient('worker')])
const logger = getLogger()

/**
 *
 * @param subscriptionId
 * @return {Promise<{status: string}>}
 */
async function sendWebhook (subscriptionId) {
    const { keystone } = getSchemaCtx('WebhookSubscription')

    const lockKey = `sendWebhook:${subscriptionId}`
    const lock = await rLock.acquire([lockKey], LOCK_DURATION)

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
        let lastSyncTime = dayjs().toISOString()
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
            // time is measured by the time of the last response from our server received
            lastSyncTime = dayjs().toISOString()

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

        // TODO(pahaz): We do not need to update the WebhookSubscription if no updates are found, as we can utilize the same query and cache it.
        //     We also want to prevent the unnecessary expansion of the history log/database
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
