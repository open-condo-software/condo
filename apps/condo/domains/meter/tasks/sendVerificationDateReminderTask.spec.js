/**
 * @jest-environment node
 */

const index = require('@app/condo/index')

const { setFakeClientMode, setAllFeatureFlags } = require('@open-condo/keystone/test.utils')

const sendVerificationDateReminderTask = require('@condo/domains/meter/tasks/sendVerificationDateReminderTask')


describe('Meter verification notification task', () => {
    afterAll( () => {
        if (global.gc) {
            global.gc()
        }
    })

    setFakeClientMode(index)

    describe('feature flag', () => {
        it('checks for proper result on enabled', async () => {
            setAllFeatureFlags(true)
            expect(await sendVerificationDateReminderTask.delay.fn()).toBeUndefined()
        })

        it('checks for proper result on disabled', async () => {
            setAllFeatureFlags(false)
            expect(await sendVerificationDateReminderTask.delay.fn()).toEqual('disabled')
        })
    })
})
