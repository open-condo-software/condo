const { makeLoggedInAdminClient } = require('@core/keystone/test.utils')

const { sendMessageByTestClient } = require('../utils/testSchema')

describe('SendMessageService', () => {
    test('admin: use send message', async () => {
        const admin = await makeLoggedInAdminClient()

        const [data] = await sendMessageByTestClient(admin)
        expect(data).toEqual({ status: 'ok' })
    })
})
