const dayjs = require('dayjs')
const get = require('lodash/get')

const { execGqlAsUser } = require('@open-condo/codegen/generate.server.utils')
const { KVLocker } = require('@open-condo/keystone/locks')
const { getLogger } = require('@open-condo/keystone/logging')
const { getSchemaCtx } = require('@open-condo/keystone/schema')
const { WEBHOOK_SYNC_DELAY_IN_SEC } = require('@open-condo/webhooks/config')
const { DEFAULT_MAX_PACK_SIZE } = require('@open-condo/webhooks/constants')
const { WebhookSubscription } = require('@open-condo/webhooks/schema/utils/serverSchema')
const { WEBHOOK_SYNC_UPDATED_AT_FIELD, trySendData, buildQuery } = require('@open-condo/webhooks/tasks/tasks.utils')

const LOCK_DURATION = 30 * 1000 // 30 sec
const OK_STATUS = 'OK'
const BAD_RESPONSE_STATUS = 'BAD_RESPONSE'
const NO_RESPONSE_STATUS = 'NO_RESPONSE'
const NO_SUBSCRIPTION_STATUS = 'NO_SUBSCRIPTION'


const locker = new KVLocker({
    lockDuration: LOCK_DURATION,
})
const logger = getLogger()

const getSyncUpdatedAt = (obj) => obj[WEBHOOK_SYNC_UPDATED_AT_FIELD]

const toWebhookPayload = (obj) => {
    const payload = { ...obj }
    delete payload[WEBHOOK_SYNC_UPDATED_AT_FIELD]
    return payload
}

const getCompleteFirstTimestampGroup = async (objs, initialProbeSize, getObjects) => {
    const groupUpdatedAt = getSyncUpdatedAt(objs[0])
    let probe = objs
    let probeSize = initialProbeSize

    while (probe.length === probeSize && probe.every((obj) => getSyncUpdatedAt(obj) === groupUpdatedAt)) {
        probeSize *= 2
        probe = await getObjects(probeSize)
    }

    const firstNewerObjectIndex = probe.findIndex((obj) => getSyncUpdatedAt(obj) !== groupUpdatedAt)
    const group = firstNewerObjectIndex === -1 ? probe : probe.slice(0, firstNewerObjectIndex)
    const isLastGroup = firstNewerObjectIndex === -1 && probe.length < probeSize

    return { group, groupUpdatedAt, isLastGroup }
}

const getNextBatch = async (getObjects, packSize, syncCutoff) => {
    const lookAheadSize = packSize + 1
    const objs = await getObjects(lookAheadSize)

    if (objs.length === 0) {
        return { objs, syncedAt: syncCutoff, isLastBatch: true }
    }

    if (objs.length <= packSize) {
        return { objs, syncedAt: syncCutoff, isLastBatch: true }
    }

    const boundaryUpdatedAt = getSyncUpdatedAt(objs[packSize - 1])
    const nextUpdatedAt = getSyncUpdatedAt(objs[packSize])

    if (boundaryUpdatedAt !== nextUpdatedAt) {
        return {
            objs: objs.slice(0, packSize),
            syncedAt: boundaryUpdatedAt,
            isLastBatch: false,
        }
    }

    const firstBoundaryObjectIndex = objs.findIndex((obj) => getSyncUpdatedAt(obj) === boundaryUpdatedAt)
    if (firstBoundaryObjectIndex > 0) {
        return {
            objs: objs.slice(0, firstBoundaryObjectIndex),
            syncedAt: getSyncUpdatedAt(objs[firstBoundaryObjectIndex - 1]),
            isLastBatch: false,
        }
    }

    // A timestamp cursor cannot pass a partially delivered group.
    const { group, groupUpdatedAt, isLastGroup } = await getCompleteFirstTimestampGroup(objs, lookAheadSize, getObjects)
    return {
        objs: group,
        syncedAt: isLastGroup ? syncCutoff : groupUpdatedAt,
        isLastBatch: isLastGroup,
    }
}

const sendBatch = async ({ url, objs, packSize, model, fields, user, subscriptionId }) => {
    const payloads = objs.map(toWebhookPayload)

    for (let start = 0; start < payloads.length; start += packSize) {
        const payload = payloads.slice(start, start + packSize)
        const opts = { model, fields, lastLoaded: payload.length, user }
        logger.info({ msg: 'trySendData', url, entityId: subscriptionId, entity: 'WebhookSubscription', data: { data: payload, opts }  })
        const response = await trySendData(url, payload)
        logger.info({ msg: 'trySendResult', url, entityId: subscriptionId, entity: 'WebhookSubscription', status: response.status })

        if (!response.ok) return response
    }

    return { ok: true }
}

const handleFailedResponse = async ({ response, keystone, subscriptionId, failuresCount, lastSubscriptionUpdate }) => {
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

    return response.status === 523 ? NO_RESPONSE_STATUS : BAD_RESPONSE_STATUS
}

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
            'model fields filters syncedAt failuresCount maxPackSize ' +
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

        let lastSyncedAt = syncedAt
        const syncCutoff = dayjs().subtract(WEBHOOK_SYNC_DELAY_IN_SEC, 'second').toISOString()

        if (!dayjs(syncCutoff).isAfter(lastSyncedAt)) {
            return { status: OK_STATUS }
        }

        logger.info({ msg: 'prepare', url, entityId: subscriptionId, entity: 'WebhookSubscription', data: { packSize, syncCutoff } })

        const getObjects = async (first) => {
            const where = {
                ...filters,
                updatedAt_gt: lastSyncedAt,
                updatedAt_lte: syncCutoff,
            }
            const variables = { first, where }
            const userId = get(user, 'id')
            logger.info({ msg: 'tryGetData', url, entityId: subscriptionId, entity: 'WebhookSubscription', data: { variables, model, fields, userId } })
            const objs = await execGqlAsUser(keystone, user, {
                query,
                variables,
                dataPath: 'objs',
                deleted: true,
            })
            logger.info({ msg: 'tryGetResult', url, entityId: subscriptionId, entity: 'WebhookSubscription', data: { data: objs, variables, model, fields, userId } })

            return objs
        }

        while (dayjs(syncCutoff).isAfter(lastSyncedAt)) {
            const batch = await getNextBatch(getObjects, packSize, syncCutoff)
            if (batch.objs.length === 0) {
                await WebhookSubscription.update(keystone, subscriptionId, {
                    syncedAt: batch.syncedAt,
                    dv: 1,
                    sender: { dv: 1, fingerprint: 'sendWebhook' },
                })
                return { status: OK_STATUS }
            }

            const response = await sendBatch({
                url,
                objs: batch.objs,
                packSize,
                model,
                fields,
                user,
                subscriptionId,
            })
            if (!response.ok) {
                const status = await handleFailedResponse({ response, keystone, subscriptionId, failuresCount, lastSubscriptionUpdate: updatedAt })
                return { status }
            }

            await WebhookSubscription.update(keystone, subscriptionId, {
                syncedAt: batch.syncedAt,
                dv: 1,
                sender: { dv: 1, fingerprint: 'sendWebhook' },
            })
            lastSyncedAt = batch.syncedAt

            if (batch.isLastBatch) {
                return { status: OK_STATUS }
            }
        }

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
