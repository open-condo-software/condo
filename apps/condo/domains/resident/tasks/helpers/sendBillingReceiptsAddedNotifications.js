const dayjs = require('dayjs')
const get = require('lodash/get')

const { getLogger } = require('@open-condo/keystone/logging')
const { find } = require('@open-condo/keystone/schema')

const { CONTEXT_FINISHED_STATUS } = require('@condo/domains/acquiring/constants/context')
const { sendBillingReceiptsAddedNotificationForOrganizationContextTask } = require('@condo/domains/resident/tasks/sendBillingReceiptsAddedNotificationForOrganizationContextTask')
const logger = getLogger('sendBillingReceiptsAddedNotifications')

const sendBillingReceiptsAddedNotifications = async () => {
    logger.info({ msg: 'Starting billing receipts notification process' })
    const lastSendDate = dayjs().subtract(2, 'day').toISOString()
    const BillingContexts = await find('BillingIntegrationOrganizationContext', {
        updatedAt_gte: lastSendDate,
        status: CONTEXT_FINISHED_STATUS,
        deletedAt: null,
    })

    logger.info({ msg: 'Billing contexts for pushes', data: { BillingContexts } })

    for (const context of BillingContexts) {
        const lastReport = get(context, 'lastReport.finishTime')
        if (!lastReport) continue
        sendBillingReceiptsAddedNotificationForOrganizationContextTask.delay(context, lastSendDate)
    }
}

module.exports = {
    sendBillingReceiptsAddedNotifications,
}
