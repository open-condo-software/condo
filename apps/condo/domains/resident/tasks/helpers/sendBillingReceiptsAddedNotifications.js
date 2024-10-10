const dayjs = require('dayjs')
const get = require('lodash/get')

const { getLogger } = require('@open-condo/keystone/logging')
const { find } = require('@open-condo/keystone/schema')

const { CONTEXT_FINISHED_STATUS } = require('@condo/domains/acquiring/constants/context')
const { getMonthStart } = require('@condo/domains/common/utils/date')
const { sendBillingReceiptsAddedNotificationForOrganizationContextTask } = require('@condo/domains/resident/tasks/sendBillingReceiptsAddedNotificationForOrganizationContextTask')

const logger = getLogger('sendBillingReceiptsAddedNotifications')


const sendBillingReceiptsAddedNotifications = async (resendFromDt = null, taskId) => {
    const thisMonthStart = getMonthStart()

    /**
     * This represents min value for billingReceipt createdAt to start processing from
     * 1. First of all use resendFromDt from CLI parameter if available, else
     * 2. Use createdAt value from last success script execution stored in Redis, else
     * 3. Use thisMonthStart
     */
    const lastDt = resendFromDt ? resendFromDt.replace(' ', 'T') : thisMonthStart

    logger.info({ msg: 'stored date', storedDt: lastDt, taskId })

    const lastSync = new Date(lastDt).toISOString()
    if (!lastSync) throw new Error(`Invalid last sync date: ${lastDt}`)
    // After synchronization with integrations (RegisterBillingReceiptsService), the context is updated to put the lastReport:JSON field. 
    // Therefore, we understand that according to the context updated after the date of the last notification mailing, there are new receipts and we fetch such contexts.
    const BillingContexts = await find('BillingIntegrationOrganizationContext', {
        updatedAt_gte: lastSync,
        status: CONTEXT_FINISHED_STATUS,
        deletedAt: null,
    })

    BillingContexts.forEach((context) => {
        const lastReport = get(context, 'lastReport.finishTime')
        if (dayjs(lastReport).isAfter(dayjs(lastSync))) {
            sendBillingReceiptsAddedNotificationForOrganizationContextTask.delay(context, lastSync, taskId)
        }
    })
}

module.exports = {
    sendBillingReceiptsAddedNotifications,
}
