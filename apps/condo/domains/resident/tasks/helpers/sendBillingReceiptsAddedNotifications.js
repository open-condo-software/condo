const get = require('lodash/get')
const { default: Redlock } = require('redlock')

const { getLogger } = require('@open-condo/keystone/logging')
const { getRedisClient } = require('@open-condo/keystone/redis')
const { find } = require('@open-condo/keystone/schema')

const { CONTEXT_FINISHED_STATUS } = require('@condo/domains/acquiring/constants/context')
const { getMonthStart } = require('@condo/domains/common/utils/date')
const { sendBillingReceiptsAddedNotificationForOrganizationContextTask } = require('@condo/domains/resident/tasks/sendBillingReceiptsAddedNotificationForOrganizationContextTask')


const REDIS_LAST_DATE_KEY = 'LAST_SEND_BILLING_RECEIPT_NOTIFICATION_CREATED_AT'
const rLock = new Redlock([getRedisClient()])

const logger = getLogger('sendBillingReceiptsAddedNotifications')


const sendBillingReceiptsAddedNotifications = async (resendFromDt = null, taskId) => {
    const thisMonthStart = getMonthStart()
    const redisClient = getRedisClient()
    const handleLastDtChange = async (createdAt) => {
        let lock = await rLock.acquire([REDIS_LAST_DATE_KEY], 500, {
            retryDelay: 1000,
            retryCount: 30,
            automaticExtensionThreshold: 100,
            retryJitter: 1000,
        }) // 0.5 sec
        try {
            if (await redisClient.get(REDIS_LAST_DATE_KEY) > createdAt) {
                return
            }
            await redisClient.set(REDIS_LAST_DATE_KEY, createdAt)
        }
        finally {
            await lock.release()
        }

    }

    /**
     * This represents min value for billingReceipt createdAt to start processing from
     * 1. First of all use resendFromDt from CLI parameter if available, else
     * 2. Use createdAt value from last success script execution stored in Redis, else
     * 3. Use thisMonthStart
     */
    const lastDt = resendFromDt ? resendFromDt.replace(' ', 'T') : await redisClient.get(REDIS_LAST_DATE_KEY) || thisMonthStart

    logger.info({ msg: 'stored date', storedDt: await redisClient.get(REDIS_LAST_DATE_KEY), taskId })

    const lastSync = new Date(lastDt).toISOString()
    if (!lastSync) throw new Error(`Invalid last sync date: ${lastDt}`)
    // After synchronization with integrations (RegisterBillingReceiptsService), the context is updated to put the lastReport:JSON field. 
    // Therefore, we understand that according to the context updated after the date of the last notification mailing, there are new receipts and we fetch such contexts.
    const BIOContexts = await find('BillingIntegrationOrganizationContext', {
        updatedAt_gte: lastSync,
        status: CONTEXT_FINISHED_STATUS,
        deletedAt: null,
    })

    BIOContexts.forEach((context) => {
        const lastReport = get(context, 'lastReport.finishTime')
        if ( lastReport > lastSync) {
            sendBillingReceiptsAddedNotificationForOrganizationContextTask.delay(context, lastSync, handleLastDtChange, taskId)
        }
    })
}

module.exports = {
    sendBillingReceiptsAddedNotifications,
}
