const { faker } = require('@faker-js/faker')

const APP_ID_ENABLED_VOIP_INCOMING_CALL_MESSAGE = faker.random.alphaNumeric(10)
const APP_ID_DISABLED_VOIP_INCOMING_CALL_MESSAGE = faker.random.alphaNumeric(10)

require('@condo/domains/common/utils/testSchema/env').mockEnv({
    PUSH_ADAPTER_SETTINGS: () => {
        const { VOIP_INCOMING_CALL_MESSAGE_TYPE, VOIP_INCOMING_NATIVE_CALL_MESSAGE_TYPE, VOIP_INCOMING_B2C_APP_CALL_MESSAGE_TYPE } = jest.requireActual('@condo/domains/notification/constants/constants')

        return {
            pushTypeSwitchRulesByAppId: { 
                [APP_ID_ENABLED_VOIP_INCOMING_CALL_MESSAGE]: { 
                    [VOIP_INCOMING_CALL_MESSAGE_TYPE]: 'enabled',
                    [VOIP_INCOMING_NATIVE_CALL_MESSAGE_TYPE]: 'disabled',
                    [VOIP_INCOMING_B2C_APP_CALL_MESSAGE_TYPE]: 'disabled',
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

const {
    createTestB2CApp,
    sendVoIPCallStartMessageByTestClient,
    createTestB2CAppProperty,
    createTestB2CAppAccessRight,
    createTestB2CAppAccessRightSet,
    createTestAppMessageSetting,
    prepareVoIPUser,
} = require('@condo/domains/miniapp/utils/testSchema')
const { VOIP_INCOMING_CALL_MESSAGE_TYPE, VOIP_INCOMING_NATIVE_CALL_MESSAGE_TYPE, VOIP_INCOMING_B2C_APP_CALL_MESSAGE_TYPE, MESSAGE_SENT_STATUS, DEVICE_PLATFORM_TYPES, PUSH_TRANSPORT_APPLE, PUSH_TRANSPORT_FIREBASE } = require('@condo/domains/notification/constants/constants')
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
                const unitName = faker.random.alphaNumeric(3)
                const unitType = FLAT_UNIT_TYPE
                const actor = await prepareVoIPUser({ admin, organization, property, unitName, unitType })

                const fakeSuccessVoIPPushToken1 = getRandomPushTokenData({ token: getRandomFakeSuccessToken(), isVoIP: true, transport: PUSH_TRANSPORT_APPLE })
                const fakeSuccessVoIPPushToken2 = getRandomPushTokenData({ token: getRandomFakeSuccessToken(), isVoIP: true, transport: PUSH_TRANSPORT_FIREBASE })

                await syncRemoteClientByTestClient(actor.userClient, { 
                    appId: APP_ID_ENABLED_VOIP_INCOMING_CALL_MESSAGE,
                    deviceId: faker.datatype.uuid(),
                    devicePlatform: faker.helpers.arrayElement(DEVICE_PLATFORM_TYPES),
                    pushTokens: [fakeSuccessVoIPPushToken1],
                })
                await syncRemoteClientByTestClient(actor.userClient, { 
                    appId: APP_ID_DISABLED_VOIP_INCOMING_CALL_MESSAGE,
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
                        stunServers: [faker.internet.ip()],
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
            
                const createdNativeMessages = await Message.getAll(admin, {
                    user: { id: actor.user.id },
                    type_in: [VOIP_INCOMING_CALL_MESSAGE_TYPE, VOIP_INCOMING_NATIVE_CALL_MESSAGE_TYPE],
                }, { first: 2, sortBy: ['createdAt_DESC'] })

                const oldNativeVoIPMessage = createdNativeMessages.find(msg => msg.type === VOIP_INCOMING_CALL_MESSAGE_TYPE && msg.meta.data.callId === callDataNative.callId)
                const newNativeVoIPMessage = createdNativeMessages.find(msg => msg.type === VOIP_INCOMING_NATIVE_CALL_MESSAGE_TYPE && msg.meta.data.callId === callDataNative.callId)
                expect(oldNativeVoIPMessage).toBeTruthy()
                expect(newNativeVoIPMessage).toBeTruthy()
            
            
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
            
                const createdB2CMessages = await Message.getAll(admin, {
                    user: { id: actor.user.id },
                    type_in: [VOIP_INCOMING_CALL_MESSAGE_TYPE, VOIP_INCOMING_B2C_APP_CALL_MESSAGE_TYPE],
                }, { first: 2, sortBy: ['createdAt_DESC'] })

                const oldB2CVoIPMessage = createdB2CMessages.find(msg => msg.type === VOIP_INCOMING_CALL_MESSAGE_TYPE && msg.meta.data.callId === callDataB2c.callId)
                const newB2CVoIPMessage = createdB2CMessages.find(msg => msg.type === VOIP_INCOMING_B2C_APP_CALL_MESSAGE_TYPE && msg.meta.data.callId === callDataB2c.callId)
                expect(oldB2CVoIPMessage).toBeTruthy()
                expect(newB2CVoIPMessage).toBeTruthy()

                async function waitForMessageResponses ({ messageId, successResponseAppId, failureResponseAppId }) {
                    await waitFor(async () => {
                        const sentOldNativeMessage = await Message.getOne(admin, { id: messageId })
                        
                        const responses = sentOldNativeMessage.processingMeta.transportsMeta?.[0]?.deliveryMetadata?.responses
                        
                        const successResponse = responses?.find(r => r.success)
                        const failureResponse = responses?.find(r => !r.success)

                        expect(sentOldNativeMessage.status).toEqual(MESSAGE_SENT_STATUS)
                        expect(successResponse).toBeTruthy()
                        expect(failureResponse).toBeTruthy()
                        expect(responses).toHaveLength(2)

                        expect(successResponse.appId).toEqual(successResponseAppId)
                        expect(failureResponse.appId).toEqual(failureResponseAppId)
                    }, { interval: 1000, timeout: 5000 })
                }

                await waitForMessageResponses({ messageId: oldNativeVoIPMessage.id, successResponseAppId: APP_ID_ENABLED_VOIP_INCOMING_CALL_MESSAGE, failureResponseAppId: APP_ID_DISABLED_VOIP_INCOMING_CALL_MESSAGE })
                await waitForMessageResponses({ messageId: newNativeVoIPMessage.id, successResponseAppId: APP_ID_DISABLED_VOIP_INCOMING_CALL_MESSAGE, failureResponseAppId: APP_ID_ENABLED_VOIP_INCOMING_CALL_MESSAGE })
                await waitForMessageResponses({ messageId: oldB2CVoIPMessage.id, successResponseAppId: APP_ID_ENABLED_VOIP_INCOMING_CALL_MESSAGE, failureResponseAppId: APP_ID_DISABLED_VOIP_INCOMING_CALL_MESSAGE })
                await waitForMessageResponses({ messageId: newB2CVoIPMessage.id, successResponseAppId: APP_ID_DISABLED_VOIP_INCOMING_CALL_MESSAGE, failureResponseAppId: APP_ID_ENABLED_VOIP_INCOMING_CALL_MESSAGE })
                
            })
            
        })

    })

})