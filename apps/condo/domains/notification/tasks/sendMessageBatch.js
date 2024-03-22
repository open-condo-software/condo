const dayjs = require('dayjs')

const { getSchemaCtx } = require('@open-condo/keystone/schema')
const { createTask } = require('@open-condo/keystone/tasks')

const { MessageBatch } = require('@condo/domains/notification/utils/serverSchema')

const { DATE_FORMAT, prepareAndSendMessage, normalizeTarget } = require('./sendMessageBatch.helpers')

const { MESSAGE_BATCH_CREATED_STATUS, MESSAGE_BATCH_PROCESSING_STATUS, MESSAGE_BATCH_DONE_STATUS, MESSAGE_BATCH_FAILED_STATUS } = require('../constants/constants')

async function sendMessageBatch (batchId) {
    const { keystone: context } = await getSchemaCtx('MessageBatch')
    const batch = await MessageBatch.getOne(context, { id: batchId })

    // Skip batches that are already have been processed
    if (batch.status !== MESSAGE_BATCH_CREATED_STATUS) return 'batch already processed'

    const baseAttrs = {
        dv: batch.dv,
        sender: batch.sender,
    }

    await MessageBatch.update(context, batch.id, {
        ...baseAttrs,
        status: MESSAGE_BATCH_PROCESSING_STATUS,
    })

    // This needed to skip duplicate targets in batch
    const usedTargets = {}
    const today = dayjs().format(DATE_FORMAT)
    let successCnt = 0, count = 0, failCnt = 0, failedTargets = [], duplicates = 0

    for (const target of batch.targets) {
        const normalizedTarget = normalizeTarget(target)
        count += 1

        if (!normalizedTarget) {
            failCnt += 1
            failedTargets.push(target)

            continue
        }

        // skip duplicate items
        if (usedTargets[normalizedTarget]) {
            duplicates += 1

            continue
        }

        usedTargets[normalizedTarget] = true

        const success = await prepareAndSendMessage(context, target, batch, today)

        failCnt += 1 - success
        successCnt += success

        if (!success) failedTargets.push(target)
    }

    const nextStatus = successCnt > 0 ? MESSAGE_BATCH_DONE_STATUS : MESSAGE_BATCH_FAILED_STATUS

    await MessageBatch.update(context, batch.id, {
        ...baseAttrs,
        status: nextStatus,
        processingMeta: {
            dv: 1,
            processed: count,
            duplicates,
            successCnt,
            failCnt,
            total: batch.targets.length,
            failedTargets,
        },
    })
}

module.exports = {
    sendMessageBatch: createTask('sendMessageBatch', sendMessageBatch, 'high'),
}
