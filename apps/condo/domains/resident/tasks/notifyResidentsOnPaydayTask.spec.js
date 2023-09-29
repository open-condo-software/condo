/**
 * @jest-environment node
 */

const index = require('@app/condo/index')

const { setFakeClientMode, setAllFeatureFlags } = require('@open-condo/keystone/test.utils')

const notifyResidentsOnPaydayTask = require('./notifyResidentsOnPaydayTask')


describe('Meter verification notification', () => {
    afterAll( () => {
        if (global.gc) {
            global.gc()
        }
    })
    setFakeClientMode(index)
    describe('feature flag', () => {
        setAllFeatureFlags(true)
        it('checks for proper result on enabled', async () => {
            expect(await notifyResidentsOnPaydayTask.delay.fn()).toBeUndefined()
        })

        it('checks for proper result on disabled', async () => {
            setAllFeatureFlags(false)
            expect(await notifyResidentsOnPaydayTask.delay.fn()).toEqual('disabled')
        })
    })

})