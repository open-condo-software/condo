const dayjs = require('dayjs')

const { featureToggleManager } = require('@open-condo/featureflags/featureToggleManager')
const { getLogger } = require('@open-condo/keystone/logging')

const { SEND_METER_VERIFICATION_DATE_REMINDER_TASK } = require('@condo/domains/common/constants/featureflags')
const { sendVerificationDateReminder: sendVerificationDateReminderUtil } = require('@condo/domains/meter/utils/serverSchema/sendVerificationDateReminder')

const logger = getLogger('meter/sendVerificationDateReminder')

const sendVerificationDateReminder = async (context = null) => {
    const isFeatureEnabled = await featureToggleManager.isFeatureEnabled(context, SEND_METER_VERIFICATION_DATE_REMINDER_TASK)

    // Skip sending notifications if feature is disabled on https://growthbook.doma.ai/features
    if (!isFeatureEnabled) {
        logger.info(`sendVerificationDateReminder task was skipped due to disabled growthbook feature flag [${SEND_METER_VERIFICATION_DATE_REMINDER_TASK}]`)

        return 'disabled'
    }

    await sendVerificationDateReminderUtil({ date: dayjs(), searchWindowDaysShift: 0, daysCount: 30 })
    await sendVerificationDateReminderUtil({ date: dayjs(), searchWindowDaysShift: 30, daysCount: 30 })
}


module.exports = {
    sendVerificationDateReminder,
}
