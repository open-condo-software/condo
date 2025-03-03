/**
 * @jest-environment node
 */

const index = require('@app/condo/index')
const dayjs = require('dayjs')

const { getKVClient } = require('@open-condo/keystone/kv')
const { setFakeClientMode, setAllFeatureFlags } = require('@open-condo/keystone/test.utils')

const { LAST_SEND_BILLING_RECEIPT_NOTIFICATION_DATE } = require('@condo/domains/resident/constants')

const { sendBillingReceiptNotifications, NO_REDIS_KEY, DISABLED, SKIP_NOTIFICATION, DONE } = require('./sendBillingReceiptNotifications')

describe('sendBillingReceiptNotifications', () => {
    setFakeClientMode(index)
    const redisClient = getKVClient()

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
            const value2 = await redisClient.set(LAST_SEND_BILLING_RECEIPT_NOTIFICATION_DATE, dayjs().startOf('day').toISOString())
            expect(value2).toBe('OK')
            const { status: status2 } = await sendBillingReceiptNotifications()
            expect(status2).toBe(SKIP_NOTIFICATION)
            const value3 = await redisClient.set(LAST_SEND_BILLING_RECEIPT_NOTIFICATION_DATE, dayjs().subtract(1, 'd').startOf('day').toISOString())
            expect(value3).toBe('OK')
            const { status: status3 } = await sendBillingReceiptNotifications()
            expect(status3).toBe(DONE)
            await redisClient.del(LAST_SEND_BILLING_RECEIPT_NOTIFICATION_DATE)
        })
    })
})
