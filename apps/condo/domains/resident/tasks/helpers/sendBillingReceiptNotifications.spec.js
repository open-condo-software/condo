/**
 * @jest-environment node
 */

const index = require('@app/condo/index')
const dayjs = require('dayjs')

const { getRedisClient } = require('@open-condo/keystone/redis')
const { setFakeClientMode, setAllFeatureFlags, waitFor } = require('@open-condo/keystone/test.utils')

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
            expect(await sendBillingReceiptNotifications()).toMatchObject({ status: DISABLED })
        })

        test('Should return noRedisKey for first running', async () => {
            setAllFeatureFlags(true)
            await waitFor(async () => {
                expect(await sendBillingReceiptNotifications()).toMatchObject({ status: NO_REDIS_KEY })
            }, { delay: 2000, interval: 2000 })
        })

        test('Should return skip notification if cron runs more than one time a day', async () => {
            setAllFeatureFlags(true)

            await waitFor(async () => {
                expect(await sendBillingReceiptNotifications()).toMatchObject({ status: NO_REDIS_KEY })
            }, { delay: 2000, interval: 2000 })

            await waitFor(async () => {
                expect(await sendBillingReceiptNotifications()).toMatchObject({ status: SKIP_NOTIFICATION })
            }, { delay: 2000, interval: 2000  })
        })

        test('Should return done if pushes are sent', async () => {
            setAllFeatureFlags(true)

            await redisClient.set(LAST_SEND_BILLING_RECEIPT_NOTIFICATION_DATE, dayjs().subtract(1, 'day').startOf('day').toISOString())

            await waitFor(async () => {
                expect(await sendBillingReceiptNotifications()).toMatchObject({ status: DONE })
            }, { delay: 2000, interval: 2000  })
        })
    })
})
