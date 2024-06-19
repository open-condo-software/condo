const dayjs = require('dayjs')

const { generateGqlQueries } = require('@open-condo/codegen/generate.gql')
const { generateServerUtils } = require('@open-condo/codegen/generate.server.utils')
const { getSchemaCtx } = require('@open-condo/keystone/schema')
const { createTask } = require('@open-condo/keystone/tasks')

const { loadListByChunks } = require('@condo/domains/common/utils/serverSchema')
const { PHONE_BY_USER_ID, MESSAGE_BATCH_CREATED_STATUS, MESSAGE_BATCH_PROCESSING_STATUS, MESSAGE_BATCH_DONE_STATUS, MESSAGE_BATCH_FAILED_STATUS } = require('@condo/domains/notification/constants/constants')
const { MessageBatch } = require('@condo/domains/notification/utils/serverSchema')
const { DELETED_USER_NAME } = require('@condo/domains/user/constants')

const { DATE_FORMAT, prepareAndSendMessage, normalizeTarget } = require('./sendMessageBatch.helpers')


const UserQueries = generateGqlQueries('User', '{ email phone id dv sender { dv fingerprint } deletedAt createdBy { id name } updatedBy { id name } createdAt updatedAt }')
const User = generateServerUtils(UserQueries)

async function sendMessageBatch (batchId) {
    const { keystone: context } = await getSchemaCtx('MessageBatch')
    const batch = await MessageBatch.getOne(context, { id: batchId })
    const isPhoneByUserFlow = batch.sendVia === PHONE_BY_USER_ID
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

    if (isPhoneByUserFlow) {
        const processedTargets = await loadListByChunks({
            context,
            list: User,
            where: {
                id_in: batch.targets,
                name_not: DELETED_USER_NAME,
                deletedAt: null,
            },
            chunkProcessor: async (users) => users.map(user => user.id),
        })
        batch.targets = processedTargets.flat()
    }
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
        if (usedTargets[target]) {
            duplicates += 1

            continue
        }

        usedTargets[target] = true

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
    sendMessageBatch: createTask('sendMessageBatch', sendMessageBatch, 'low'),
}
