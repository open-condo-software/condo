const faker = require('faker')
const { UUID_RE } = require('@core/keystone/test.utils')
const { JSON_UNKNOWN_ATTR_NAME_ERROR } = require('@condo/domains/notification/constants')

const { makeLoggedInAdminClient } = require('@core/keystone/test.utils')

const { sendMessageByTestClient, resendMessageByTestClient } = require('../utils/testSchema')
const { MESSAGE_SENDING_STATUS, MESSAGE_RESENDING_STATUS } = require('../constants')

describe('SendMessageService.sendMessage', () => {
    test('admin: use send message', async () => {
        const admin = await makeLoggedInAdminClient()

        const [data] = await sendMessageByTestClient(admin)
        expect(data.id).toMatch(UUID_RE)
        expect(data.status).toEqual(MESSAGE_SENDING_STATUS)
    })

    test('admin: use send message without requiredAttr', async () => {
        const admin = await makeLoggedInAdminClient()

        try {
            await sendMessageByTestClient(admin, { meta: { dv: 1 } })
        } catch (e) {
            expect(e.errors[0]).toMatchObject({
                'message': '[json:noRequiredAttr:meta] no inviteCode value',
                'name': 'GraphQLError',
                'path': ['result'],
            })
            expect(e.data).toEqual({ 'result': null })
        }
    })

    test('admin: use send message with extraAttr', async () => {
        const admin = await makeLoggedInAdminClient()

        try {
            await sendMessageByTestClient(admin, {
                meta: {
                    dv: 1,
                    inviteCode: faker.random.alphaNumeric(8),
                    unregisteredAttrName: faker.random.alphaNumeric(8),
                },
            })
        } catch (e) {
            expect(e.errors[0]).toMatchObject({
                'message': `${JSON_UNKNOWN_ATTR_NAME_ERROR}meta] unregisteredAttrName is redundant or unknown`,
                'name': 'GraphQLError',
                'path': ['result'],
            })
            expect(e.data).toEqual({ 'result': null })
        }
    })
})

describe('SendMessageService.resendMessage', () => {
    test('admin: use resend message', async () => {
        const admin = await makeLoggedInAdminClient()
        const [message] = await sendMessageByTestClient(admin)

        const [data] = await resendMessageByTestClient(admin, message)
        expect(data.id).toMatch(UUID_RE)
        expect(data.status).toEqual(MESSAGE_RESENDING_STATUS)
    })
})
