/**
 * @jest-environment node
 */

const index = require('@app/condo/index')

const { getRedisClient } = require('@open-condo/keystone/redis')
const { setFakeClientMode, setAllFeatureFlags } = require('@open-condo/keystone/test.utils')

const { LAST_SEND_BILLING_RECEIPT_NOTIFICATION_DATE } = require('@condo/domains/resident/constants')

const { sendBillingReceiptNotifications, NO_REDIS_KEY, DISABLED } = require('./sendBillingReceiptNotifications')

describe('sendBillingReceiptNotifications', () => {
    setFakeClientMode(index)
    const redisClient = getRedisClient()

    describe('feature flag', () => {
        test('checks for proper result on enabled', async () => {
            await redisClient.del(LAST_SEND_BILLING_RECEIPT_NOTIFICATION_DATE)
            setAllFeatureFlags(true)
            expect(await sendBillingReceiptNotifications()).toMatchObject({ status: NO_REDIS_KEY })
            await redisClient.del(LAST_SEND_BILLING_RECEIPT_NOTIFICATION_DATE)
        })

        test('checks for proper result on disabled', async () => {
            setAllFeatureFlags(false)
            expect(await sendBillingReceiptNotifications()).toMatchObject({ status: DISABLED })
        })

        test('Should return noRedisKey for first running', async () => {
            await redisClient.del(LAST_SEND_BILLING_RECEIPT_NOTIFICATION_DATE)
            setAllFeatureFlags(true)
            expect(await sendBillingReceiptNotifications()).toMatchObject({ status: NO_REDIS_KEY })
            await redisClient.del(LAST_SEND_BILLING_RECEIPT_NOTIFICATION_DATE)
        })
    })
})
