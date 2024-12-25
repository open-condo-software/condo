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

    beforeEach(async () => {
        await redisClient.del(LAST_SEND_BILLING_RECEIPT_NOTIFICATION_DATE)
    })

    afterEach(async () => {
        await redisClient.del(LAST_SEND_BILLING_RECEIPT_NOTIFICATION_DATE)
    })

    describe('feature flag', () => {
        test('checks for proper result on disabled', async () => {
            setAllFeatureFlags(false)
            const { status } = await sendBillingReceiptNotifications()
            expect(status).toBe(DISABLED)
        })

        test('Should return noRedisKey for first running', async () => {
            setAllFeatureFlags(true)
            const { status } = await sendBillingReceiptNotifications(':NO_REDIS_KEY')
            expect(status).toBe(NO_REDIS_KEY)
            const delValue = await redisClient.del(LAST_SEND_BILLING_RECEIPT_NOTIFICATION_DATE + ':NO_REDIS_KEY')
            expect(delValue).toBe(1)
        })

        test('Should return skip notification if cron runs more than one time a day', async () => {
            setAllFeatureFlags(true)
            const value = await redisClient.set(LAST_SEND_BILLING_RECEIPT_NOTIFICATION_DATE + ':SKIP_NOTIFICATION', dayjs().startOf('day').toISOString())
            expect(value).toBe('OK')
            const { status } = await sendBillingReceiptNotifications(':SKIP_NOTIFICATION')
            expect(status).toBe(SKIP_NOTIFICATION)
            const delValue = await redisClient.del(LAST_SEND_BILLING_RECEIPT_NOTIFICATION_DATE + ':SKIP_NOTIFICATION')
            expect(delValue).toBe(1)
        })

        test('Should return done if pushes are sent', async () => {
            setAllFeatureFlags(true)
            const value = await redisClient.set(LAST_SEND_BILLING_RECEIPT_NOTIFICATION_DATE + ':DONE', dayjs().subtract(1, 'day').startOf('day').toISOString())
            expect(value).toBe('OK')
            const { status } = await sendBillingReceiptNotifications(':DONE')
            expect(status).toBe(DONE)
            const delValue = await redisClient.del(LAST_SEND_BILLING_RECEIPT_NOTIFICATION_DATE + ':DONE')
            expect(delValue).toBe(1)
        })
    })
})
