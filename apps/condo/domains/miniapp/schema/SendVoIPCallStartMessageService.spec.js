const { faker } = require('@faker-js/faker')
const { z } = require('zod')

const APP_ID_ONLY_NATIVE_VOIP = `only_native_${faker.random.alphaNumeric(8)}`
const APP_ID_ONLY_INCOMING_CALL_ALLOWED = `only_VOIP_INCOMING_CALL_MESSAGE_TYPE_${faker.random.alphaNumeric(8)}`

require('@condo/domains/common/utils/testSchema/env').mockEnv({
    TESTS_FAKE_WORKER_MODE: true,
    PUSH_ADAPTER_SETTINGS: () => {
        const { VOIP_INCOMING_CALL_MESSAGE_TYPE } = jest.requireActual('@condo/domains/notification/constants/constants')
        return {
            pushDataValidatorsByAppId: {
                [APP_ID_ONLY_NATIVE_VOIP]: {
                    [VOIP_INCOMING_CALL_MESSAGE_TYPE]: z.object({
                        data: z.object({
                            voipAddress: z.string(),
                            voipLogin: z.string(),
                            voipPassword: z.string(),
                            voipPanels: z.string(),
                            voipType: z.literal('sip'),
                            voipIceServers: z.string(),
                        }).loose(),
                    }).loose().toJSONSchema(),
                },
                [APP_ID_ONLY_INCOMING_CALL_ALLOWED]: {
                    _global: z.object({
                        message: z.object({
                            type: z.union([VOIP_INCOMING_CALL_MESSAGE_TYPE].map(v => z.literal(v))),
                        }).loose(),
                    }).loose().toJSONSchema(),
                },
            },
        }
    },
})

const {
    makeLoggedInAdminClient,
    waitFor,
    setFakeClientMode,
} = require('@open-condo/keystone/test.utils')

const { SEND_VOIP_CALL_CANCEL_MESSAGE_CANCEL_REASON_ANSWERED } = require('@condo/domains/miniapp/constants')
const {
    createTestB2CApp,
    sendVoIPCallStartMessageByTestClient,
    createTestB2CAppProperty,
    createTestB2CAppAccessRight,
    createTestB2CAppAccessRightSet,
    createTestAppMessageSetting,
    prepareVoIPUser,
} = require('@condo/domains/miniapp/utils/testSchema')
const { sendVoIPCallCancelMessageByTestClient } = require('@condo/domains/miniapp/utils/testSchema')
const { VOIP_INCOMING_CALL_MESSAGE_TYPE, MESSAGE_SENT_STATUS, DEVICE_PLATFORM_TYPES, PUSH_TRANSPORT_APPLE, PUSH_TRANSPORT_FIREBASE } = require('@condo/domains/notification/constants/constants')
const { CANCELED_CALL_MESSAGE_PUSH_TYPE } = require('@condo/domains/notification/constants/constants')
const { Message, syncRemoteClientByTestClient } = require('@condo/domains/notification/utils/testSchema')
const { getRandomPushTokenData, getRandomFakeSuccessToken } = require('@condo/domains/notification/utils/testSchema/utils')
const { FLAT_UNIT_TYPE } = require('@condo/domains/property/constants/common')
const { makeClientWithResidentAccessAndProperty } = require('@condo/domains/property/utils/testSchema')
const { makeClientWithServiceUser } = require('@condo/domains/user/utils/testSchema')

// eslint-disable-next-line import/order
const index = require('@app/condo')


async function waitForMessageResponses ({ admin, messageId, successResponseAppIds, failureResponseAppIds }) {
    await waitFor(async () => {
        const sentOldNativeMessage = await Message.getOne(admin, { id: messageId })

        const responses = sentOldNativeMessage.processingMeta.transportsMeta?.[0]?.deliveryMetadata?.responses ?? []

        const successResponses = responses?.filter(r => r.success) ?? []
        const failureResponses = responses?.filter(r => !r.success) ?? []

        expect(successResponses).toHaveLength(successResponseAppIds.length)
        expect(failureResponses).toHaveLength(failureResponseAppIds.length)

        expect(sentOldNativeMessage.status).toEqual(MESSAGE_SENT_STATUS)
        expect(responses).toHaveLength(successResponseAppIds.length + failureResponseAppIds.length)

        expect(successResponses).toEqual(expect.arrayContaining(successResponseAppIds.map(appId => expect.objectContaining({ appId }))))
        expect(failureResponses).toEqual(expect.arrayContaining(failureResponseAppIds.map(appId => expect.objectContaining({ appId }))))
    }, { interval: 1000, timeout: 5000 })
}


describe('SendVoIPCallStartMessageService spec', () => {
    setFakeClientMode(index)

    let admin
    
    beforeAll(async () => {
        admin = await makeLoggedInAdminClient()
    })

    describe('Logic', () => {

        let serviceUser
        let organization
        let property
        let b2cApp

        let unitName
        let unitType
        let actor
        const NORMAL_APP_ID = faker.random.alphaNumeric(8)

        beforeAll(async () => {
            const [testB2CApp] = await createTestB2CApp(admin)
            b2cApp = testB2CApp

            const { organization: testOrganization, property: testProperty } = await makeClientWithResidentAccessAndProperty()
            organization = testOrganization
            property = testProperty
            await createTestB2CAppProperty(admin, b2cApp, { address: testProperty.address, addressMeta: testProperty.addressMeta })
            serviceUser = await makeClientWithServiceUser()
            const [accessRightSet] = await createTestB2CAppAccessRightSet(admin, b2cApp, { canExecuteSendVoIPCallStartMessage: true, canExecuteSendVoIPCallCancelMessage: true })
            await createTestB2CAppAccessRight(admin, serviceUser.user, b2cApp, { accessRightSet: { connect: { id: accessRightSet.id } } })

            await createTestAppMessageSetting(admin, { b2cApp, numberOfNotificationInWindow: 1000, type: VOIP_INCOMING_CALL_MESSAGE_TYPE })


            unitName = faker.random.alphaNumeric(3)
            unitType = FLAT_UNIT_TYPE
            actor = await prepareVoIPUser({ admin, organization, property, unitName, unitType })

            const fakeSuccessVoIPPushToken1VoIP = getRandomPushTokenData({ token: getRandomFakeSuccessToken(), isVoIP: true, transport: PUSH_TRANSPORT_APPLE })
            const fakeSuccessVoIPPushToken1Push = getRandomPushTokenData({ token: getRandomFakeSuccessToken(), isPush: true, transport: PUSH_TRANSPORT_APPLE })
            const fakeSuccessVoIPPushToken2VoIP = getRandomPushTokenData({ token: getRandomFakeSuccessToken(), isVoIP: true, transport: PUSH_TRANSPORT_FIREBASE })
            const fakeSuccessVoIPPushToken2Push = getRandomPushTokenData({ token: getRandomFakeSuccessToken(), isPush: true, transport: PUSH_TRANSPORT_FIREBASE })


            await syncRemoteClientByTestClient(actor.userClient, {
                appId: APP_ID_ONLY_NATIVE_VOIP,
                deviceId: faker.datatype.uuid(),
                devicePlatform: faker.helpers.arrayElement(DEVICE_PLATFORM_TYPES),
                pushTokens: [fakeSuccessVoIPPushToken1VoIP, fakeSuccessVoIPPushToken1Push],
            })
            await syncRemoteClientByTestClient(actor.userClient, {
                appId: NORMAL_APP_ID,
                deviceId: faker.datatype.uuid(),
                devicePlatform: faker.helpers.arrayElement(DEVICE_PLATFORM_TYPES),
                pushTokens: [fakeSuccessVoIPPushToken2VoIP, fakeSuccessVoIPPushToken2Push],
            })
        })

        describe('Multiple messages for one call', () => {  

            test('Send only one of messages to each appId of users RemoteClients', async () => {
                const callDataNative = {
                    callId: faker.datatype.uuid(),
                    nativeCallData: {
                        voipAddress: faker.internet.ip(),
                        voipLogin: faker.internet.userName(),
                        voipPassword: faker.internet.password(),
                        voipPanels: [{ dtmfCommand: faker.random.alphaNumeric(2), name: faker.random.alphaNumeric(3) }],
                        iceServers: [{ address: `stun:${faker.internet.ip()}` }],
                        codec: 'vp8',
                    },
                }
            
                const callDataB2c = {
                    callId: faker.datatype.uuid(),
                    b2cAppCallData: {
                        B2CAppContext: '',
                    },
                }
                    
                const [resultNative] = await sendVoIPCallStartMessageByTestClient(serviceUser, {
                    app: { id: b2cApp.id },
                    addressKey: property.addressKey,
                    unitName,
                    unitType,
                    callData: callDataNative,
                })
                    
                expect(resultNative.verifiedContactsCount).toBe(1)
                expect(resultNative.createdMessagesCount).toBe(1)
                expect(resultNative.erroredMessagesCount).toBe(0)
            
                const [createdNativeMessage] = await Message.getAll(admin, {
                    user: { id: actor.user.id },
                    type: VOIP_INCOMING_CALL_MESSAGE_TYPE,
                }, { first: 1, sortBy: ['createdAt_DESC'] })

                expect(createdNativeMessage).toBeDefined()
            
                const [resultB2C] = await sendVoIPCallStartMessageByTestClient(serviceUser, {
                    app: { id: b2cApp.id },
                    addressKey: property.addressKey,
                    unitName,
                    unitType,
                    callData: callDataB2c,
                })
                    
                expect(resultB2C.verifiedContactsCount).toBe(1)
                expect(resultB2C.createdMessagesCount).toBe(1)
                expect(resultB2C.erroredMessagesCount).toBe(0)
            
                const [createdB2CMessage] = await Message.getAll(admin, {
                    user: { id: actor.user.id },
                    type: VOIP_INCOMING_CALL_MESSAGE_TYPE,
                }, { first: 1, sortBy: ['createdAt_DESC'] })

                expect(createdB2CMessage).toBeDefined()

                await waitForMessageResponses({ admin, messageId: createdNativeMessage.id, successResponseAppIds: [NORMAL_APP_ID, APP_ID_ONLY_NATIVE_VOIP], failureResponseAppIds: [] })
                await waitForMessageResponses({ admin, messageId: createdB2CMessage.id, successResponseAppIds: [NORMAL_APP_ID], failureResponseAppIds: [APP_ID_ONLY_NATIVE_VOIP] })
            })
            
        })

        describe('Global push validator', () => {
            test('Can block message type entirely for appId', async () => {
                const fakeSuccessVoIPPushToken3VoIP = getRandomPushTokenData({ token: getRandomFakeSuccessToken(), isVoIP: true, transport: PUSH_TRANSPORT_FIREBASE })
                const fakeSuccessVoIPPushToken3Push = getRandomPushTokenData({ token: getRandomFakeSuccessToken(), isPush: true, transport: PUSH_TRANSPORT_FIREBASE })
                await syncRemoteClientByTestClient(actor.userClient, {
                    appId: APP_ID_ONLY_INCOMING_CALL_ALLOWED,
                    deviceId: faker.datatype.uuid(),
                    devicePlatform: faker.helpers.arrayElement(DEVICE_PLATFORM_TYPES),
                    pushTokens: [fakeSuccessVoIPPushToken3VoIP, fakeSuccessVoIPPushToken3Push],
                })
                
                const callDataB2c = {
                    callId: faker.datatype.uuid(),
                    b2cAppCallData: {
                        B2CAppContext: '',
                    },
                }

                const [resultB2C] = await sendVoIPCallStartMessageByTestClient(serviceUser, {
                    app: { id: b2cApp.id },
                    addressKey: property.addressKey,
                    unitName,
                    unitType,
                    callData: callDataB2c,
                })
                
                expect(resultB2C.verifiedContactsCount).toBe(1)
                expect(resultB2C.createdMessagesCount).toBe(1)
                expect(resultB2C.erroredMessagesCount).toBe(0)

                const [createdB2CMessage] = await Message.getAll(admin, {
                    user: { id: actor.user.id },
                    type: VOIP_INCOMING_CALL_MESSAGE_TYPE,
                }, { first: 1, sortBy: ['createdAt_DESC'] })

                expect(createdB2CMessage).toBeDefined()

                await waitForMessageResponses({ admin, messageId: createdB2CMessage.id, successResponseAppIds: [NORMAL_APP_ID, APP_ID_ONLY_INCOMING_CALL_ALLOWED], failureResponseAppIds: [APP_ID_ONLY_NATIVE_VOIP] })

                await sendVoIPCallCancelMessageByTestClient(serviceUser, {
                    app: { id: b2cApp.id },
                    addressKey: property.addressKey,
                    unitName,
                    unitType,
                    callData: {
                        callId: callDataB2c.callId,
                        reason: SEND_VOIP_CALL_CANCEL_MESSAGE_CANCEL_REASON_ANSWERED,
                    },
                })
                
                await waitFor(async () => {
                    const [cancelMsg] = await Message.getAll(
                        admin, 
                        { type: CANCELED_CALL_MESSAGE_PUSH_TYPE, user: { id: actor.user.id } },
                        { sortBy: ['createdAt_DESC'], first: 1 }
                    )

                    expect(cancelMsg).toBeDefined()
                    expect(cancelMsg.meta.data).toHaveProperty('callId', callDataB2c.callId)

                    const responses = cancelMsg.processingMeta.transportsMeta?.[0]?.deliveryMetadata?.responses ?? []
                    const successResponses = responses?.filter(r => r.success) ?? []
                    const failureResponses = responses?.filter(r => !r.success) ?? []

                    expect(successResponses).toHaveLength(2)
                    expect(failureResponses).toHaveLength(1)

                    expect(cancelMsg.status).toEqual(MESSAGE_SENT_STATUS)

                    expect(successResponses).toEqual(expect.arrayContaining([NORMAL_APP_ID, APP_ID_ONLY_NATIVE_VOIP].map(appId => expect.objectContaining({ appId }))))
                    expect(failureResponses).toEqual(expect.arrayContaining([APP_ID_ONLY_INCOMING_CALL_ALLOWED].map(appId => expect.objectContaining({ appId }))))
                    expect(failureResponses.find(resp => resp.appId === APP_ID_ONLY_INCOMING_CALL_ALLOWED)).toHaveProperty('error', 'message data global validation by appId error')
                })
            })
        })

    })

})