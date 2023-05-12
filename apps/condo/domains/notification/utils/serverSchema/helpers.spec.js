/**
 * @jest-environment node
 */

const index = require('@app/condo/index')

const { setFakeClientMode, makeLoggedInAdminClient, makeLoggedInClient } = require('@open-condo/keystone/test.utils')

const {
    REGISTER_NEW_USER_MESSAGE_TYPE,
    NEWS_ITEM_COMMON_MESSAGE_TYPE,
} = require('@condo/domains/notification/constants/constants')
const { createTestNotificationUserSetting, createTestMessage } = require('@condo/domains/notification/utils/testSchema')
const { createTestUser } = require('@condo/domains/user/utils/testSchema')

const { getUserSettingsForMessage } = require('./helpers')

const { keystone } = index

describe('Transport settings for message', () => {
    let adminClient

    setFakeClientMode(index)

    beforeAll(async () => {
        adminClient = await makeLoggedInAdminClient()
    })

    test('user disabled all messages of particular type', async () => {
        const [, userAttrs] = await createTestUser(adminClient)
        const userClient = await makeLoggedInClient(userAttrs)
        await createTestNotificationUserSetting(userClient, {
            messageType: NEWS_ITEM_COMMON_MESSAGE_TYPE,
            messageTransport: null,
            isEnabled: false,
        })
        const [message] = await createTestMessage(adminClient, {
            user: { connect: { id: userClient.user.id } },
            type: NEWS_ITEM_COMMON_MESSAGE_TYPE,
        })
        const settings = await getUserSettingsForMessage(keystone, message)

        for (const val of Object.values(settings)) {
            expect(val).toEqual(false)
        }
    })

    test('allow all transports if no user set for the Message model', async () => {
        const [message] = await createTestMessage(adminClient, { type: REGISTER_NEW_USER_MESSAGE_TYPE })
        const settings = await getUserSettingsForMessage(adminClient, message)

        for (const val of Object.values(settings)) {
            expect(val).toEqual(true)
        }
    })

    test('disable email, sms allowed', async () => {
        const [, userAttrs] = await createTestUser(adminClient)
        const userClient = await makeLoggedInClient(userAttrs)
        await createTestNotificationUserSetting(userClient, {
            messageType: REGISTER_NEW_USER_MESSAGE_TYPE,
            messageTransport: 'email',
            isEnabled: false,
        })
        const [message] = await createTestMessage(adminClient, {
            user: { connect: { id: userClient.user.id } },
            type: REGISTER_NEW_USER_MESSAGE_TYPE,
        })
        const settings = await getUserSettingsForMessage(keystone, message)

        expect(settings).toEqual(expect.objectContaining({ email: false, sms: true }))
    })
})
