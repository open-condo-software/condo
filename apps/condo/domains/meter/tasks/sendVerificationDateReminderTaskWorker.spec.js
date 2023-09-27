/**
 * @jest-environment node
 */

const index = require('@app/condo/index')

const { setFakeClientMode, setAllFeatureFlags } = require('@open-condo/keystone/test.utils')

const { sendVerificationDateReminderTaskWorker } = require('./sendVerificationDateReminderTaskWorker')


describe('Meter verification notification task', () => {
    setFakeClientMode(index)

    describe('feature flag', () => {
        it('checks for proper result on enabled', async () => {
            setAllFeatureFlags(true)
            expect(await sendVerificationDateReminderTaskWorker()).toBeUndefined()
        })

        it('checks for proper result on disabled', async () => {
            setAllFeatureFlags(false)
            expect(await sendVerificationDateReminderTaskWorker()).toEqual('disabled')
        })
    })
})
