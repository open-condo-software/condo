/**
 * @jest-environment node
 */

const { setFakeClientMode } = require('@open-condo/keystone/test.utils')

const sendVerificationDateReminderTask = require('@condo/domains/meter/tasks/sendVerificationDateReminderTask')

const index = require('@app/condo/index')

describe('Meter verification notification task', () => {
    setFakeClientMode(index)

    describe('feature flag', () => {
        it('checks for proper result on enabled', async () => {
            expect(await sendVerificationDateReminderTask.delay.fn({ req: { headers: { 'feature-flags': 'true' } } })).toBeUndefined()
        })

        it('checks for proper result on disabled', async () => {
            expect(await sendVerificationDateReminderTask.delay.fn({ req: { headers: { 'feature-flags': 'false' } } })).toEqual('disabled')
        })
    })
})