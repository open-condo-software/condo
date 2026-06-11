const get = require('lodash/get')

const { getLogger } = require('@open-condo/keystone/logging')
const { getSchemaCtx, allItemsQueryByChunks } = require('@open-condo/keystone/schema')

const { CONTEXT_FINISHED_STATUS } = require('@condo/domains/acquiring/constants/context')
const { sendBillingReceiptsAddedNotificationForOrganizationContextTask } = require('@condo/domains/resident/tasks/sendBillingReceiptsAddedNotificationForOrganizationContextTask')
const { createOrganizationSubscriptionChecker } = require('@condo/domains/subscription/utils/serverSchema/organizationSubscriptionChecker')
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

    const { keystone } = getSchemaCtx('Organization')
    const context = await keystone.createContext({ skipAccessControl: true })
    const hasOrganizationActiveSubscription = createOrganizationSubscriptionChecker()
    for (const billingContext of BillingContexts) {
        const lastReport = get(billingContext, 'lastReport.finishTime')
        if (!lastReport) continue

        const organizationId = get(billingContext, 'organization')
        if (!(await hasOrganizationActiveSubscription(context, organizationId))) continue

        await sendBillingReceiptsAddedNotificationForOrganizationContextTask.delay(billingContext, lastSendDate)
    }
}

module.exports = {
    sendBillingReceiptsAddedNotifications,
}
