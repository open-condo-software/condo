const get = require('lodash/get')

const { getLogger } = require('@open-condo/keystone/logging')
const { allItemsQueryByChunks } = require('@open-condo/keystone/schema')

const { CONTEXT_FINISHED_STATUS } = require('@condo/domains/acquiring/constants/context')
const { sendBillingReceiptsAddedNotificationForOrganizationContextTask } = require('@condo/domains/resident/tasks/sendBillingReceiptsAddedNotificationForOrganizationContextTask')
const logger = getLogger()

const sendBillingReceiptsAddedNotifications = async (lastSendDate) => {
    logger.info({ msg: 'starting billing receipts notification process' })

    const BillingContexts = await allItemsQueryByChunks({
        schemaName: 'BillingIntegrationOrganizationContext',
        where: {
            updatedAt_gte: lastSendDate,
            status: CONTEXT_FINISHED_STATUS,
            deletedAt: null,
        } })

    logger.info({ msg: 'billing contexts for pushes', data: { BillingContexts } })

    for (const context of BillingContexts) {
        const lastReport = get(context, 'lastReport.finishTime')
        if (!lastReport) continue
        await sendBillingReceiptsAddedNotificationForOrganizationContextTask.delay(context, lastSendDate)
    }
}

module.exports = {
    sendBillingReceiptsAddedNotifications,
}
