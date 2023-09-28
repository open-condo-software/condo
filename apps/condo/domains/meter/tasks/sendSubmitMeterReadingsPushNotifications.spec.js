/**
 * @jest-environment node
 */

const index = require('@app/condo/index')

const { setFakeClientMode, setAllFeatureFlags } = require('@open-condo/keystone/test.utils')

const { sendSubmitMeterReadingsPushNotificationsTaskWorker } = require('./sendSubmitMeterReadingsPushNotifications')


describe('Meter verification notification', () => {
    setFakeClientMode(index)

    describe('feature flag', () => {
        it('checks for proper result on enabled', async () => {
            setAllFeatureFlags(true)
            expect(await sendSubmitMeterReadingsPushNotificationsTaskWorker()).toBeUndefined()
        })

        it('checks for proper result on disabled', async () => {
            setAllFeatureFlags(false)
            expect(await sendSubmitMeterReadingsPushNotificationsTaskWorker()).toEqual('disabled')
        })
    })

})
