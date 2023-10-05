/**
 * @jest-environment node
 */

const index = require('@app/condo/index')
const dayjs = require('dayjs')

const { getRedisClient } = require('@open-condo/keystone/redis')
const { setFakeClientMode, setAllFeatureFlags } = require('@open-condo/keystone/test.utils')

const { REDIS_LAST_DATE_KEY } = require('@condo/domains/resident/constants/constants')

const { sendBillingReceiptNotifications } = require('./sendBillingReceiptNotifications')

describe('sendBillingReceiptNotifications', () => {
    setFakeClientMode(index)

    describe('feature flag', () => {
        it('checks for proper result on enabled', async () => {
            setAllFeatureFlags(true)
            const redisClient = getRedisClient()
            await redisClient.set(REDIS_LAST_DATE_KEY, dayjs().toISOString())
            expect(await sendBillingReceiptNotifications()).toBeUndefined()
        })

        it('checks for proper result on disabled', async () => {
            setAllFeatureFlags(false)
            expect(await sendBillingReceiptNotifications()).toEqual('disabled')
        })
    })
})
