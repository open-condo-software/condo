const { faker } = require('@faker-js/faker')

const {
    makeLoggedInAdminClient,
    makeClient,
    expectToThrowAccessDeniedErrorToResult,
    expectToThrowAuthenticationErrorToResult,
    expectToThrowGQLErrorToResult,
    expectToThrowGraphQLRequestError,
} = require('@open-condo/keystone/test.utils')

const { createTestContact } = require('@condo/domains/contact/utils/testSchema')
const { NATIVE_VOIP_TYPE, B2C_APP_VOIP_TYPE } = require('@condo/domains/miniapp/constants')
const {
    createTestB2CApp,
    sendVoIPCallStartMessageByTestClient,
    createTestB2CAppProperty,
    createTestB2CAppAccessRight,
    createTestB2CAppAccessRightSet,
    updateTestB2CAppAccessRight,
    createTestB2BApp,
    createTestB2BAppContext,
    createTestB2BAppAccessRightSet,
    createTestB2BAppAccessRight,
    createTestCustomValue,
    createTestAppMessageSetting,
    createTestCustomField,
} = require('@condo/domains/miniapp/utils/testSchema')
const { getCallStatus, CALL_STATUS_START_SENT } = require('@condo/domains/miniapp/utils/voip')
const {
    VOIP_INCOMING_CALL_MESSAGE_TYPE,
} = require('@condo/domains/notification/constants/constants')
const { Message } = require('@condo/domains/notification/utils/testSchema')
const { FLAT_UNIT_TYPE } = require('@condo/domains/property/constants/common')
const { makeClientWithResidentAccessAndProperty } = require('@condo/domains/property/utils/testSchema')
const { createTestResident } = require('@condo/domains/resident/utils/testSchema')
const { makeClientWithSupportUser, makeClientWithNewRegisteredAndLoggedInUser,
    makeClientWithResidentUser, createTestPhone,
    makeClientWithServiceUser,
} = require('@condo/domains/user/utils/testSchema')

const { ERRORS } = require('./SendVoIPCallStartMessageService')


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

describe('SendVoIPStartMessageService', () => {
    let admin

    beforeAll(async () => {
        admin = await makeLoggedInAdminClient()
    })

    describe('Access', () => {
        let b2cApp
        let property
        let serviceUser
        let b2cAccessRight

        beforeAll(async () => {
            const [testB2CApp] = await createTestB2CApp(admin)
            b2cApp = testB2CApp

            const { property: testProperty } = await makeClientWithResidentAccessAndProperty()
            property = testProperty
            await createTestB2CAppProperty(admin, b2cApp, { address: testProperty.address, addressMeta: testProperty.addressMeta })
            serviceUser = await makeClientWithServiceUser();
            [b2cAccessRight] = await createTestB2CAppAccessRight(admin, serviceUser.user, b2cApp)
        })

        const TEST_CASES = [
            { name: 'admin can', getClient: () => admin, expectError: null },
            { name: 'support can\'t', getClient: () => makeClientWithSupportUser(), expectError: expectToThrowAccessDeniedErrorToResult },
            { name: 'user can\'t', getClient: () => makeClientWithNewRegisteredAndLoggedInUser(), expectError: expectToThrowAccessDeniedErrorToResult },
            { name: 'anonymous can\'t', getClient: () => makeClient(), expectError: expectToThrowAuthenticationErrorToResult },
            { 
                name: 'service user without access right set and b2c app property can\'t', 
                getClient: () => serviceUser,
                expectError: expectToThrowAccessDeniedErrorToResult,
            },
            {
                name: 'service user with access right set and b2c app property can',
                getClient: async () => {
                    const [rightSet] = await createTestB2CAppAccessRightSet(admin, b2cApp, { canExecuteSendVoIPCallStartMessage: true })
                    await updateTestB2CAppAccessRight(admin, b2cAccessRight.id, { accessRightSet: { connect: { id: rightSet.id } } })
                    return serviceUser
                },
                expectError: null,
            },
        ]

        test.each(TEST_CASES)('$name', async ({ getClient, expectError }) => {
            const client = await getClient()
            const mutate = () => sendVoIPCallStartMessageByTestClient(client, {
                app: { id: b2cApp.id },
                addressKey: property.addressKey,
                unitName: faker.random.alphaNumeric(3),
                unitType: FLAT_UNIT_TYPE,
                callData: {
                    callId: faker.datatype.uuid(),
                    b2cAppCallData: { B2CAppContext: '' },
                },
            })
            if (expectError) {
                await expectError(async () => await mutate())
            } else {
                const [result] = await mutate()
                expect(result).toBeDefined()
                expect(result.verifiedContactsCount).toBe(0)
                expect(result.createdMessagesCount).toBe(0)
                expect(result.erroredMessagesCount).toBe(0)
            }
        })
    })

    describe('Validation', () => {

        test('should throw error if no app with provided id', async () => {
            await expectToThrowGQLErrorToResult(async () => {
                await sendVoIPCallStartMessageByTestClient(admin, {
                    app: { id: faker.datatype.uuid() },
                    addressKey: faker.datatype.uuid(),
                    unitName: faker.random.alphaNumeric(3),
                    unitType: FLAT_UNIT_TYPE,
                    callData: {
                        callId: faker.datatype.uuid(),
                        b2cAppCallData: { B2CAppContext: '' },
                    },
                })
            }, ERRORS.PROPERTY_NOT_FOUND)
        })

        test('should throw error if no b2cappproperty with provided addressKey', async () => {
            const [b2cApp] = await createTestB2CApp(admin)

            await expectToThrowGQLErrorToResult(async () => {
                await sendVoIPCallStartMessageByTestClient(admin, {
                    app: { id: b2cApp.id },
                    addressKey: faker.datatype.uuid(),
                    unitName: faker.random.alphaNumeric(3),
                    unitType: FLAT_UNIT_TYPE,
                    callData: {
                        callId: faker.datatype.uuid(),
                        b2cAppCallData: { B2CAppContext: '' },
                    },
                })
            }, ERRORS.PROPERTY_NOT_FOUND)
        })

        test('should throw error if callData does not contain data for b2c or native call', async () => {
            const [b2cApp] = await createTestB2CApp(admin)
            const { property } = await makeClientWithResidentAccessAndProperty()
            await createTestB2CAppProperty(admin, b2cApp, { address: property.address, addressMeta: property.addressMeta })

            const unitName = faker.random.alphaNumeric(3)
            const unitType = FLAT_UNIT_TYPE

            await expectToThrowGQLErrorToResult(async () => {
                await sendVoIPCallStartMessageByTestClient(admin, {
                    app: { id: b2cApp.id },
                    addressKey: property.addressKey,
                    unitName: unitName,
                    unitType: unitType,
                    callData: {
                        callId: faker.datatype.uuid(),
                    },
                })
            }, ERRORS.CALL_DATA_NOT_PROVIDED)
        })

    })

    describe('Logic', () => {
        let serviceUser
        let b2cAppProperty
        let organization
        let property
        let b2cApp

        beforeAll(async () => {
            const [testB2CApp] = await createTestB2CApp(admin)
            b2cApp = testB2CApp

            const { organization: testOrganization, property: testProperty } = await makeClientWithResidentAccessAndProperty()
            organization = testOrganization
            property = testProperty;
            [b2cAppProperty] = await createTestB2CAppProperty(admin, b2cApp, { address: testProperty.address, addressMeta: testProperty.addressMeta })
            serviceUser = await makeClientWithServiceUser()
            const [accessRightSet] = await createTestB2CAppAccessRightSet(admin, b2cApp, { canExecuteSendVoIPCallStartMessage: true })
            await createTestB2CAppAccessRight(admin, serviceUser.user, b2cApp, { accessRightSet: { connect: { id: accessRightSet.id } } })

            await createTestAppMessageSetting(admin, { b2cApp, numberOfNotificationInWindow: 1000, type: VOIP_INCOMING_CALL_MESSAGE_TYPE })
        })

        test('successfully sends VoIP start message when all conditions are met', async () => {
            const unitName = faker.random.alphaNumeric(3)
            const unitType = FLAT_UNIT_TYPE
            
            const verifiedContactsCount = 5
            const verifiedResidentsCount = 3
            const notVerifiedResidentsCount = verifiedContactsCount - verifiedResidentsCount
            
            const prepareDataPromises = []

            for (let i = 0; i < verifiedContactsCount; i++) {
                prepareDataPromises.push((async (admin, organization, property) => {
                    const phone = createTestPhone()
                    const userClient = await makeClientWithResidentUser({}, { phone })
                    await createTestContact(admin, organization, property, {
                        unitName: unitName,
                        unitType: unitType,
                        isVerified: true,
                        phone: phone,
                    })
                    const needToCreateVerifiedResident = i < verifiedResidentsCount
                    if (needToCreateVerifiedResident) {
                        await createTestResident(admin, userClient.user, property, {
                            unitName: unitName,
                            unitType: unitType,
                        })
                    }
                })(admin, organization, property))
            }
            for (let i = 0; i < notVerifiedResidentsCount; i++) {
                prepareDataPromises.push((async (admin, property) => {
                    const userClient = await makeClientWithResidentUser()
                    await createTestResident(admin, userClient.user, property, {
                        unitName: unitName,
                        unitType: unitType,
                    })
                })(admin, property))
            }
            await Promise.all(prepareDataPromises)
            
            const [result] = await sendVoIPCallStartMessageByTestClient(serviceUser, {
                app: { id: b2cApp.id },
                addressKey: property.addressKey,
                unitName: unitName,
                unitType: unitType,
                callData: {
                    callId: faker.datatype.uuid(),
                    b2cAppCallData: { B2CAppContext: '' },
                },
            })

            expect(result.verifiedContactsCount).toBe(verifiedContactsCount)
            expect(result.createdMessagesCount).toBe(verifiedResidentsCount)
            expect(result.erroredMessagesCount).toBe(0)
        })

        test('returns zeroish stats when no verified contacts found on unit', async () => {
            const unitName = faker.random.alphaNumeric(3)
            const unitType = FLAT_UNIT_TYPE

            await createTestContact(admin, organization, property, {
                unitName: unitName,
                unitType: unitType,
                isVerified: false,
            })
            const userClient = await makeClientWithResidentUser()
            await createTestResident(admin, userClient.user, property, {
                unitName: unitName,
                unitType: unitType,
            })

            const [result] = await sendVoIPCallStartMessageByTestClient(serviceUser, {
                app: { id: b2cApp.id },
                addressKey: property.addressKey,
                unitName: unitName,
                unitType: unitType,
                callData: {
                    callId: faker.datatype.uuid(),
                    b2cAppCallData: { B2CAppContext: '' },
                },
            })

            expect(result.verifiedContactsCount).toBe(0)
            expect(result.createdMessagesCount).toBe(0)
            expect(result.erroredMessagesCount).toBe(0)
        })

        test('returns zero message attempts when no residents found for verified contacts', async () => {
            const unitName = faker.random.alphaNumeric(3)
            const unitType = FLAT_UNIT_TYPE

            await createTestContact(admin, organization, property, {
                unitName: unitName,
                unitType: unitType,
                isVerified: true,
            })
            const userClient = await makeClientWithResidentUser()
            await createTestResident(admin, userClient.user, property, {
                unitName: faker.random.alphaNumeric(3),
                unitType: unitType,
            })

            const [result] = await sendVoIPCallStartMessageByTestClient(serviceUser, {
                app: { id: b2cApp.id },
                addressKey: property.addressKey,
                unitName: unitName,
                unitType: unitType,
                callData: {
                    callId: faker.datatype.uuid(),
                    b2cAppCallData: { B2CAppContext: '' },
                },
            })

            expect(result.verifiedContactsCount).toBe(1)
            expect(result.createdMessagesCount).toBe(0)
            expect(result.erroredMessagesCount).toBe(0)
        })

        describe('Cache', () => {
            test('Saves call status in cache', async () => {
                const unitName = faker.random.alphaNumeric(3)
                const unitType = FLAT_UNIT_TYPE

                const residentsCount = 3
                const prepareDataPromises = []

                for (let i = 0; i < residentsCount; i++) {
                    prepareDataPromises.push((async (admin) => {
                        const phone = createTestPhone()
                        const userClient = await makeClientWithResidentUser({}, { phone })
                        await createTestContact(admin, organization, property, {
                            unitName: unitName,
                            unitType: unitType,
                            isVerified: true,
                            phone: phone,
                        })
                        await createTestResident(admin, userClient.user, property, {
                            unitName: unitName,
                            unitType: unitType,
                        })
                    })(admin))
                }
                await Promise.all(prepareDataPromises)

                const callId = faker.datatype.uuid()

                const [result] = await sendVoIPCallStartMessageByTestClient(serviceUser, {
                    app: { id: b2cApp.id },
                    addressKey: property.addressKey,
                    unitName: unitName,
                    unitType: unitType,
                    callData: { callId, b2cAppCallData: { B2CAppContext: '' } },
                })
                expect(result.verifiedContactsCount).toBe(residentsCount)
                expect(result.createdMessagesCount).toBe(residentsCount)
                expect(result.erroredMessagesCount).toBe(0)

                const cache = await getCallStatus({ b2cAppId: b2cApp.id, callId })
                expect(cache).not.toBe(null)
                expect(cache.status).toBe(CALL_STATUS_START_SENT)
            })

            test('Saves User.id to Message.id binding', async () => {
                const unitName = faker.random.alphaNumeric(3)
                const unitType = FLAT_UNIT_TYPE

                const residentsCount = 3
                const prepareDataPromises = []
                const userIds = []

                for (let i = 0; i < residentsCount; i++) {
                    prepareDataPromises.push((async (admin) => {
                        const phone = createTestPhone()
                        const userClient = await makeClientWithResidentUser({}, { phone })
                        userIds.push(userClient.user.id)
                        await createTestContact(admin, organization, property, {
                            unitName: unitName,
                            unitType: unitType,
                            isVerified: true,
                            phone: phone,
                        })
                        await createTestResident(admin, userClient.user, property, {
                            unitName: unitName,
                            unitType: unitType,
                        })
                    })(admin))
                }
                await Promise.all(prepareDataPromises)

                const callId = faker.datatype.uuid()

                const [result] = await sendVoIPCallStartMessageByTestClient(serviceUser, {
                    app: { id: b2cApp.id },
                    addressKey: property.addressKey,
                    unitName: unitName,
                    unitType: unitType,
                    callData: { callId, b2cAppCallData: { B2CAppContext: '' } },
                })
                expect(result.verifiedContactsCount).toBe(residentsCount)
                expect(result.createdMessagesCount).toBe(residentsCount)
                expect(result.erroredMessagesCount).toBe(0)

                const createdMessages = await Message.getAll(admin, {
                    user: { id_in: userIds },
                    type: VOIP_INCOMING_CALL_MESSAGE_TYPE,
                }, { first: residentsCount })
                expect(createdMessages).toHaveLength(residentsCount)
                const expectedUserIdToMessageId = Object.fromEntries(createdMessages.map(message => ([message.user.id, message.id])))

                const cache = await getCallStatus({ b2cAppId: b2cApp.id, callId })
                expect(cache).not.toBe(null)
                expect(cache.startingMessagesIdsByUserIds).toEqual(expectedUserIdToMessageId)
            })

            test('Does not save status if have no users to send push', async () => {
                const unitName = faker.random.alphaNumeric(3)
                await createTestContact(admin, organization, property, {
                    unitName: unitName,
                    unitType: FLAT_UNIT_TYPE,
                    isVerified: true,
                })
                const callId = faker.datatype.uuid()
                const [result] = await sendVoIPCallStartMessageByTestClient(serviceUser, {
                    app: { id: b2cApp.id },
                    addressKey: property.addressKey,
                    unitName: unitName,
                    unitType: FLAT_UNIT_TYPE,
                    callData: {
                        callId: callId,
                        b2cAppCallData: { B2CAppContext: '' },
                    },
                })
                expect(result.verifiedContactsCount).toBe(1)
                expect(result.createdMessagesCount).toBe(0)
                expect(result.erroredMessagesCount).toBe(0)

                const cache = await getCallStatus({ b2cAppId: b2cApp.id, callId })
                expect(cache).toBe(null)
            })
        })

        describe('voipType priority', () => {
            let customVoIPTypeField

            beforeAll(async () => {
                [customVoIPTypeField] = await createTestCustomField(admin, { 
                    name: 'voipType',
                    modelName: 'Contact',
                    type: 'String',
                    validationRules: null,
                    isVisible: false,
                    priority: 0,
                    isUniquePerObject: true,
                    staffCanRead: false,
                    sender: { dv: 1, fingerprint: faker.random.alphaNumeric(8) },
                })
            })
        
            test('complex case with everything', async () => {
                const serviceUser = await makeClientWithServiceUser()
                const [b2cApp] = await createTestB2CApp(admin)
                const { organization, property } = await makeClientWithResidentAccessAndProperty()
                await createTestB2CAppProperty(admin, b2cApp, { address: property.address, addressMeta: property.addressMeta })
                const [accessRightSet] = await createTestB2CAppAccessRightSet(admin, b2cApp, { canExecuteSendVoIPCallStartMessage: true })
                await createTestB2CAppAccessRight(admin, serviceUser.user, b2cApp, { accessRightSet: { connect: { id: accessRightSet.id } } })

        
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
        
                const normalVoIPType = 'sip'
                const resident1VoIPType = 'variant2'
                const resident2VoIPType = 'variant3'
                const resident3VoIPType = B2C_APP_VOIP_TYPE
        
                const customVoIPTypesWithActors = [
                    [resident1VoIPType, actors[0]],
                    [resident2VoIPType, actors[1]],
                    [resident3VoIPType, actors[2]],
                ]
                        
                for (const [customVoIPType, actor] of customVoIPTypesWithActors) {
                    await createTestCustomValue(serviceUser, customVoIPTypeField, organization, {
                        sourceType: 'B2BApp',
                        data: customVoIPType,
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
                            { dtmfCommand: faker.random.alphaNumeric(2), name: faker.random.alphaNumeric(3) },
                            { dtmfCommand: faker.random.alphaNumeric(2), name: faker.random.alphaNumeric(3) },
                        ],
                        stunServers: [faker.internet.ip(), faker.internet.ip()],
                        codec: 'vp8',
                    },
                }
        
                const [result] = await sendVoIPCallStartMessageByTestClient(serviceUser, {
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
                    voipDtfmCommand: dataAttrs.nativeCallData.voipPanels[0].dtmfCommand,
                    voipPanels: dataAttrs.nativeCallData.voipPanels,
                    stun: dataAttrs.nativeCallData.stunServers[0],
                    stunServers: dataAttrs.nativeCallData.stunServers,
                    codec: dataAttrs.nativeCallData.codec,
                }
        
                const normalVoIPTypeMessages = createdMessages.filter(msg => msg.meta.data.voipType === normalVoIPType)
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
        
                const resident1VoIPTypeMessages = createdMessages.filter(msg => msg.meta.data.voipType === resident1VoIPType)
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
        
                const resident2VoIPTypeMessages = createdMessages.filter(msg => msg.meta.data.voipType === resident2VoIPType)
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
        
            test('uses native call voipType when CustomValue is absent', async () => {
                const unitName = faker.random.alphaNumeric(3)
                const unitType = FLAT_UNIT_TYPE
                const actor = await prepareSingleActor({ admin, organization, property, unitName, unitType })
        
                const callData = {
                    callId: faker.datatype.uuid(),
                    b2cAppCallData: { B2CAppContext: faker.random.alphaNumeric(10) },
                    nativeCallData: {
                        voipAddress: faker.internet.ip(),
                        voipLogin: faker.internet.userName(),
                        voipPassword: faker.internet.password(),
                        voipPanels: [{ dtmfCommand: faker.random.alphaNumeric(2), name: faker.random.alphaNumeric(3) }],
                        stunServers: [faker.internet.ip()],
                        codec: 'vp8',
                    },
                }
        
                const [result] = await sendVoIPCallStartMessageByTestClient(serviceUser, {
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
                            voipType: NATIVE_VOIP_TYPE,
                            voipAddress: callData.nativeCallData.voipAddress,
                        }),
                    }),
                }))
                expect(createdMessage.meta.data.B2CAppContext).toBeUndefined()
            })
        
        })

        test('applies values from CustomFields with names equals to native voip push keys starting with "voip"', async () => {
            const [b2cApp] = await createTestB2CApp(admin)
            const { organization, property } = await makeClientWithResidentAccessAndProperty()
            await createTestB2CAppProperty(admin, b2cApp, { address: property.address, addressMeta: property.addressMeta })
            const unitName = faker.random.alphaNumeric(3)

            const serviceUser = await makeClientWithServiceUser()
            const [b2bApp] = await createTestB2BApp(admin)
            await createTestB2BAppContext(admin, b2bApp, organization, { status: 'Finished' })
            const [b2bAppAccessRightSet] = await createTestB2BAppAccessRightSet(admin, b2bApp, { canReadOrganizations: true, canReadCustomValues: true, canManageCustomValues: true })
            await createTestB2BAppAccessRight(admin, serviceUser.user, b2bApp, b2bAppAccessRightSet)

            const [b2cRightSet] = await createTestB2CAppAccessRightSet(admin, b2cApp, { canExecuteSendVoIPCallStartMessage: true })
            await createTestB2CAppAccessRight(admin, serviceUser.user, b2cApp, { accessRightSet: { connect: { id: b2cRightSet.id } } })


            const actor = await prepareSingleActor({ admin, organization, property, unitName, unitType: FLAT_UNIT_TYPE })


            const customValue = faker.random.alphaNumeric(8)
            const customFieldNames = ['voipAddress', 'voipPassword', 'voipDtfmCommand', 'voipPanels']
            for (const fieldName of customFieldNames) {
                const [customField] = await createTestCustomField(admin, { 
                    name: fieldName,
                    modelName: 'Contact',
                    type: 'String',
                    validationRules: null,
                    isVisible: false,
                    priority: 0,
                    isUniquePerObject: true,
                    staffCanRead: false,
                    sender: { dv: 1, fingerprint: faker.random.alphaNumeric(8) },
                })
                await createTestCustomValue(serviceUser, customField, organization, {
                    sourceType: 'B2BApp',
                    data: customValue,
                    itemId: actor.contact.id,
                    sourceId: b2bApp.id,
                    isUniquePerObject: true,
                })
            }
            const callId = faker.datatype.uuid()
            const [result] = await sendVoIPCallStartMessageByTestClient(serviceUser, {
                app: { id: b2cApp.id },
                addressKey: property.addressKey,
                unitName: unitName,
                unitType: FLAT_UNIT_TYPE,
                callData: {
                    callId: callId,
                    nativeCallData: {
                        voipAddress: faker.internet.ip(),
                        voipLogin: faker.internet.userName(),
                        voipPassword: faker.internet.password(),
                        voipPanels: [{ dtmfCommand: faker.random.alphaNumeric(2), name: faker.random.alphaNumeric(3) }],
                        stunServers: [faker.internet.ip()],
                        codec: 'vp8',
                    },
                },
            })
            expect(result.verifiedContactsCount).toBe(1)
            expect(result.createdMessagesCount).toBe(1)
            expect(result.erroredMessagesCount).toBe(0)
            
            const [createdMessage] = await Message.getAll(admin, { type: VOIP_INCOMING_CALL_MESSAGE_TYPE, user: { id: actor.user.id } })
            
            expect(createdMessage.meta.data).toEqual(expect.objectContaining(
                Object.fromEntries(customFieldNames.map(fieldName => ([fieldName, customValue])))
            ))
        })
    })
})