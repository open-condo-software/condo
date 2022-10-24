/**
 * @jest-environment node
 */

const { setFakeClientMode } = require('@condo/keystone/test.utils')

const { sendBillingReceiptNotifications } = require('./sendBillingReceiptNotifications')

const index = require('@app/condo/index')

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