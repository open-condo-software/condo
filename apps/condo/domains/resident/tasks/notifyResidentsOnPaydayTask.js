/**
 * @jest-environment node
 */

const index = require('@app/condo/index')

const { setFakeClientMode, setAllFeatureFlags } = require('@open-condo/keystone/test.utils')

const notifyResidentsOnPaydayTask = require('./notifyResidentsOnPayday')


describe('Meter verification notification', () => {
    setFakeClientMode(index)
    describe('feature flag', () => {
        setAllFeatureFlags(true)
        it('checks for proper result on enabled', async () => {
            expect(await notifyResidentsOnPaydayTask).toBeUndefined()
        })

        it('checks for proper result on disabled', async () => {
            setAllFeatureFlags(false)
            expect(await notifyResidentsOnPaydayTask).toEqual('disabled')
        })
    })
})