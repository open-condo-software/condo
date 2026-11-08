const dayjs = require('dayjs')
const get = require('lodash/get')

const { execGqlAsUser } = require('@open-condo/codegen/generate.server.utils')
const { KVLocker } = require('@open-condo/keystone/locks')
const { getLogger } = require('@open-condo/keystone/logging')
const { getSchemaCtx } = require('@open-condo/keystone/schema')
const { DEFAULT_MAX_PACK_SIZE, ID_FIELD_ALIAS, UPDATED_AT_FIELD_ALIAS } = require('@open-condo/webhooks/constants')
const { WebhookSubscription } = require('@open-condo/webhooks/schema/utils/serverSchema')
const { trySendData, buildQuery } = require('@open-condo/webhooks/tasks/tasks.utils')

const LOCK_DURATION_IN_MS = 5 * 60 * 1000 // 5 min in ms
const OK_STATUS = 'OK'
const BAD_RESPONSE_STATUS = 'BAD_RESPONSE'
const NO_RESPONSE_STATUS = 'NO_RESPONSE'
const NO_SUBSCRIPTION_STATUS = 'NO_SUBSCRIPTION'


const locker = new KVLocker({
    lockDuration: LOCK_DURATION_IN_MS,
})
const logger = getLogger()

function _gqlToPayload (item) {
    return Object.fromEntries(Object.entries(item).filter(([key]) => key !== ID_FIELD_ALIAS && key !== UPDATED_AT_FIELD_ALIAS))
}

function _expandFields (originalFields) {
    const unwrappedFields = originalFields.slice(1, -1)
    return `{ ${ID_FIELD_ALIAS}: id, ${UPDATED_AT_FIELD_ALIAS}: updatedAt, ${unwrappedFields} }`
}

/**
 * NOTE: we sort all items by [updatedAt_ASC, id_ASC] and fetch N+1 items. There might be 3 possible outcomes:
 * 1. Batch.length <= N. No more items to sync, this util won't be called
 *
 * 2. Batch.length === N+1 && Batch[-1][updatedAt] !== Batch[-2][updatedAt].
 * We fetched N+1 item, and last 2 has different updatedAt values => we can use updatedAt of Nth element as a baseline
 * So filter will look like: { updatedAt_gt: Batch[-2][updatedAt] }
 *
 * 3. Batch.length === N+1 && Batch[-1][updatedAt] === Batch[-2][updatedAt].
 * We fetched N+1 item, and last 2 items has same updatedAt values. We call it partial fetch, so we need to fetch more
 * And filter will look like:
 * OR: [{ updatedAt_gt: Batch[-2][updatedAt] }, {updatedAt: Batch[-2][updatedAt], id_gt: Batch[-2][id] }]
 * @param {object} originalWhere - original where from WebhookSubscription model
 * @param {string} syncedTo - updatedAt of last item in previous batch
 * @param {Array<string>} partiallySyncedItemIds - previously sent items with updatedAt = syncedTo
 * @private
 */
function _buildWhere ({
    originalWhere,
    syncedTo,
    partiallySyncedItemIds,
}) {
    const newItemsFilter = { updatedAt_gt: syncedTo }

    let timeFilter = newItemsFilter

    if (partiallySyncedItemIds.length > 0) {
        const sameTimeFilter = { updatedAt: syncedTo, id_not_in: partiallySyncedItemIds }
        timeFilter = {
            OR: [
                { AND: [sameTimeFilter] },
                { AND: [newItemsFilter] },
            ],
        }
    }

    return {
        where: { AND: [originalWhere, timeFilter] },
        timeFilter,
    }
}

async function _updateSubscriptionOnFail ({
    updatedAt,
    failuresCount,
    partiallySyncedItemIds,
    syncedTo,
    prevSyncedTo,
    syncedAt,
    keystone,
    subscriptionId,
}) {
    const noFailureIncrementInterval = dayjs().subtract(1, 'hour')
    const lastUpdate = dayjs(updatedAt)
    const updatePayload = {}
    if (failuresCount === 0 || noFailureIncrementInterval.isAfter(lastUpdate)) {
        updatePayload.failuresCount = failuresCount + 1
    }

    const syncTimeToSave = partiallySyncedItemIds.length ? prevSyncedTo : syncedTo
    if (syncTimeToSave !== syncedAt) {
        updatePayload.syncedAt = syncTimeToSave
    }

    if (Object.keys(updatePayload).length > 0) {
        await WebhookSubscription.update(keystone, subscriptionId, {
            ...updatePayload,
            dv: 1,
            sender: { dv: 1, fingerprint: 'sendWebhook' },
        })
    }
}

async function _sendWebhook (subscriptionId) {
    const { keystone } = getSchemaCtx('WebhookSubscription')
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
        fields: originalFields,
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
    const fields = _expandFields(originalFields)
    const query = buildQuery(model, fields)

    let hasMoreItems = true
    let syncedTo = syncedAt
    let prevSyncedTo = syncedTo
    let partiallySyncedItemIds = []

    while (hasMoreItems) {
        const { where } = _buildWhere({
            originalWhere: filters,
            syncedTo,
            partiallySyncedItemIds,
        })

        const variables = { first: packSize + 1, skip: 0, where }
        const userId = get(user, 'id')
        const loggerData = { variables, model, fields, userId }
        logger.info({ msg: 'tryGetData', url, entityId: subscriptionId, entity: 'WebhookSubscription', data: loggerData })
        let objs = []
        let err = null

        try {
            objs = await execGqlAsUser(keystone, user, {
                query,
                variables,
                dataPath: 'objs',
                deleted: true,
            })
        } catch (queryErr) {
            // NOTE: if query (somehow) fails, then:
            // objs.length = 0 -> hasMoreItems = false -> while ended -> subscription saved state
            // query can potentially fail during refetch (partiallySyncedItemIds.length > 0),
            // so we override syncedTo to prevSyncedTo, so it will be saved instead
            err = queryErr

            await _updateSubscriptionOnFail({
                updatedAt,
                failuresCount,
                partiallySyncedItemIds,
                syncedTo,
                prevSyncedTo,
                syncedAt,
                keystone,
                subscriptionId,
            })

            return { status: NO_RESPONSE_STATUS }
        } finally {
            loggerData.data = objs
            logger.info({ msg: 'tryGetResult', url, entityId: subscriptionId, entity: 'WebhookSubscription', data: loggerData, err })
        }

        const itemsPack = objs.slice(0, packSize)
        hasMoreItems = (objs.length > packSize)
        const clearedItems = itemsPack.map(item => _gqlToPayload(item))

        loggerData.data = clearedItems

        if (clearedItems.length) {
            logger.info({ msg: 'trySendData', url, entityId: subscriptionId, entity: 'WebhookSubscription', data: loggerData, count: clearedItems.length  })
            const response = await trySendData(url, clearedItems)
            logger.info({ msg: 'trySendResult', url, entityId: subscriptionId, entity: 'WebhookSubscription', status: response.status })

            if (!response.ok) {
                await _updateSubscriptionOnFail({
                    updatedAt,
                    failuresCount,
                    partiallySyncedItemIds,
                    syncedTo,
                    prevSyncedTo,
                    syncedAt,
                    keystone,
                    subscriptionId,
                })

                return {
                    status: response.status === 523 ? NO_RESPONSE_STATUS : BAD_RESPONSE_STATUS,
                }
            }
        }


        // NOTE: No more items -> clear partial state and exit the loop
        if (!hasMoreItems) {
            partiallySyncedItemIds = []
            if (itemsPack.length) {
                prevSyncedTo = syncedTo
                syncedTo = itemsPack[itemsPack.length - 1][UPDATED_AT_FIELD_ALIAS]
            }
            break
        }

        // NOTE: Else update state
        const nextBatchMinUpdatedAtDate = dayjs(objs[objs.length - 1][UPDATED_AT_FIELD_ALIAS])
        const currentBatchMaxUpdatedAt = objs[objs.length - 2][UPDATED_AT_FIELD_ALIAS]
        // NOTE: negation is important here
        const isCollision = !nextBatchMinUpdatedAtDate.isAfter(currentBatchMaxUpdatedAt)

        // NOTE: Clear partial info if N+1 item updatedAt > N item updatedAt or collision just started during this iteration:
        // Example 1: [1, 1, 1, 1], 2 -> no collision
        // Example 2: [0, 0, 1, 1], 1 -> collision just started
        if (!isCollision || !nextBatchMinUpdatedAtDate.isSame(syncedTo)) {
            partiallySyncedItemIds = []
        }

        // NOTE: expand exclusion list
        if (isCollision) {
            partiallySyncedItemIds.push(
                ...itemsPack
                    .filter(obj => nextBatchMinUpdatedAtDate.isSame(obj[UPDATED_AT_FIELD_ALIAS]))
                    .map(obj => obj[ID_FIELD_ALIAS])
            )
        }

        if (currentBatchMaxUpdatedAt !== syncedTo) {
            prevSyncedTo = syncedTo
            syncedTo = currentBatchMaxUpdatedAt
        }
    }

    if (syncedTo !== syncedAt || failuresCount > 0) {
        await WebhookSubscription.update(keystone, subscriptionId, {
            syncedAt: syncedTo,
            failuresCount: 0,
            dv: 1,
            sender: { dv: 1, fingerprint: 'sendWebhook' },
        })
    }

    return { status: OK_STATUS }
}

/**
 *
 * @param subscriptionId
 * @return {Promise<{status: string}>}
 */
async function sendWebhook (subscriptionId) {
    const lockKey = `sendWebhook:${subscriptionId}`
    const lock = await locker.acquire(lockKey)

    try {
        return await _sendWebhook(subscriptionId)
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
