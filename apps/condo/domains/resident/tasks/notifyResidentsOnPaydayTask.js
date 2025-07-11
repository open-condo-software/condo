const dayjs = require('dayjs')

const { featureToggleManager } = require('@open-condo/featureflags/featureToggleManager')
const { getLogger } = require('@open-condo/keystone/logging')
const { createCronTask } = require('@open-condo/keystone/tasks')

const { SEND_BILLING_RECEIPTS_ON_PAYDAY_REMAINDER_TASK } = require('@condo/domains/common/constants/featureflags')

const { notifyResidentsOnPayday } = require('./notifyResidentsOnPayday')


const logger = getLogger()

const notifyResidentsOnPaydayCronTask = createCronTask('notifyResidentsOnPaydayTask', '0 9 * * *', async (context = null) => {
    const isFeatureEnabled = await featureToggleManager.isFeatureEnabled(context, SEND_BILLING_RECEIPTS_ON_PAYDAY_REMAINDER_TASK)

    if (!isFeatureEnabled) {
        logger.info(`Skip notifyResidentsOnPayday task due to disabled GrowthBook feature flag [${SEND_BILLING_RECEIPTS_ON_PAYDAY_REMAINDER_TASK}]`)

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
        return await notifyResidentsOnPayday()
    } else {
        logger.info({ msg: 'push should be sent only on weekdays.' })
    }
})
module.exports = {
    notifyResidentsOnPaydayCronTask,
}