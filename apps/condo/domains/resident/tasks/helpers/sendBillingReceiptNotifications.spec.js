/**
 * @jest-environment node
 */

const index = require('@app/condo/index')
const dayjs = require('dayjs')

const { getRedisClient } = require('@open-condo/keystone/redis')
const { setFakeClientMode, setAllFeatureFlags } = require('@open-condo/keystone/test.utils')

const { LAST_SEND_BILLING_RECEIPT_NOTIFICATION_DATE } = require('@condo/domains/resident/constants')

const { sendBillingReceiptNotifications, NO_REDIS_KEY, DISABLED, SKIP_NOTIFICATION, DONE } = require('./sendBillingReceiptNotifications')

describe('sendBillingReceiptNotifications', () => {
    setFakeClientMode(index)
    const redisClient = getRedisClient()

    describe('feature flag', () => {
        test('checks for proper result on disabled', async () => {
            setAllFeatureFlags(false)
            const { status } = await sendBillingReceiptNotifications()
            expect(status).toBe(DISABLED)
        })

        test('Should return correct status for each case', async () => {
            setAllFeatureFlags(true)
            await redisClient.del(LAST_SEND_BILLING_RECEIPT_NOTIFICATION_DATE)
            const { status: status1 } = await sendBillingReceiptNotifications()
            expect(status1).toBe(NO_REDIS_KEY)
            await redisClient.set(LAST_SEND_BILLING_RECEIPT_NOTIFICATION_DATE, dayjs().startOf('day').toISOString())
            const { status: status2 } = await sendBillingReceiptNotifications()
            expect(status2).toBe(SKIP_NOTIFICATION)
            await redisClient.set(LAST_SEND_BILLING_RECEIPT_NOTIFICATION_DATE, dayjs().subtract(1, 'd').startOf('day').toISOString())
            const { status: status3 } = await sendBillingReceiptNotifications()
            expect(status3).toBe(DONE)
        })
    })
})
