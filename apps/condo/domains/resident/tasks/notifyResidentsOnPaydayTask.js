const dayjs = require('dayjs')

const { featureToggleManager } = require('@open-condo/featureflags/featureToggleManager')
const { getLogger } = require('@open-condo/keystone/logging')
const { createCronTask } = require('@open-condo/keystone/tasks')

const { SEND_BILLING_RECEIPTS_ON_PAYDAY_REMINDER_TASK } = require('@condo/domains/common/constants/featureflags')

const { notifyResidentsOnPayday } = require('./notifyResidentsOnPayday')


const logger = getLogger('meter/sendSubmitMeterReadingsPushNotifications')

const notifyResidentsOnPaydayTaskFn = async (context = null) => {
    const isFeatureEnabled = await featureToggleManager.isFeatureEnabled(context, SEND_BILLING_RECEIPTS_ON_PAYDAY_REMINDER_TASK)
    const today = dayjs()
    const targetDayOfSendingThePush = dayjs().set('date', 20).day()
    const isTargetDayWeekday = !(targetDayOfSendingThePush === 0 || targetDayOfSendingThePush === 6)

    if (!isFeatureEnabled) {
        logger.info(`notifyResidentsOnPayday task was skipped due to disabled growthbook feature flag [${SEND_BILLING_RECEIPTS_ON_PAYDAY_REMINDER_TASK}]`)

        return 'disabled'
    }

    /*
        The 20th of the month from the passed date must be a weekday.
        Below is a check for compliance with the ordinal number of the day of the week 6 (Saturday) and 0 (Sunday).
        Also, the date must be no later than the 16th of the month and the day of the week must be Friday.
        These checks are required if the 20th of the month is not a weekday. If the 20th is a weekday, then just return true.
        https://day.js.org/docs/en/get-set/day
     */
    if (isTargetDayWeekday) {
        return today.format('DD') === '20' && await notifyResidentsOnPayday()
    } else if (Number(today.format('DD')) >= 18 && Number(today.format('DD')) < 20 && today.day() === 5) {
        return await notifyResidentsOnPayday()
    } else {
        logger.info({ msg: 'Push should be sent only on weekdays.' })
    }
}

/**
 * Syncs new and cancelled subscriptions
 */
const notifyResidentsOnPaydayTask = createCronTask('notifyResidentsOnPayday', '0 13 * * *', notifyResidentsOnPaydayTaskFn)

module.exports = notifyResidentsOnPaydayTask
