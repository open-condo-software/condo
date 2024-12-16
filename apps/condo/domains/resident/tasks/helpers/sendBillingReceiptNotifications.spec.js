/**
 * @jest-environment node
 */

const index = require('@app/condo/index')

const { getRedisClient } = require('@open-condo/keystone/redis')
const { setFakeClientMode, setAllFeatureFlags } = require('@open-condo/keystone/test.utils')

const { LAST_SEND_BILLING_RECEIPT_NOTIFICATION_DATE } = require('@condo/domains/resident/constants')

const { sendBillingReceiptNotifications } = require('./sendBillingReceiptNotifications')

describe('sendBillingReceiptNotifications', () => {
    setFakeClientMode(index)
    const redisClient = getRedisClient()

    describe('feature flag', () => {
        it('checks for proper result on enabled', async () => {
            await redisClient.del(LAST_SEND_BILLING_RECEIPT_NOTIFICATION_DATE)
            setAllFeatureFlags(true)
            expect(await sendBillingReceiptNotifications()).toEqual('noRedisKey')
            await redisClient.del(LAST_SEND_BILLING_RECEIPT_NOTIFICATION_DATE)
        })

        it('checks for proper result on disabled', async () => {
            setAllFeatureFlags(false)
            expect(await sendBillingReceiptNotifications()).toEqual('disabled')
        })

        test('Should return noRedisKey for first running', async () => {
            await redisClient.del(LAST_SEND_BILLING_RECEIPT_NOTIFICATION_DATE)
            setAllFeatureFlags(true)
            expect(await sendBillingReceiptNotifications()).toEqual('noRedisKey')
            await redisClient.del(LAST_SEND_BILLING_RECEIPT_NOTIFICATION_DATE)
        })
    })
})
