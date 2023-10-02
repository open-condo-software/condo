/**
 * @jest-environment node
 */

const index = require('@app/condo/index')

const { setFakeClientMode, setAllFeatureFlags } = require('@open-condo/keystone/test.utils')

const sendSubmitMeterReadingsPushNotificationsTask = require('@condo/domains/meter/tasks/sendSubmitMeterReadingsPushNotificationsTask')


describe('Meter verification notification', () => {
    afterAll( () => {
        if (global.gc) {
            global.gc()
        }
    })

    setFakeClientMode(index)

    describe('feature flag', () => {
        it('checks for proper result on enabled', async () => {
            setAllFeatureFlags(true)
            expect(await sendSubmitMeterReadingsPushNotificationsTask.delay.fn()).toBeUndefined()
        })

        it('checks for proper result on disabled', async () => {
            setAllFeatureFlags(false)
            expect(await sendSubmitMeterReadingsPushNotificationsTask.delay.fn()).toEqual('disabled')
        })
    })

})
