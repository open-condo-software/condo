const dayjs = require('dayjs')
const get = require('lodash/get')

const { getLogger } = require('@open-condo/keystone/logging')
const { getRedisClient } = require('@open-condo/keystone/redis')
const { find } = require('@open-condo/keystone/schema')

const { CONTEXT_FINISHED_STATUS } = require('@condo/domains/acquiring/constants/context')
const { getStartDates } = require('@condo/domains/common/utils/date')
const { REDIS_LAST_DATE_KEY, REDIS_LAST_DATE_KEY_PREFIX } = require('@condo/domains/resident/constants')
const { sendBillingReceiptsAddedNotificationForOrganizationContextTask } = require('@condo/domains/resident/tasks/sendBillingReceiptsAddedNotificationForOrganizationContextTask')
const logger = getLogger('sendBillingReceiptsAddedNotifications')

const sendBillingReceiptsAddedNotifications = async () => {
    const redisClient = getRedisClient()
    const { prevMonthStart } = getStartDates()
    const lastSync = new Date(prevMonthStart).toISOString()

    /**
     * This represents min value for billingReceipt createdAt to start processing from
     * 1. First of all use resendFromDt from CLI parameter if available, else
     * 2. Use createdAt value from last success script execution stored in Redis, else
     * 3. Use thisMonthStart
     */

    logger.info({ msg: 'Starting billing receipts notification process' })

    // After synchronization with integrations (RegisterBillingReceiptsService), the context is updated to put the lastReport:JSON field.
    // Therefore, we understand that according to the context updated after the date of the last notification mailing, there are new receipts, and we fetch such contexts.

    const BillingContexts = await find('BillingIntegrationOrganizationContext', {
        updatedAt_gte: lastSync,
        status: CONTEXT_FINISHED_STATUS,
        deletedAt: null,
    })
    const oldWayLastSyncDate = await redisClient.get(REDIS_LAST_DATE_KEY)

    for (const context of BillingContexts) {
        const lastReport = get(context, 'lastReport.finishTime')
        if (!lastReport) continue
        logger.info({ msg: 'Old way redis key', data: { oldWayLastSyncDate, lastReport  } })
        if (oldWayLastSyncDate && dayjs(oldWayLastSyncDate).isAfter(dayjs(lastReport))) continue


        const redisKey = `${REDIS_LAST_DATE_KEY_PREFIX}${context.id}`
        const lastSyncDate = await redisClient.get(redisKey)
        if (!lastSyncDate || dayjs(lastReport).isAfter(dayjs(lastSyncDate))) {
            await redisClient.set(redisKey, lastReport)
            sendBillingReceiptsAddedNotificationForOrganizationContextTask.delay(context, lastSyncDate)
        }
    }
}

module.exports = {
    sendBillingReceiptsAddedNotifications,
}
