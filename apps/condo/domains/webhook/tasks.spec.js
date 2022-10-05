/**
 * @jest-environment node
 */

const { setFakeClientMode, makeLoggedInAdminClient } = require('@condo/keystone/test.utils')

const { sendWebHook } = require('./tasks')
const { createTestWebHook, createTestWebHookSubscription } = require('@condo/domains/webhook/utils/testSchema')



describe('sendWebHook', () => {
    setFakeClientMode(require.resolve('../../index'))
    jest.mock('node-fetch')

    it.skip('should not send messages on null nextVerificationDate', async () => {
        const fetch = require('node-fetch')

        const client = await makeLoggedInAdminClient()

        console.log(client.user.id)
        const [webhook] = await createTestWebHook(client)
        const [subscription] = await createTestWebHookSubscription(client, webhook, {
            model: 'Webhook',
            filters: { createdAt_gte: '2021-05-12T20:10:48Z' },
            fields: { id: true, name: true },
        })

        await sendWebHook.fn(subscription.id)
        expect(fetch).toHaveBeenCalledWith(1)
    })
})