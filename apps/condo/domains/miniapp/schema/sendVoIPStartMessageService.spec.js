// eslint-disable-next-line import/order
const { generateUUIDv4 } = require('@open-condo/miniapp-utils/helpers/uuid')
global._TEST_VOIP_TYPE_CUSTOM_FIELD_ID = generateUUIDv4()
jest.doMock('@open-condo/config', () => {
    const actual = jest.requireActual('@open-condo/config')
    return new Proxy(actual, {
        set () {},
        get (_t, p) {
            if (p === 'VOIP_TYPE_CUSTOM_FIELD_ID') {
                return global._TEST_VOIP_TYPE_CUSTOM_FIELD_ID
            }
            return actual[p]
        },
    })
})

// eslint-disable-next-line import/order
const index = require('@app/condo/index')
// eslint-disable-next-line import/order
const { faker } = require('@faker-js/faker')

// eslint-disable-next-line import/order
const { setFakeClientMode } = require('@open-condo/keystone/test.utils')
const {
    makeLoggedInAdminClient,
// eslint-disable-next-line import/order
} = require('@open-condo/keystone/test.utils')

const { createTestContact } = require('@condo/domains/contact/utils/testSchema')
const { MAGIC_VOIP_TYPE_CONSTANT_FOR_OLD_VERSIONS_COMPATIBILITY, DEFAULT_VOIP_TYPE } = require('@condo/domains/miniapp/constants')
const {
    createTestB2CApp,
    sendVoIPStartMessageByTestClient,
    createTestB2CAppProperty,
    createTestCustomValue,
    createTestB2BApp,
    createTestB2BAppAccessRight,
    createTestB2BAppContext,
    createTestB2BAppAccessRightSet,
    createTestAppMessageSetting,
} = require('@condo/domains/miniapp/utils/testSchema')
const {
    VOIP_INCOMING_CALL_MESSAGE_TYPE,
} = require('@condo/domains/notification/constants/constants')
const { Message } = require('@condo/domains/notification/utils/testSchema')
const { FLAT_UNIT_TYPE } = require('@condo/domains/property/constants/common')
const { makeClientWithResidentAccessAndProperty } = require('@condo/domains/property/utils/testSchema')
const { createTestResident } = require('@condo/domains/resident/utils/testSchema')
const {
    makeClientWithResidentUser,
    createTestPhone,
    makeClientWithServiceUser,
} = require('@condo/domains/user/utils/testSchema')

async function prepareSingleActor ({ admin, organization, property, unitName, unitType }) {
    const phone = createTestPhone()
    const userClient = await makeClientWithResidentUser({}, { phone })
    const [contact] = await createTestContact(admin, organization, property, {
        unitName: unitName,
        unitType: unitType,
        isVerified: true,
        phone: phone,
    })
    const [resident] = await createTestResident(admin, userClient.user, property, {
        unitName: unitName,
        unitType: unitType,
    })

    return {
        user: userClient.user,
        contact,
        resident,
    }
}

describe('sendVoIPStartMessageService spec', () => {
    setFakeClientMode(index)

    let admin

    afterAll(async () => {
        jest.unmock('@open-condo/config')
        delete global._TEST_VOIP_TYPE_CUSTOM_FIELD_ID
    })

    beforeAll(async () => {
        await index.keystone.lists.CustomField.adapter.create({ 
            id: global._TEST_VOIP_TYPE_CUSTOM_FIELD_ID,
            dv: 1,
            v: 1,
            name: faker.random.alphaNumeric(8),
            modelName: 'Contact',
            type: 'String',
            validationRules: null,
            isVisible: false,
            priority: 0,
            isUniquePerObject: true,
            staffCanRead: false,
            sender: { dv: 1, fingerprint: faker.random.alphaNumeric(8) },
        })

        admin = await makeLoggedInAdminClient()
    })

    describe('Logic', () => {

        describe('voipType priority', () => {

            test('complex case with everything', async () => {
                const [b2cApp] = await createTestB2CApp(admin)
                const { organization, property } = await makeClientWithResidentAccessAndProperty()
                await createTestB2CAppProperty(admin, b2cApp, { address: property.address, addressMeta: property.addressMeta })

                const serviceUser = await makeClientWithServiceUser()
                const [b2bApp] = await createTestB2BApp(admin)
                await createTestB2BAppContext(admin, b2bApp, organization, { status: 'Finished' })
                const [b2bAppAccessRightSet] = await createTestB2BAppAccessRightSet(admin, b2bApp, { canReadOrganizations: true, canReadCustomValues: true, canManageCustomValues: true })
                await createTestB2BAppAccessRight(admin, serviceUser.user, b2bApp, b2bAppAccessRightSet)

                const unitName = faker.random.alphaNumeric(3)
                const unitType = FLAT_UNIT_TYPE
            
                const residentsCount = 4
                const prepareDataPromises = []
                const actors = []

                for (let i = 0; i < residentsCount; i++) {
                    prepareDataPromises.push((async ({ admin, organization, property, unitName, unitType }) => {
                        const actor = await prepareSingleActor({ admin, organization, property, unitName, unitType })
                        actors.push(actor)
                    })({ admin, organization, property, unitName, unitType }))
                }
                await Promise.all(prepareDataPromises)

                const normalVoIPType = 1
                const resident1VoIPType = 2
                const resident2VoIPType = 3
                const resident3VoIPType = 'b2cApp'

                const customVoIPTypesWithActors = [
                    [resident1VoIPType, actors[0]],
                    [resident2VoIPType, actors[1]],
                    [resident3VoIPType, actors[2]],
                ]
                
                for (const [customVoIPType, actor] of customVoIPTypesWithActors) {
                    await createTestCustomValue(serviceUser, { id: global._TEST_VOIP_TYPE_CUSTOM_FIELD_ID }, organization, {
                        sourceType: 'B2BApp',
                        data: String(customVoIPType),
                        itemId: actor.contact.id,
                        sourceId: b2bApp.id,
                        isUniquePerObject: true,
                    })   
                }

                const dataAttrs = {
                    callId: faker.datatype.uuid(),
                    b2cAppCallData: {
                        B2CAppContext: faker.random.alphaNumeric(10),
                    },
                    nativeCallData: {
                        voipAddress: faker.internet.ip(),
                        voipLogin: faker.internet.userName(),
                        voipPassword: faker.internet.password(),
                        voipPanels: [
                            { dtfmCommand: faker.random.alphaNumeric(2), name: faker.random.alphaNumeric(3) },
                            { dtfmCommand: faker.random.alphaNumeric(2), name: faker.random.alphaNumeric(3) },
                        ],
                        stunServers: [faker.internet.ip(), faker.internet.ip()],
                        voipType: normalVoIPType,
                        codec: 'vp8',
                    },
                }

                const [result] = await sendVoIPStartMessageByTestClient(admin, {
                    app: { id: b2cApp.id },
                    addressKey: property.addressKey,
                    unitName: unitName,
                    unitType: unitType,
                    callData: dataAttrs,
                })
                expect(result.verifiedContactsCount).toBe(residentsCount)
                expect(result.createdMessagesCount).toBe(residentsCount)
                expect(result.erroredMessagesCount).toBe(0)
            
                const createdMessages = await Message.getAll(admin, { 
                    user: { id_in: actors.map(actor => actor.user.id) },
                    type: VOIP_INCOMING_CALL_MESSAGE_TYPE,
                }, { first: residentsCount })
            
                expect(createdMessages).toHaveLength(residentsCount)
                expect([...new Set(createdMessages.map(msg => msg.user))]).toHaveLength(residentsCount)
                
                const createdMessagesByResident = createdMessages.reduce((byResident, msg) => {
                    byResident[msg.meta.data.residentId] = msg
                    return byResident
                }, {})
                expect(Object.keys(createdMessagesByResident)).toEqual(expect.arrayContaining(actors.map(actor => actor.resident.id)))


                const defaultMetaDataFields = {
                    B2CAppId: b2cApp.id,
                    B2CAppName: b2cApp.name,
                    callId: dataAttrs.callId,
                }
                const defaultMetaDataB2CAppCallDataFields = {
                    ...defaultMetaDataFields,
                    B2CAppContext: dataAttrs.b2cAppCallData.B2CAppContext,
                }
                const defaultMetaDataNativeCallDataFields = {
                    ...defaultMetaDataFields,
                    voipAddress: dataAttrs.nativeCallData.voipAddress,
                    voipLogin: dataAttrs.nativeCallData.voipLogin,
                    voipPassword: dataAttrs.nativeCallData.voipPassword,
                    voipDtfmCommand: dataAttrs.nativeCallData.voipPanels[0].dtfmCommand,
                    voipPanels: dataAttrs.nativeCallData.voipPanels,
                    stun: dataAttrs.nativeCallData.stunServers[0],
                    stunServers: dataAttrs.nativeCallData.stunServers,
                    codec: dataAttrs.nativeCallData.codec,
                }

                const normalVoIPTypeMessages = createdMessages.filter(msg => msg.meta.data.voipType === String(normalVoIPType))
                try {
                    expect(normalVoIPTypeMessages).toHaveLength(1)
                } catch (err) {
                    console.error('normalVoIPTypeMessages fail')
                    throw err
                }
                expect(normalVoIPTypeMessages[0]).toEqual(expect.objectContaining({
                    meta: expect.objectContaining({
                        data: expect.objectContaining({
                            ...defaultMetaDataNativeCallDataFields,
                            residentId: actors[3].resident.id,
                            voipType: String(normalVoIPType),
                        }),
                    }),
                }))

                const resident1VoIPTypeMessages = createdMessages.filter(msg => msg.meta.data.voipType === String(resident1VoIPType))
                try {
                    expect(resident1VoIPTypeMessages).toHaveLength(1)
                } catch (err) {
                    console.error('resident1VoIPTypeMessages fail')
                    throw err
                }
                expect(resident1VoIPTypeMessages[0]).toEqual(expect.objectContaining({
                    meta: expect.objectContaining({
                        data: expect.objectContaining({
                            ...defaultMetaDataNativeCallDataFields,
                            residentId: actors[0].resident.id,
                            voipType: String(resident1VoIPType),
                        }),
                    }),
                }))

                const resident2VoIPTypeMessages = createdMessages.filter(msg => msg.meta.data.voipType === String(resident2VoIPType))
                try {
                    expect(resident2VoIPTypeMessages).toHaveLength(1)
                } catch (err) {
                    console.error('resident2VoIPTypeMessages fail')
                    throw err
                }
                expect(resident2VoIPTypeMessages[0]).toEqual(expect.objectContaining({
                    meta: expect.objectContaining({
                        data: expect.objectContaining({
                            ...defaultMetaDataNativeCallDataFields,
                            residentId: actors[1].resident.id,
                            voipType: String(resident2VoIPType),
                        }),
                    }),
                }))

                const b2cAppVoIPTypeMessages = createdMessages.filter(msg => !!msg.meta.data.B2CAppContext)
                expect(b2cAppVoIPTypeMessages).toHaveLength(1)
                try {
                    expect(b2cAppVoIPTypeMessages).toHaveLength(1)
                } catch (err) {
                    console.error('b2cAppVoIPTypeMessages fail')
                    throw err
                }
                expect(b2cAppVoIPTypeMessages[0]).toEqual(expect.objectContaining({
                    meta: expect.objectContaining({
                        data: expect.objectContaining({
                            ...defaultMetaDataB2CAppCallDataFields,
                            residentId: actors[2].resident.id,
                        }),
                    }),
                }))

            })

            test('forces b2cApp call when CustomValue.data is not a digit', async () => {
                const [b2cApp] = await createTestB2CApp(admin)
                const { organization, property } = await makeClientWithResidentAccessAndProperty()
                await createTestB2CAppProperty(admin, b2cApp, { address: property.address, addressMeta: property.addressMeta })

                const serviceUser = await makeClientWithServiceUser()
                const [b2bApp] = await createTestB2BApp(admin)
                await createTestB2BAppContext(admin, b2bApp, organization, { status: 'Finished' })
                const [b2bAppAccessRightSet] = await createTestB2BAppAccessRightSet(admin, b2bApp, { canReadOrganizations: true, canReadCustomValues: true, canManageCustomValues: true })
                await createTestB2BAppAccessRight(admin, serviceUser.user, b2bApp, b2bAppAccessRightSet)

                const unitName = faker.random.alphaNumeric(3)
                const unitType = FLAT_UNIT_TYPE
                const actor = await prepareSingleActor({ admin, organization, property, unitName, unitType })

                await createTestCustomValue(serviceUser, { id: global._TEST_VOIP_TYPE_CUSTOM_FIELD_ID }, organization, {
                    sourceType: 'B2BApp',
                    data: faker.random.alphaNumeric(8),
                    itemId: actor.contact.id,
                    sourceId: b2bApp.id,
                    isUniquePerObject: true,
                })

                await createTestAppMessageSetting(admin, {
                    b2cApp,
                    type: VOIP_INCOMING_CALL_MESSAGE_TYPE,
                    numberOfNotificationInWindow: 10,
                })

                const callData = {
                    callId: faker.datatype.uuid(),
                    b2cAppCallData: { B2CAppContext: faker.random.alphaNumeric(10) },
                    nativeCallData: {
                        voipAddress: faker.internet.ip(),
                        voipLogin: faker.internet.userName(),
                        voipPassword: faker.internet.password(),
                        voipPanels: [{ dtfmCommand: faker.random.alphaNumeric(2), name: faker.random.alphaNumeric(3) }],
                        stunServers: [faker.internet.ip()],
                        voipType: 1,
                        codec: 'vp8',
                    },
                }

                const [result] = await sendVoIPStartMessageByTestClient(admin, {
                    app: { id: b2cApp.id },
                    addressKey: property.addressKey,
                    unitName,
                    unitType,
                    callData,
                })

                expect(result.verifiedContactsCount).toBe(1)
                expect(result.createdMessagesCount).toBe(1)
                expect(result.erroredMessagesCount).toBe(0)

                const [createdMessage] = await Message.getAll(admin, {
                    user: { id: actor.user.id },
                    type: VOIP_INCOMING_CALL_MESSAGE_TYPE,
                }, { first: 1 })

                expect(createdMessage).toEqual(expect.objectContaining({
                    meta: expect.objectContaining({
                        data: expect.objectContaining({
                            B2CAppContext: callData.b2cAppCallData.B2CAppContext,
                            residentId: actor.resident.id,
                        }),
                    }),
                }))
                expect(createdMessage.meta.data.voipAddress).toBeUndefined()
                expect(createdMessage.meta.data.voipType).toBeUndefined()

                // But if there is no data for B2C call, then just send native one
                delete callData.b2cAppCallData
                const [anotherResult] = await sendVoIPStartMessageByTestClient(admin, {
                    app: { id: b2cApp.id },
                    addressKey: property.addressKey,
                    unitName,
                    unitType,
                    callData,
                })
                expect(anotherResult.verifiedContactsCount).toBe(1)
                expect(anotherResult.createdMessagesCount).toBe(1)
                expect(anotherResult.erroredMessagesCount).toBe(0)

                const [anotherCreatedMessage] = await Message.getAll(admin, {
                    user: { id: actor.user.id },
                    type: VOIP_INCOMING_CALL_MESSAGE_TYPE,
                }, { first: 1, sortBy: ['createdAt_DESC'] })

                expect(anotherCreatedMessage).toEqual(expect.objectContaining({
                    meta: expect.objectContaining({
                        data: expect.objectContaining({
                            voipType: String(callData.nativeCallData.voipType),
                            residentId: actor.resident.id,
                        }),
                    }),
                }))
                expect(anotherCreatedMessage.meta.data.B2CAppContext).toBeUndefined()
            })

            test(`maps CustomValue.data="${DEFAULT_VOIP_TYPE}" to legacy voipType "${MAGIC_VOIP_TYPE_CONSTANT_FOR_OLD_VERSIONS_COMPATIBILITY}"`, async () => {
                const [b2cApp] = await createTestB2CApp(admin)
                const { organization, property } = await makeClientWithResidentAccessAndProperty()
                await createTestB2CAppProperty(admin, b2cApp, { address: property.address, addressMeta: property.addressMeta })

                const serviceUser = await makeClientWithServiceUser()
                const [b2bApp] = await createTestB2BApp(admin)
                await createTestB2BAppContext(admin, b2bApp, organization, { status: 'Finished' })
                const [b2bAppAccessRightSet] = await createTestB2BAppAccessRightSet(admin, b2bApp, { canReadOrganizations: true, canReadCustomValues: true, canManageCustomValues: true })
                await createTestB2BAppAccessRight(admin, serviceUser.user, b2bApp, b2bAppAccessRightSet)

                const unitName = faker.random.alphaNumeric(3)
                const unitType = FLAT_UNIT_TYPE
                const actor = await prepareSingleActor({ admin, organization, property, unitName, unitType })

                await createTestCustomValue(serviceUser, { id: global._TEST_VOIP_TYPE_CUSTOM_FIELD_ID }, organization, {
                    sourceType: 'B2BApp',
                    data: String(DEFAULT_VOIP_TYPE),
                    itemId: actor.contact.id,
                    sourceId: b2bApp.id,
                    isUniquePerObject: true,
                })

                const callData = {
                    callId: faker.datatype.uuid(),
                    b2cAppCallData: { B2CAppContext: faker.random.alphaNumeric(10) },
                    nativeCallData: {
                        voipAddress: faker.internet.ip(),
                        voipLogin: faker.internet.userName(),
                        voipPassword: faker.internet.password(),
                        voipPanels: [{ dtfmCommand: faker.random.alphaNumeric(2), name: faker.random.alphaNumeric(3) }],
                        stunServers: [faker.internet.ip()],
                        voipType: 1,
                        codec: 'vp8',
                    },
                }

                const [result] = await sendVoIPStartMessageByTestClient(admin, {
                    app: { id: b2cApp.id },
                    addressKey: property.addressKey,
                    unitName,
                    unitType,
                    callData,
                })

                expect(result.verifiedContactsCount).toBe(1)
                expect(result.createdMessagesCount).toBe(1)
                expect(result.erroredMessagesCount).toBe(0)

                const [createdMessage] = await Message.getAll(admin, {
                    user: { id: actor.user.id },
                    type: VOIP_INCOMING_CALL_MESSAGE_TYPE,
                }, { first: 1 })

                expect(createdMessage).toEqual(expect.objectContaining({
                    meta: expect.objectContaining({
                        data: expect.objectContaining({
                            residentId: actor.resident.id,
                            voipType: MAGIC_VOIP_TYPE_CONSTANT_FOR_OLD_VERSIONS_COMPATIBILITY,
                            voipAddress: callData.nativeCallData.voipAddress,
                        }),
                    }),
                }))
            })

            test('uses native call voipType when CustomValue is absent', async () => {
                const [b2cApp] = await createTestB2CApp(admin)
                const { organization, property } = await makeClientWithResidentAccessAndProperty()
                await createTestB2CAppProperty(admin, b2cApp, { address: property.address, addressMeta: property.addressMeta })

                const unitName = faker.random.alphaNumeric(3)
                const unitType = FLAT_UNIT_TYPE
                const actor = await prepareSingleActor({ admin, organization, property, unitName, unitType })

                const nativeVoIPType = 3
                const callData = {
                    callId: faker.datatype.uuid(),
                    b2cAppCallData: { B2CAppContext: faker.random.alphaNumeric(10) },
                    nativeCallData: {
                        voipAddress: faker.internet.ip(),
                        voipLogin: faker.internet.userName(),
                        voipPassword: faker.internet.password(),
                        voipPanels: [{ dtfmCommand: faker.random.alphaNumeric(2), name: faker.random.alphaNumeric(3) }],
                        stunServers: [faker.internet.ip()],
                        voipType: nativeVoIPType,
                        codec: 'vp8',
                    },
                }

                const [result] = await sendVoIPStartMessageByTestClient(admin, {
                    app: { id: b2cApp.id },
                    addressKey: property.addressKey,
                    unitName,
                    unitType,
                    callData,
                })

                expect(result.verifiedContactsCount).toBe(1)
                expect(result.createdMessagesCount).toBe(1)
                expect(result.erroredMessagesCount).toBe(0)

                const [createdMessage] = await Message.getAll(admin, {
                    user: { id: actor.user.id },
                    type: VOIP_INCOMING_CALL_MESSAGE_TYPE,
                }, { first: 1 })

                expect(createdMessage).toEqual(expect.objectContaining({
                    meta: expect.objectContaining({
                        data: expect.objectContaining({
                            residentId: actor.resident.id,
                            voipType: String(nativeVoIPType),
                            voipAddress: callData.nativeCallData.voipAddress,
                        }),
                    }),
                }))
                expect(createdMessage.meta.data.B2CAppContext).toBeUndefined()
            })

        })
    })

})