const dayjs = require('dayjs')

const { featureToggleManager } = require('@open-condo/featureflags/featureToggleManager')
const { getLogger } = require('@open-condo/keystone/logging')
const { getRedisClient } = require('@open-condo/keystone/redis')

const { SEND_BILLING_RECEIPTS_NOTIFICATIONS_TASK } = require('@condo/domains/common/constants/featureflags')
const { LAST_SEND_BILLING_RECEIPT_NOTIFICATION_DATE } = require('@condo/domains/resident/constants/constants')

const { sendBillingReceiptsAddedNotifications } = require('./sendBillingReceiptsAddedNotifications')
const { sendResidentsNoAccountNotifications } = require('./sendResidentsNoAccountNotifications')


const logger = getLogger('sendBillingReceiptsAddedNotifications')

const sendBillingReceiptNotifications = async (context = null) => {
    const isFeatureEnabled = await featureToggleManager.isFeatureEnabled(context, SEND_BILLING_RECEIPTS_NOTIFICATIONS_TASK)
    // Skip sending notifications if feature is disabled on https://growthbook.doma.ai/features
    // This affects only cron task, notifications still could be sent using scripts in condo/
    
    if (!isFeatureEnabled) {
        logger.info(`sendBillingReceiptNotifications was skipped due to disabled growthbook feature flag [${SEND_BILLING_RECEIPTS_NOTIFICATIONS_TASK}]`)

        return 'disabled'
    }

    await sendResidentsNoAccountNotifications()

    const redisClient = await getRedisClient()
    const redisKey = await redisClient.get(LAST_SEND_BILLING_RECEIPT_NOTIFICATION_DATE)

    if (!redisKey) {
        await redisClient.set(LAST_SEND_BILLING_RECEIPT_NOTIFICATION_DATE, dayjs().startOf('day').toISOString())

        return 'noRedisKey'
    } else if (dayjs(redisKey).isSame(dayjs().startOf('day'))) {
        return
    }

    await sendBillingReceiptsAddedNotifications(redisKey)
    await redisClient.set(LAST_SEND_BILLING_RECEIPT_NOTIFICATION_DATE, dayjs().startOf('day').toISOString())
}

module.exports = {
    sendBillingReceiptNotifications,
}