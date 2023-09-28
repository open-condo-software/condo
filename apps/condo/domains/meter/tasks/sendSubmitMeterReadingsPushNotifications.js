const { featureToggleManager } = require('@open-condo/featureflags/featureToggleManager')
const { getLogger } = require('@open-condo/keystone/logging')

const { SEND_SUBMIT_METER_READINGS_PUSH_NOTIFICATIONS_TASK } = require('@condo/domains/common/constants/featureflags')
const { sendSubmitMeterReadingsPushNotifications: sendSubmitMeterReadingsPushNotificationsUtil } = require('@condo/domains/meter/utils/serverSchema/sendSubmitMeterReadingsPushNotifications')

const logger = getLogger('meter/sendSubmitMeterReadingsPushNotifications')

const sendSubmitMeterReadingsPushNotifications = async (context = null) => {
    const isFeatureEnabled = await featureToggleManager.isFeatureEnabled(context, SEND_SUBMIT_METER_READINGS_PUSH_NOTIFICATIONS_TASK)

    // Skip sending notifications if feature is disabled on https://growthbook.doma.ai/features
    if (!isFeatureEnabled) {
        logger.info(`sendSubmitMeterReadingsPushNotifications task was skipped due to disabled growthbook feature flag [${SEND_SUBMIT_METER_READINGS_PUSH_NOTIFICATIONS_TASK}]`)

        return 'disabled'
    }

    await sendSubmitMeterReadingsPushNotificationsUtil()
}

module.exports = {
    sendSubmitMeterReadingsPushNotifications,
}
