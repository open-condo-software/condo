/**
 * @jest-environment node
 */

const index = require('@app/condo/index')

const { setFakeClientMode, makeLoggedInAdminClient, makeLoggedInClient } = require('@open-condo/keystone/test.utils')

const {
    NEWS_ITEM_COMMON_MESSAGE_TYPE,
    DIRTY_INVITE_NEW_EMPLOYEE_SMS_MESSAGE_TYPE,
} = require('@condo/domains/notification/constants/constants')
const {
    NotificationUserSetting,
    createTestNotificationAnonymousSetting,
    createTestNotificationUserSetting,
    updateTestNotificationUserSetting,
    createTestMessage,
} = require('@condo/domains/notification/utils/testSchema')
const { createTestUser, createTestEmail } = require('@condo/domains/user/utils/testSchema')

const { getUserSettingsForMessage, getAnonymousSettings, chunkRemoteClientsByAppGroups } = require('./helpers')

const { keystone } = index

describe('Transport settings for message', () => {
    let adminClient

    setFakeClientMode(index)

    beforeAll(async () => {
        adminClient = await makeLoggedInAdminClient()
    })

    beforeEach(async () => {
        const globalSettings = await NotificationUserSetting.getAll(adminClient, {
            user_is_null: true,
            deletedAt: null,
        })
        for (const setting of globalSettings) {
            await updateTestNotificationUserSetting(adminClient, setting.id, {
                deletedAt: new Date(),
            })
        }
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
        const [message] = await createTestMessage(adminClient, { type: DIRTY_INVITE_NEW_EMPLOYEE_SMS_MESSAGE_TYPE })
        const settings = await getUserSettingsForMessage(keystone, message)

        for (const val of Object.values(settings)) {
            expect(val).toEqual(true)
        }
    })

    test('disable email, sms allowed', async () => {
        const [, userAttrs] = await createTestUser(adminClient)
        const userClient = await makeLoggedInClient(userAttrs)
        await createTestNotificationUserSetting(userClient, {
            messageType: DIRTY_INVITE_NEW_EMPLOYEE_SMS_MESSAGE_TYPE,
            messageTransport: 'email',
            isEnabled: false,
        })
        const [message] = await createTestMessage(adminClient, {
            user: { connect: { id: userClient.user.id } },
            type: DIRTY_INVITE_NEW_EMPLOYEE_SMS_MESSAGE_TYPE,
        })
        const settings = await getUserSettingsForMessage(keystone, message)

        expect(settings).toEqual(expect.objectContaining({ email: false, sms: true }))
    })

    describe('Anonymous settings for message', () => {
        test('get anonymous by email', async () => {
            const [setting] = await createTestNotificationAnonymousSetting(adminClient)
            const settings = await getAnonymousSettings(keystone, setting.email, null, setting.messageType)
            expect(settings).toHaveLength(1)
            expect(settings[0]).toMatchObject({
                email: setting.email,
                phone: setting.phone,
            })
        })

        test('get anonymous by phone', async () => {
            const [setting] = await createTestNotificationAnonymousSetting(adminClient)
            const settings = await getAnonymousSettings(keystone, null, setting.phone, setting.messageType)
            expect(settings).toHaveLength(1)
            expect(settings[0]).toMatchObject({
                email: setting.email,
                phone: setting.phone,
            })
        })

        test('get anonymous by phone and email', async () => {
            const [setting] = await createTestNotificationAnonymousSetting(adminClient)
            const settings = await getAnonymousSettings(keystone, setting.email, setting.phone, setting.messageType)
            expect(settings).toHaveLength(1)
            expect(settings[0]).toMatchObject({
                email: setting.email,
                phone: setting.phone,
            })
        })

        describe('without specific message type', () => {
            test('get anonymous by email', async () => {
                const [setting] = await createTestNotificationAnonymousSetting(adminClient, {
                    messageType: null,
                })
                const settings = await getAnonymousSettings(keystone, setting.email, null, null)
                expect(settings).toHaveLength(1)
                expect(settings[0]).toMatchObject({
                    email: setting.email,
                    phone: setting.phone,
                })
            })

            test('get anonymous by phone', async () => {
                const [setting] = await createTestNotificationAnonymousSetting(adminClient, {
                    messageType: null,
                })
                const settings = await getAnonymousSettings(keystone, null, setting.phone, null)
                expect(settings).toHaveLength(1)
                expect(settings[0]).toMatchObject({
                    email: setting.email,
                    phone: setting.phone,
                })
            })

            test('get anonymous by phone and email', async () => {
                const [setting] = await createTestNotificationAnonymousSetting(adminClient, {
                    messageType: null,
                })
                const settings = await getAnonymousSettings(keystone, setting.email, setting.phone, null)
                expect(settings).toHaveLength(1)
                expect(settings[0]).toMatchObject({
                    email: setting.email,
                    phone: setting.phone,
                })
            })
        })
        describe('real life cases', () => {
            test('returns true for not disabled email', async () => {
                const [setting] = await createTestNotificationAnonymousSetting(adminClient, {
                    phone: null,
                })
                const email = createTestEmail()

                // act & assert setting1
                const settings = await getAnonymousSettings(keystone, email, null, setting.messageType)
                expect(settings).toHaveLength(0)
            })
        })
    })
})


describe('chunkRemoteClientsByAppGroups', () => {

    test('groups remote clients by app groups correctly', () => {
        const remoteClients = [
            { appId: 'app1', token: 'token1' },
            { appId: 'app2', token: 'token2' },
            { appId: 'app3', token: 'token3' },
            { appId: 'app4', token: 'token4' },
        ]
        const appsGroups = {
            'group1': ['app1', 'app2'],
            'group2': ['app3'],
        }

        const result = chunkRemoteClientsByAppGroups(remoteClients, appsGroups)

        expect(result).toHaveProperty('group1')
        expect(result).toHaveProperty('group2')
        expect(result).toHaveProperty('ungrouped_app4')
        
        expect(result.group1).toHaveLength(2)
        expect(result.group1[0]).toEqual([{ appId: 'app1', token: 'token1' }])
        expect(result.group1[1]).toEqual([{ appId: 'app2', token: 'token2' }])
        
        expect(result.group2).toHaveLength(1)
        expect(result.group2[0]).toEqual([{ appId: 'app3', token: 'token3' }])
        
        expect(result['ungrouped_app4']).toEqual([{ appId: 'app4', token: 'token4' }])
    })

    test('handles empty remote clients array', () => {
        const remoteClients = []
        const appsGroups = {
            'group1': ['app1', 'app2'],
        }

        const result = chunkRemoteClientsByAppGroups(remoteClients, appsGroups)

        expect(result).toEqual({})
    })

    test('handles empty apps groups', () => {
        const remoteClients = [
            { appId: 'app1', token: 'token1' },
        ]
        const appsGroups = {}

        const result = chunkRemoteClientsByAppGroups(remoteClients, appsGroups)

        expect(result).toEqual({
            'ungrouped_app1': [{ appId: 'app1', token: 'token1' }],
        })
    })

    test('handles remote clients with no matching app groups', () => {
        const remoteClients = [
            { appId: 'unknown_app1', token: 'token1' },
            { appId: 'unknown_app2', token: 'token2' },
        ]
        const appsGroups = {
            'group1': ['app1', 'app2'],
        }

        const result = chunkRemoteClientsByAppGroups(remoteClients, appsGroups)

        expect(result).toEqual({
            'ungrouped_unknown_app1': [{ appId: 'unknown_app1', token: 'token1' }],
            'ungrouped_unknown_app2': [{ appId: 'unknown_app2', token: 'token2' }],
        })
    })

    test('handles multiple remote clients with same app ID', () => {
        const remoteClients = [
            { appId: 'app1', token: 'token1' },
            { appId: 'app1', token: 'token2' },
            { appId: 'app2', token: 'token3' },
        ]
        const appsGroups = {
            'group1': ['app1', 'app2'],
        }

        const result = chunkRemoteClientsByAppGroups(remoteClients, appsGroups)

        expect(result.group1).toHaveLength(2)
        expect(result.group1[0]).toEqual([
            { appId: 'app1', token: 'token1' },
            { appId: 'app1', token: 'token2' },
        ])
        expect(result.group1[1]).toEqual([
            { appId: 'app2', token: 'token3' },
        ])
    })

    test('handles appsGroups with empty app ID arrays', () => {
        const remoteClients = [
            { appId: 'app1', token: 'token1' },
        ]
        const appsGroups = {
            'empty_group': [],
            'group1': ['app1'],
        }

        const result = chunkRemoteClientsByAppGroups(remoteClients, appsGroups)

        expect(result).toHaveProperty('group1')
        expect(result.group1).toHaveLength(1)
        expect(result.group1[0]).toEqual([{ appId: 'app1', token: 'token1' }])
    })

    test('maintains order of app IDs in groups', () => {
        const remoteClients = [
            { appId: 'app3', token: 'token3' },
            { appId: 'app1', token: 'token1' },
            { appId: 'app2', token: 'token2' },
        ]
        const appsGroups = {
            'ordered_group': ['app1', 'app2', 'app3'],
        }

        const result = chunkRemoteClientsByAppGroups(remoteClients, appsGroups)

        expect(result.ordered_group).toHaveLength(3)
        expect(result.ordered_group[0]).toEqual([{ appId: 'app1', token: 'token1' }])
        expect(result.ordered_group[1]).toEqual([{ appId: 'app2', token: 'token2' }])
        expect(result.ordered_group[2]).toEqual([{ appId: 'app3', token: 'token3' }])
    })

    test('keeps each remote client only in one group in case of crossing groups', () => {
        const remoteClients = [
            { appId: 'app3', token: 'token3' },
            { appId: 'app1', token: 'token1' },
            { appId: 'app2', token: 'token2' },
        ]
        const appsGroups = {
            'group_1': ['app1', 'app2', 'app3'],
            'group_2': ['app1'],
            'group_3': ['app2'],
        }

        const result = chunkRemoteClientsByAppGroups(remoteClients, appsGroups)

        expect(result).toHaveProperty('group_1')
        expect(result).toHaveProperty('group_2')
        expect(result).toHaveProperty('group_3')

        expect(result.group_1).toHaveLength(1)
        expect(result.group_2).toHaveLength(1)
        expect(result.group_3).toHaveLength(1)

        expect(result.group_1[0]).toEqual([{ appId: 'app3', token: 'token3' }])
        expect(result.group_2[0]).toEqual([{ appId: 'app1', token: 'token1' }])
        expect(result.group_3[0]).toEqual([{ appId: 'app2', token: 'token2' }])
    })
})
