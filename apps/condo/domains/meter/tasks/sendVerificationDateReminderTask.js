const dayjs = require('dayjs')

const { featureToggleManager } = require('@open-condo/featureflags/featureToggleManager')
const { getLogger } = require('@open-condo/keystone/logging')
const { createCronTask } = require('@open-condo/keystone/tasks')


const { SEND_METER_VERIFICATION_DATE_REMINDER_TASK } = require('@condo/domains/common/constants/featureflags')

const { sendVerificationDateReminder } = require('./sendVerificationDateReminder')

const logger = getLogger()

const sendVerificationDateReminderTaskFn = async (context = null) => {
    const isFeatureEnabled = await featureToggleManager.isFeatureEnabled(context, SEND_METER_VERIFICATION_DATE_REMINDER_TASK)

    // Skip sending notifications if feature is disabled on https://growthbook.doma.ai/features
    if (!isFeatureEnabled) {
        logger.info(`sendVerificationDateReminder task was skipped due to disabled growthbook feature flag [${SEND_METER_VERIFICATION_DATE_REMINDER_TASK}]`)

        return 'disabled'
    }

    await sendVerificationDateReminder({ date: dayjs(), searchWindowDaysShift: 0, daysCount: 30 })
    await sendVerificationDateReminder({ date: dayjs(), searchWindowDaysShift: 30, daysCount: 30 })
}

/**
 * Syncs new and cancelled subscriptions
 */
const sendVerificationDateReminderTask = createCronTask('sendVerificationDateReminder', '0 14 * * 1-5', sendVerificationDateReminderTaskFn)

module.exports = sendVerificationDateReminderTask
