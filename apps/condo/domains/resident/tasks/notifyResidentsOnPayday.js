const dayjs = require('dayjs')

const { featureToggleManager } = require('@open-condo/featureflags/featureToggleManager')
const { getLogger } = require('@open-condo/keystone/logging')

const { SEND_BILLING_RECEIPTS_ON_PAYDAY_REMINDER_TASK } = require('@condo/domains/common/constants/featureflags')
const { sendPaymentNotificationsToResidents } = require('@condo/domains/resident/utils/serverSchema/sendPaymentNotificationsToResidents')


const logger = getLogger('notifyResidentsOnPayday')

async function notifyResidentsOnPayday (context = null) {
    const isFeatureEnabled = await featureToggleManager.isFeatureEnabled(context, SEND_BILLING_RECEIPTS_ON_PAYDAY_REMINDER_TASK)

    if (!isFeatureEnabled) {
        logger.info(`Skip notifyResidentsOnPayday task due to disabled GrowthBook feature flag [${SEND_BILLING_RECEIPTS_ON_PAYDAY_REMINDER_TASK}]`)

        return 'disabled'
    }

    const today = dayjs()
    const targetDayOfSendingThePush = dayjs().set('date', 20).day()
    const isTargetDayWeekend = targetDayOfSendingThePush === 0 || targetDayOfSendingThePush === 6
    const isTargetDayWeekendAndTodayIsFriday = isTargetDayWeekend && Number(today.format('DD')) >= 18 && Number(today.format('DD')) < 20 && today.day() === 5
    const isTargetDayWeekday = !isTargetDayWeekend && today.format('DD') === '20'

    /**
     * Pay date is:
     * either a 20-th day workday of month
     * or Friday coming before weekend 20-th day
     */
    if (isTargetDayWeekendAndTodayIsFriday || isTargetDayWeekday) {
        return await sendPaymentNotificationsToResidents()
    } else {
        logger.info({ msg: 'Push should be sent only on weekdays.' })
    }
}

module.exports = {
    notifyResidentsOnPayday,
}