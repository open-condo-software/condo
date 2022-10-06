const { SEND_BILLING_RECEIPTS_NOTIFICATIONS_TASK } = require('@condo/domains/common/constants/featureflags')

const { featureToggleManager } = require('@condo/featureflags/featureToggleManager')

const { getLogger } = require('@condo/keystone/logging')

const { sendBillingReceiptsAddedNotifications } = require('./sendBillingReceiptsAddedNotifications')
const { sendResidentsNoAccountNotifications } = require('./sendResidentsNoAccountNotifications')

const logger = getLogger('sendBillingReceiptsAddedNotifications')

const sendBillingReceiptNotifications = async () => {
    const data = { req: { features: await featureToggleManager.fetchFeatures() } }
    const isFeatureEnabled = featureToggleManager.isFeatureEnabled( data, SEND_BILLING_RECEIPTS_NOTIFICATIONS_TASK )

    // Skip sending notifications if feature is disabled on https://growthbook.doma.ai/features
    // This affects only cron task, notifications still could be sent using scripts in condo/
    if (!isFeatureEnabled) {
        logger.info({ message: `sendBillingReceiptNotifications cron task skipped due to disabled growthbook feature flag [${SEND_BILLING_RECEIPTS_NOTIFICATIONS_TASK}]` })

        return
    }

    await sendBillingReceiptsAddedNotifications()
    await sendResidentsNoAccountNotifications()
}

module.exports = {
    sendBillingReceiptNotifications,
}