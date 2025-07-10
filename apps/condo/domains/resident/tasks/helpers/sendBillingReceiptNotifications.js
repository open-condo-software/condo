const dayjs = require('dayjs')

const { featureToggleManager } = require('@open-condo/featureflags/featureToggleManager')
const { getKVClient } = require('@open-condo/keystone/kv')
const { getLogger } = require('@open-condo/keystone/logging')

const { SEND_BILLING_RECEIPTS_NOTIFICATIONS_TASK } = require('@condo/domains/common/constants/featureflags')
const { LAST_SEND_BILLING_RECEIPT_NOTIFICATION_DATE } = require('@condo/domains/resident/constants/constants')

const { sendBillingReceiptsAddedNotifications } = require('./sendBillingReceiptsAddedNotifications')
const { sendResidentsNoAccountNotifications } = require('./sendResidentsNoAccountNotifications')
const DISABLED = 'DISABLED'
const NO_REDIS_KEY = 'NO_REDIS_KEY'
const SKIP_NOTIFICATION = 'SKIP_NOTIFICATION'
const DONE = 'DONE'

const logger = getLogger()

const sendBillingReceiptNotifications = async () => {
    const isFeatureEnabled = await featureToggleManager.isFeatureEnabled(null, SEND_BILLING_RECEIPTS_NOTIFICATIONS_TASK)
    // Skip sending notifications if feature is disabled on https://growthbook.doma.ai/features
    // This affects only cron task, notifications still could be sent using scripts in condo/

    if (!isFeatureEnabled) {
        logger.info(`sendBillingReceiptNotifications was skipped due to disabled growthbook feature flag [${SEND_BILLING_RECEIPTS_NOTIFICATIONS_TASK}]`)

        return { status: DISABLED }
    }

    try {
        //TODO: DOMA-10913 This func needs to be refactored and optimized or removed, currently it falls by time out for orgs with a lot of properties
        await sendResidentsNoAccountNotifications()
    } catch (err) {
        logger.error({ msg: 'sendResidentsNoAccountNotifications failed', err })
    }

    const redisClient = getKVClient()
    const redisKey = await redisClient.get(LAST_SEND_BILLING_RECEIPT_NOTIFICATION_DATE)

    if (!redisKey) {
        await redisClient.set(LAST_SEND_BILLING_RECEIPT_NOTIFICATION_DATE, dayjs().startOf('day').toISOString())

        return { status: NO_REDIS_KEY }
    } else if (dayjs().startOf('day').isSame(dayjs(redisKey))) {
        return { status: SKIP_NOTIFICATION }
    }

    await sendBillingReceiptsAddedNotifications(redisKey)
    await redisClient.set(LAST_SEND_BILLING_RECEIPT_NOTIFICATION_DATE, dayjs().startOf('day').toISOString())

    return { status: DONE }
}

module.exports = {
    sendBillingReceiptNotifications,
    DISABLED,
    NO_REDIS_KEY,
    DONE,
    SKIP_NOTIFICATION,
}
