/**
 * @jest-environment node
 */

const index = require('@app/condo/index')

const { setFakeClientMode, setAllFeatureFlags } = require('@open-condo/keystone/test.utils')

const { sendVerificationDateReminder } = require('./sendVerificationDateReminder')


describe('Meter verification notification task', () => {
    setFakeClientMode(index)

    describe('feature flag', () => {
        it('checks for proper result on enabled', async () => {
            setAllFeatureFlags(true)
            expect(await sendVerificationDateReminder()).toBeUndefined()
        })

        it('checks for proper result on disabled', async () => {
            setAllFeatureFlags(false)
            expect(await sendVerificationDateReminder()).toEqual('disabled')
        })
    })
})
