const { faker } = require('@faker-js/faker')
const { z } = require('zod')

const APP_ID_ONLY_NATIVE_VOIP = `only_native_${faker.random.alphaNumeric(8)}`

require('@condo/domains/common/utils/testSchema/env').mockEnv({
    TESTS_FAKE_WORKER_MODE: true,
    PUSH_ADAPTER_SETTINGS: {
        pushDataValidatorsByAppId: {
            [APP_ID_ONLY_NATIVE_VOIP]: {
                [jest.requireActual('@condo/domains/notification/constants/constants').VOIP_INCOMING_CALL_MESSAGE_TYPE]: z.object({
                    voipAddress: z.string(),
                    voipLogin: z.string(),
                    voipPassword: z.string(),
                    voipPanels: z.string(),
                    voipType: z.literal('sip'),
                    voipIceServers: z.string(),
                }).loose().toJSONSchema(),
            },
        },
    },
})

const {
    makeLoggedInAdminClient,
    waitFor,
    setFakeClientMode,
} = require('@open-condo/keystone/test.utils')

const {
    createTestB2CApp,
    sendVoIPCallStartMessageByTestClient,
    createTestB2CAppProperty,
    createTestB2CAppAccessRight,
    createTestB2CAppAccessRightSet,
    createTestAppMessageSetting,
    prepareVoIPUser,
} = require('@condo/domains/miniapp/utils/testSchema')
const { VOIP_INCOMING_CALL_MESSAGE_TYPE, MESSAGE_SENT_STATUS, DEVICE_PLATFORM_TYPES, PUSH_TRANSPORT_APPLE, PUSH_TRANSPORT_FIREBASE } = require('@condo/domains/notification/constants/constants')
const { Message, syncRemoteClientByTestClient } = require('@condo/domains/notification/utils/testSchema')
const { FLAT_UNIT_TYPE } = require('@condo/domains/property/constants/common')
const { makeClientWithResidentAccessAndProperty } = require('@condo/domains/property/utils/testSchema')
const { makeClientWithServiceUser } = require('@condo/domains/user/utils/testSchema')

// eslint-disable-next-line import/order
const index = require('@app/condo')
const { getRandomPushTokenData, getRandomFakeSuccessToken } = require('../../notification/utils/testSchema/utils')


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

        beforeAll(async () => {
            const [testB2CApp] = await createTestB2CApp(admin)
            b2cApp = testB2CApp

            const { organization: testOrganization, property: testProperty } = await makeClientWithResidentAccessAndProperty()
            organization = testOrganization
            property = testProperty
            await createTestB2CAppProperty(admin, b2cApp, { address: testProperty.address, addressMeta: testProperty.addressMeta })
            serviceUser = await makeClientWithServiceUser()
            const [accessRightSet] = await createTestB2CAppAccessRightSet(admin, b2cApp, { canExecuteSendVoIPCallStartMessage: true })
            await createTestB2CAppAccessRight(admin, serviceUser.user, b2cApp, { accessRightSet: { connect: { id: accessRightSet.id } } })

            await createTestAppMessageSetting(admin, { b2cApp, numberOfNotificationInWindow: 1000, type: VOIP_INCOMING_CALL_MESSAGE_TYPE })
        })

        describe('Multiple messages for one call', () => {  

            test('Send only one of messages to each appId of users RemoteClients', async () => {
                const NORMAL_APP_ID = faker.random.alphaNumeric(8)
                const unitName = faker.random.alphaNumeric(3)
                const unitType = FLAT_UNIT_TYPE
                const actor = await prepareVoIPUser({ admin, organization, property, unitName, unitType })

                const fakeSuccessVoIPPushToken1 = getRandomPushTokenData({ token: getRandomFakeSuccessToken(), isVoIP: true, transport: PUSH_TRANSPORT_APPLE })
                const fakeSuccessVoIPPushToken2 = getRandomPushTokenData({ token: getRandomFakeSuccessToken(), isVoIP: true, transport: PUSH_TRANSPORT_FIREBASE })

                await syncRemoteClientByTestClient(actor.userClient, { 
                    appId: APP_ID_ONLY_NATIVE_VOIP,
                    deviceId: faker.datatype.uuid(),
                    devicePlatform: faker.helpers.arrayElement(DEVICE_PLATFORM_TYPES),
                    pushTokens: [fakeSuccessVoIPPushToken1],
                })
                await syncRemoteClientByTestClient(actor.userClient, { 
                    appId: NORMAL_APP_ID,
                    deviceId: faker.datatype.uuid(),
                    devicePlatform: faker.helpers.arrayElement(DEVICE_PLATFORM_TYPES),
                    pushTokens: [fakeSuccessVoIPPushToken2],
                })
                
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

                async function waitForMessageResponses ({ messageId, successResponseAppIds, failureResponseAppIds }) {
                    await waitFor(async () => {
                        const sentOldNativeMessage = await Message.getOne(admin, { id: messageId })
                        console.error('Message', JSON.stringify(sentOldNativeMessage, null, 2))
                        
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

                await waitForMessageResponses({ messageId: createdNativeMessage.id, successResponseAppIds: [NORMAL_APP_ID, APP_ID_ONLY_NATIVE_VOIP], failureResponseAppIds: [] })
                await waitForMessageResponses({ messageId: createdB2CMessage.id, successResponseAppIds: [NORMAL_APP_ID], failureResponseAppIds: [APP_ID_ONLY_NATIVE_VOIP] })
            })
            
        })

    })

})