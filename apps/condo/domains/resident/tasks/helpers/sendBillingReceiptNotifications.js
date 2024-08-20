
const { v4: uuid } = require('uuid')

const { featureToggleManager } = require('@open-condo/featureflags/featureToggleManager')
const { getLogger } = require('@open-condo/keystone/logging')

const { SEND_BILLING_RECEIPTS_NOTIFICATIONS_TASK } = require('@condo/domains/common/constants/featureflags')

const { sendBillingReceiptsAddedNotifications } = require('./sendBillingReceiptsAddedNotifications')
const { sendResidentsNoAccountNotifications } = require('./sendResidentsNoAccountNotifications')

const logger = getLogger('sendBillingReceiptsAddedNotifications')

const sendBillingReceiptNotifications = async (context = null, receivedTaskId = null) => {
    const isFeatureEnabled = await featureToggleManager.isFeatureEnabled(context, SEND_BILLING_RECEIPTS_NOTIFICATIONS_TASK)
    const taskId = receivedTaskId || uuid()

    // Skip sending notifications if feature is disabled on https://growthbook.doma.ai/features
    // This affects only cron task, notifications still could be sent using scripts in condo/
    if (!isFeatureEnabled) {
        logger.info(`sendBillingReceiptNotifications was skipped due to disabled growthbook feature flag [${SEND_BILLING_RECEIPTS_NOTIFICATIONS_TASK}]`, taskId)

        return 'disabled'
    }

    await sendBillingReceiptsAddedNotifications(null, taskId)
    await sendResidentsNoAccountNotifications()
}

module.exports = {
    sendBillingReceiptNotifications,
}