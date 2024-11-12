const dayjs = require('dayjs')
const get = require('lodash/get')

const { getLogger } = require('@open-condo/keystone/logging')
const { getRedisClient } = require('@open-condo/keystone/redis')
const { find } = require('@open-condo/keystone/schema')

const { CONTEXT_FINISHED_STATUS } = require('@condo/domains/acquiring/constants/context')
const { getMonthStart } = require('@condo/domains/common/utils/date')
const { sendBillingReceiptsAddedNotificationForOrganizationContextTask } = require('@condo/domains/resident/tasks/sendBillingReceiptsAddedNotificationForOrganizationContextTask')

const logger = getLogger('sendBillingReceiptsAddedNotifications')

const REDIS_KEY_PREFIX = 'LAST_SEND_BILLING_RECEIPT_NOTIFICATION_CREATED_AT:'

const sendBillingReceiptsAddedNotifications = async (parentTaskId) => {
    const redisClient = getRedisClient()
    const lastSync = new Date(getMonthStart()).toISOString()

    /**
     * This represents min value for billingReceipt createdAt to start processing from
     * 1. First of all use resendFromDt from CLI parameter if available, else
     * 2. Use createdAt value from last success script execution stored in Redis, else
     * 3. Use thisMonthStart
     */

    logger.info({ msg: 'Starting billing receipts notification process', parentTaskId })

    // After synchronization with integrations (RegisterBillingReceiptsService), the context is updated to put the lastReport:JSON field.
    // Therefore, we understand that according to the context updated after the date of the last notification mailing, there are new receipts and we fetch such contexts.

    const BillingContexts = await find('BillingIntegrationOrganizationContext', {
        updatedAt_gte: lastSync,
        status: CONTEXT_FINISHED_STATUS,
        deletedAt: null,
    })

    for (const context of BillingContexts) {
        const lastReport = get(context, 'lastReport.finishTime')
        if (!lastReport) return

        const redisKey = `${REDIS_KEY_PREFIX}${context.id}`
        const lastSyncDate = await redisClient.get(redisKey)

        if (!lastSyncDate || dayjs(lastReport).isAfter(dayjs(lastSyncDate))) {
            await redisClient.set(redisKey, lastReport)
            sendBillingReceiptsAddedNotificationForOrganizationContextTask.delay(context, lastSync, parentTaskId)
        }
    }
}

module.exports = {
    sendBillingReceiptsAddedNotifications,
}
