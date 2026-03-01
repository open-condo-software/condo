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
const {
    createTestB2CApp,
    sendVoIPStartMessageByTestClient,
    createTestB2CAppProperty,
} = require('@condo/domains/miniapp/utils/testSchema')
const { getCallStatus, CALL_STATUS_START_SENT } = require('@condo/domains/miniapp/utils/voip')
const {
    VOIP_INCOMING_CALL_MESSAGE_TYPE,
} = require('@condo/domains/notification/constants/constants')
const { Message } = require('@condo/domains/notification/utils/testSchema')
const { FLAT_UNIT_TYPE, APARTMENT_UNIT_TYPE, UNIT_TYPES } = require('@condo/domains/property/constants/common')
const { makeClientWithResidentAccessAndProperty } = require('@condo/domains/property/utils/testSchema')
const { createTestResident } = require('@condo/domains/resident/utils/testSchema')
const { makeClientWithSupportUser, makeClientWithNewRegisteredAndLoggedInUser,
    makeClientWithResidentUser, createTestPhone,
} = require('@condo/domains/user/utils/testSchema')

const { ERRORS } = require('./SendVoIPStartMessageService')

describe('SendVoIPStartMessageService', () => {
    let admin

    beforeAll(async () => {
        admin = await makeLoggedInAdminClient()
    })

    describe('Access', () => {
        let b2cApp
        let property

        beforeAll(async () => {
            const [testB2CApp] = await createTestB2CApp(admin)
            b2cApp = testB2CApp

            const { property: testProperty } = await makeClientWithResidentAccessAndProperty()
            property = testProperty
            await createTestB2CAppProperty(admin, b2cApp, { address: testProperty.address, addressMeta: testProperty.addressMeta })
        })

        const TEST_CASES = [
            { name: 'admin can', getClient: () => admin, expectError: null },
            { name: 'support can\'t', getClient: () => makeClientWithSupportUser(), expectError: expectToThrowAccessDeniedErrorToResult },
            { name: 'user can\'t', getClient: () => makeClientWithNewRegisteredAndLoggedInUser(), expectError: expectToThrowAccessDeniedErrorToResult },
            { name: 'anonymous can\'t', getClient: () => makeClient(), expectError: expectToThrowAuthenticationErrorToResult },
            // TODO(YEgorLu): Add b2c service user with / without access right set tests after adding it to accesses
        ]

        test.each(TEST_CASES)('$name', async ({ getClient, expectError }) => {
            const client = await getClient()
            const mutate = () => sendVoIPStartMessageByTestClient(client, {
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
                await sendVoIPStartMessageByTestClient(admin, {
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
                await sendVoIPStartMessageByTestClient(admin, {
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
                await sendVoIPStartMessageByTestClient(admin, {
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
        test('successfully sends VoIP start message when all conditions are met', async () => {
            const [b2cApp] = await createTestB2CApp(admin)
            const { organization, property } = await makeClientWithResidentAccessAndProperty()
            await createTestB2CAppProperty(admin, b2cApp, { address: property.address, addressMeta: property.addressMeta })

            const unitName = faker.random.alphaNumeric(3)
            const unitType = FLAT_UNIT_TYPE
            
            const verifiedContactsCount = 5
            const verifiedResidentsCount = 3
            const notVerifiedResidentsCount = verifiedContactsCount - verifiedResidentsCount
            
            const prepareDataPromises = []

            for (let i = 0; i < verifiedContactsCount; i++) {
                prepareDataPromises.push((async (admin) => {
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
                })(admin))
            }
            for (let i = 0; i < notVerifiedResidentsCount; i++) {
                prepareDataPromises.push((async (admin) => {
                    const userClient = await makeClientWithResidentUser()
                    await createTestResident(admin, userClient.user, property, {
                        unitName: unitName,
                        unitType: unitType,
                    })
                })(admin))
            }
            await Promise.all(prepareDataPromises)
            
            const [result] = await sendVoIPStartMessageByTestClient(admin, {
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
        
        // NOTE(YEgorLu): in case someone changes notification constants for message type
        test('created messages do not exclude provided data', async () => {
            const [b2cApp] = await createTestB2CApp(admin)
            const { organization, property } = await makeClientWithResidentAccessAndProperty()
            await createTestB2CAppProperty(admin, b2cApp, { address: property.address, addressMeta: property.addressMeta })

            const unitName = faker.random.alphaNumeric(3)
            const unitType = FLAT_UNIT_TYPE
            
            const residentsCount = 3
            const prepareDataPromises = []
            const userIds = []
            const residentsIds = []

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
                    const [resident] = await createTestResident(admin, userClient.user, property, {
                        unitName: unitName,
                        unitType: unitType,
                    })
                    residentsIds.push(resident.id)
                })(admin))
            }
            await Promise.all(prepareDataPromises)

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
                user: { id_in: userIds },
                type: VOIP_INCOMING_CALL_MESSAGE_TYPE,
            }, { first: residentsCount })
            
            expect(createdMessages).toHaveLength(residentsCount)
            expect([...new Set(createdMessages.map(msg => msg.user))]).toHaveLength(residentsCount)
            expect(createdMessages).toEqual(
                expect.arrayContaining(residentsIds.map(residentId => {
                    return expect.objectContaining({
                        meta: expect.objectContaining({
                            data: expect.objectContaining({
                                B2CAppId: b2cApp.id,
                                B2CAppContext: dataAttrs.b2cAppCallData.B2CAppContext,
                                B2CAppName: b2cApp.name,
                                residentId: residentId,
                                callId: dataAttrs.callId,
                                voipType: 'sip',
                                voipAddress: dataAttrs.nativeCallData.voipAddress,
                                voipLogin: dataAttrs.nativeCallData.voipLogin,
                                voipPassword: dataAttrs.nativeCallData.voipPassword,
                                voipDtfmCommand: dataAttrs.nativeCallData.voipPanels[0].dtfmCommand,
                                //voipPanels: dataAttrs.voipPanels, needs to be added in notification constants
                                stun: dataAttrs.nativeCallData.stunServers[0],
                                //stunServers: dataAttrs.nativeCallData.stunServers,
                                codec: dataAttrs.nativeCallData.codec,
                            }),
                        }),
                    })
                }))
            )
        })

        test('returns zeroish stats when no verified contacts found on unit', async () => {
            const [b2cApp] = await createTestB2CApp(admin)
            const { organization, property } = await makeClientWithResidentAccessAndProperty()
            await createTestB2CAppProperty(admin, b2cApp, { address: property.address, addressMeta: property.addressMeta })

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

            const [result] = await sendVoIPStartMessageByTestClient(admin, {
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
            const [b2cApp] = await createTestB2CApp(admin)
            const { organization, property } = await makeClientWithResidentAccessAndProperty()
            await createTestB2CAppProperty(admin, b2cApp, { address: property.address, addressMeta: property.addressMeta })

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

            const [result] = await sendVoIPStartMessageByTestClient(admin, {
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
        
        const ALLOWED_UNIT_TYPES = [FLAT_UNIT_TYPE, APARTMENT_UNIT_TYPE]

        test(`Includes only ${ALLOWED_UNIT_TYPES.join(' / ')} units`, async () => {
            const [b2cApp] = await createTestB2CApp(admin)
            const { organization, property } = await makeClientWithResidentAccessAndProperty()
            await createTestB2CAppProperty(admin, b2cApp, { address: property.address, addressMeta: property.addressMeta })

            const unitName = faker.random.alphaNumeric(3)
            
            for (const possibleUnitType of UNIT_TYPES) {
                await createTestContact(admin, organization, property, {
                    unitName: unitName,
                    unitType: possibleUnitType,
                    isVerified: true,
                })
            }

            const mutate = (unitType) => sendVoIPStartMessageByTestClient(admin, {
                app: { id: b2cApp.id },
                addressKey: property.addressKey,
                unitName: unitName,
                unitType: unitType,
                callData: {
                    callId: faker.datatype.uuid(),
                    b2cAppCallData: { B2CAppContext: '' },
                },
            })

            for (const allowedUnitType of ALLOWED_UNIT_TYPES) {
                const [result] = await mutate(allowedUnitType)
                expect(result.verifiedContactsCount).toBe(1)
                expect(result.createdMessagesCount).toBe(0)
                expect(result.erroredMessagesCount).toBe(0)
            }

            const forbiddenUnitTypes = UNIT_TYPES.filter(unitType => !ALLOWED_UNIT_TYPES.includes(unitType))
            expect(forbiddenUnitTypes).toHaveLength(3)

            for (const forbiddenUnitType of forbiddenUnitTypes) {
                await expectToThrowGraphQLRequestError(
                    async () => await mutate(forbiddenUnitType),
                    `Variable "$data" got invalid value "${forbiddenUnitType}" at "data.unitType"; Value "${forbiddenUnitType}" does not exist in "AllowedVoIPMessageUnitType" enum.`
                )
            }
        })

        describe('Cache', () => {
            test('Saves call status in cache', async () => {
                const [b2cApp] = await createTestB2CApp(admin)
                const { organization, property } = await makeClientWithResidentAccessAndProperty()
                await createTestB2CAppProperty(admin, b2cApp, { address: property.address, addressMeta: property.addressMeta })

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

                const [result] = await sendVoIPStartMessageByTestClient(admin, {
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
                const [b2cApp] = await createTestB2CApp(admin)
                const { organization, property } = await makeClientWithResidentAccessAndProperty()
                await createTestB2CAppProperty(admin, b2cApp, { address: property.address, addressMeta: property.addressMeta })

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

                const [result] = await sendVoIPStartMessageByTestClient(admin, {
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
                const [b2cApp] = await createTestB2CApp(admin)
                const { organization, property } = await makeClientWithResidentAccessAndProperty()
                await createTestB2CAppProperty(admin, b2cApp, { address: property.address, addressMeta: property.addressMeta })
                const unitName = faker.random.alphaNumeric(3)
                await createTestContact(admin, organization, property, {
                    unitName: unitName,
                    unitType: FLAT_UNIT_TYPE,
                    isVerified: true,
                })
                const callId = faker.datatype.uuid()
                const [result] = await sendVoIPStartMessageByTestClient(admin, {
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
    })
})