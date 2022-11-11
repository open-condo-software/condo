/**
 * @jest-environment node
 */

const { setFakeClientMode } = require('@open-condo/keystone/test.utils')

const sendSubmitMeterReadingsPushNotificationsTask = require('@condo/domains/meter/tasks/sendSubmitMeterReadingsPushNotificationsTask')

const index = require('@app/condo/index')

describe('Meter verification notification', () => {
    setFakeClientMode(index)

    describe('feature flag', () => {
        it('checks for proper result on enabled', async () => {
            expect(await sendSubmitMeterReadingsPushNotificationsTask.delay.fn({ req: { headers: { 'feature-flags': 'true' } } })).toBeUndefined()
        })

        it('checks for proper result on disabled', async () => {
            expect(await sendSubmitMeterReadingsPushNotificationsTask.delay.fn({ req: { headers: { 'feature-flags': 'false' } } })).toEqual('disabled')
        })
    })

})