const dayjs = require('dayjs')

const { featureToggleManager } = require('@open-condo/featureflags/featureToggleManager')
const { getLogger } = require('@open-condo/keystone/logging')
const { createCronTask } = require('@open-condo/keystone/tasks')

const { SEND_BILLING_RECEIPTS_ON_PAYDAY_REMAINDER_TASK } = require('@condo/domains/common/constants/featureflags')

const { notifyOnPaydayIsCurrentDateValid } = require('./helpers/notifyOnPaydayisCurrnetDateValid')
const { notifyResidentsOnPayday } = require('./notifyResidentsOnPayday')


const logger = getLogger('meter/sendSubmitMeterReadingsPushNotifications')

const notifyResidentsOnPaydayTaskFn = async (context = null) => {
    const isFeatureEnabled = await featureToggleManager.isFeatureEnabled(context, SEND_BILLING_RECEIPTS_ON_PAYDAY_REMAINDER_TASK)
    const today = dayjs()
    
    if (!isFeatureEnabled) {
        logger.info(`notifyResidentsOnPayday task was skipped due to disabled growthbook feature flag [${SEND_BILLING_RECEIPTS_ON_PAYDAY_REMAINDER_TASK}]`)

        return 'disabled'
    }

    if (!notifyOnPaydayIsCurrentDateValid(today)) {
        logger.info({ msg: 'Push should be sent only on weekdays.' })
        return
    }
    await notifyResidentsOnPayday()
}

/**
 * Syncs new and cancelled subscriptions
 */
const notifyResidentsOnPaydayTask = createCronTask('notifyResidentsOnPayday', '0 13 * * *', notifyResidentsOnPaydayTaskFn)

module.exports = notifyResidentsOnPaydayTask
