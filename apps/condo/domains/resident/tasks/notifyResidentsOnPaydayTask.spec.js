/**
 * @jest-environment node
 */

const index = require('@app/condo/index')

const { setFakeClientMode, setAllFeatureFlags } = require('@open-condo/keystone/test.utils')

const { notifyResidentsOnPaydayCronTask } = require('./notifyResidentsOnPaydayTask')


describe('Meter verification notification', () => {
    setFakeClientMode(index)
    describe('feature flag', () => {
        setAllFeatureFlags(true)
        it('checks for proper result on enabled', async () => {
            expect(await notifyResidentsOnPaydayCronTask.delay.fn()).toBeUndefined()
        })

        it('checks for proper result on disabled', async () => {
            setAllFeatureFlags(false)
            expect(await notifyResidentsOnPaydayCronTask.delay.fn()).toEqual('disabled')
        })
    })

})