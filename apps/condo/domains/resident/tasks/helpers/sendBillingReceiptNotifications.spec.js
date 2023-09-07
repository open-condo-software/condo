/**
 * @jest-environment node
 */

const index = require('@app/condo/index')

const { setFakeClientMode, setAllFeatureFlags } = require('@open-condo/keystone/test.utils')

const { sendBillingReceiptNotifications } = require('./sendBillingReceiptNotifications')


describe('sendBillingReceiptNotifications', () => {
    setFakeClientMode(index)

    describe('feature flag', () => {
        it('checks for proper result on enabled', async () => {
            setAllFeatureFlags(true)
            expect(await sendBillingReceiptNotifications()).toBeUndefined()
        })

        it('checks for proper result on disabled', async () => {
            setAllFeatureFlags(false)
            expect(await sendBillingReceiptNotifications()).toEqual('disabled')
        })
    })
})
