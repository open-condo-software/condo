/**
 * @jest-environment node
 */

const index = require('@app/condo/index')

const { setFakeClientMode } = require('@open-condo/keystone/test.utils')

const { sendBillingReceiptNotifications } = require('./sendBillingReceiptNotifications')


describe('sendBillingReceiptNotifications', () => {
    setFakeClientMode(index)

    describe('feature flag', () => {
        it('checks for proper result on enabled', async () => {
            expect(await sendBillingReceiptNotifications({ req: { headers: { 'feature-flags': 'true' } } })).toBeUndefined()
        })

        it('checks for proper result on disabled', async () => {
            expect(await sendBillingReceiptNotifications({ req: { headers: { 'feature-flags': 'false' } } })).toEqual('disabled')
        })
    })
})