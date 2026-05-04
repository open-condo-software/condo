const { faker } = require('@faker-js/faker')

const {
    makeLoggedInAdminClient,
    makeClient,
    expectToThrowAccessDeniedErrorToResult,
    expectToThrowAuthenticationErrorToResult,
    expectToThrowGQLErrorToResult,
} = require('@open-condo/keystone/test.utils')

const { createTestContact, updateTestContact } = require('@condo/domains/contact/utils/testSchema')
const {
    createTestB2CApp,
    sendVoIPCallCancelMessageByTestClient,
    sendVoIPCallStartMessageByTestClient,
    createTestB2CAppProperty,
    createTestB2CAppAccessRight,
    createTestB2CAppAccessRightSet,
    updateTestB2CAppAccessRight,
    createTestAppMessageSetting,
} = require('@condo/domains/miniapp/utils/testSchema')
const { getCallStatus, CALL_STATUS_STARTED, MAX_CALL_ID_LENGTH, CALL_STATUS_ANSWERED, setCallStatus } = require('@condo/domains/miniapp/utils/voip')
const {
    VOIP_INCOMING_CALL_MESSAGE_TYPE,
    CANCELED_CALL_MESSAGE_PUSH_TYPE,
} = require('@condo/domains/notification/constants/constants')
const { FLAT_UNIT_TYPE } = require('@condo/domains/property/constants/common')
const { makeClientWithResidentAccessAndProperty } = require('@condo/domains/property/utils/testSchema')
const { createTestResident } = require('@condo/domains/resident/utils/testSchema')
const { makeClientWithSupportUser, makeClientWithNewRegisteredAndLoggedInUser,
    makeClientWithResidentUser, createTestPhone,
    makeClientWithServiceUser,
} = require('@condo/domains/user/utils/testSchema')

const { ERRORS } = require('./SendVoIPCallCancelMessageService')


async function prepareUser ({ admin, organization, property, unitName, unitType }) {
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

describe('SendVoIPCallCancelMessageService', () => {
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
                    const [rightSet] = await createTestB2CAppAccessRightSet(admin, b2cApp, { canExecuteSendVoIPCallCancelMessage: true })
                    await updateTestB2CAppAccessRight(admin, b2cAccessRight.id, { accessRightSet: { connect: { id: rightSet.id } } })
                    return serviceUser
                },
                expectError: null,
            },
        ]

        test.each(TEST_CASES)('$name', async ({ getClient, expectError }) => {
            const client = await getClient()
            const mutate = () => sendVoIPCallCancelMessageByTestClient(client, {
                app: { id: b2cApp.id },
                addressKey: property.addressKey,
                unitName: faker.random.alphaNumeric(3),
                unitType: FLAT_UNIT_TYPE,
                callData: {
                    callId: faker.datatype.uuid(),
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
                await sendVoIPCallCancelMessageByTestClient(admin, {
                    app: { id: faker.datatype.uuid() },
                    addressKey: faker.datatype.uuid(),
                    unitName: faker.random.alphaNumeric(3),
                    unitType: FLAT_UNIT_TYPE,
                    callData: {
                        callId: faker.datatype.uuid(),
                    },
                })
            }, ERRORS.PROPERTY_NOT_FOUND)
        })

        test('should throw error if no b2cappproperty with provided addressKey', async () => {
            const [b2cApp] = await createTestB2CApp(admin)

            await expectToThrowGQLErrorToResult(async () => {
                await sendVoIPCallCancelMessageByTestClient(admin, {
                    app: { id: b2cApp.id },
                    addressKey: faker.datatype.uuid(),
                    unitName: faker.random.alphaNumeric(3),
                    unitType: FLAT_UNIT_TYPE,
                    callData: {
                        callId: faker.datatype.uuid(),
                    },
                })
            }, ERRORS.PROPERTY_NOT_FOUND)
        })

        describe('should throw error if callId is invalid', () => {
            let b2cApp
            let addressKey
            let unitName
            let unitType
            let serviceUser

            beforeAll(async () => {
                const [testB2CApp] = await createTestB2CApp(admin)
                b2cApp = testB2CApp

                const { property: testProperty } = await makeClientWithResidentAccessAndProperty()
                addressKey = testProperty.addressKey
                await createTestB2CAppProperty(admin, b2cApp, { address: testProperty.address, addressMeta: testProperty.addressMeta })
                serviceUser = await makeClientWithServiceUser()
                const [rightSet] = await createTestB2CAppAccessRightSet(admin, b2cApp, { canExecuteSendVoIPCallCancelMessage: true })
                await createTestB2CAppAccessRight(admin, serviceUser.user, b2cApp, { accessRightSet: { connect: { id: rightSet.id } } })

                unitName = faker.random.alphaNumeric(3)
                unitType = FLAT_UNIT_TYPE
            })

            const TEST_CASES = [
                { name: 'empty', callId: '' },
                { name: 'invalid character 1', callId: '\u0000' },
                { name: 'invalid character 2', callId: '±' },
                { name: `exceeds maximum length of ${MAX_CALL_ID_LENGTH}`, callId: '1'.repeat(MAX_CALL_ID_LENGTH + 1) },
            ]

            test.each(TEST_CASES)('$name', async ({ callId }) => {
                await expectToThrowGQLErrorToResult(async () => {
                    await sendVoIPCallCancelMessageByTestClient(serviceUser, {
                        addressKey,
                        unitName,
                        unitType,
                        app: { id: b2cApp.id },
                        callData: {
                            callId,
                        },
                    })
                }, ERRORS.INVALID_CALL_ID)
            })
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
            const [accessRightSet] = await createTestB2CAppAccessRightSet(admin, b2cApp, { canExecuteSendVoIPCallCancelMessage: true, canExecuteSendVoIPCallStartMessage: true })
            await createTestB2CAppAccessRight(admin, serviceUser.user, b2cApp, { accessRightSet: { connect: { id: accessRightSet.id } } })

            await createTestAppMessageSetting(admin, { b2cApp, numberOfNotificationInWindow: 1000, type: VOIP_INCOMING_CALL_MESSAGE_TYPE })
            await createTestAppMessageSetting(admin, { b2cApp, numberOfNotificationInWindow: 1000, type: CANCELED_CALL_MESSAGE_PUSH_TYPE })
        })

        test('successfully sends VoIP cancel message when all conditions are met', async () => {
            const unitName = faker.random.alphaNumeric(3)
            const unitType = FLAT_UNIT_TYPE
            const callId = faker.random.alphaNumeric(8)
            
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
            
            const [startResult] = await sendVoIPCallStartMessageByTestClient(serviceUser, {
                app: { id: b2cApp.id },
                addressKey: property.addressKey,
                unitName: unitName,
                unitType: unitType,
                callData: {
                    callId,
                    b2cAppCallData: { B2CAppContext: '' },
                },
            })

            expect(startResult.verifiedContactsCount).toBe(verifiedContactsCount)
            expect(startResult.createdMessagesCount).toBe(verifiedResidentsCount)
            expect(startResult.erroredMessagesCount).toBe(0)

            const [cancelResult] = await sendVoIPCallCancelMessageByTestClient(serviceUser, {
                app: { id: b2cApp.id },
                addressKey: property.addressKey,
                unitName: unitName,
                unitType: unitType,
                callData: {
                    callId,
                },
            })

            expect(cancelResult.verifiedContactsCount).toBe(verifiedContactsCount)
            expect(cancelResult.createdMessagesCount).toBe(verifiedResidentsCount)
            expect(cancelResult.erroredMessagesCount).toBe(0)
        })

        test('returns zeroish stats when no verified contacts found on unit', async () => {
            const unitName = faker.random.alphaNumeric(3)
            const unitType = FLAT_UNIT_TYPE
            const callId = faker.datatype.uuid()

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

            await sendVoIPCallStartMessageByTestClient(serviceUser, {
                app: { id: b2cApp.id },
                addressKey: property.addressKey,
                unitName: unitName,
                unitType: unitType,
                callData: {
                    callId,
                    b2cAppCallData: { B2CAppContext: '' },
                },
            })

            const [result] = await sendVoIPCallCancelMessageByTestClient(serviceUser, {
                app: { id: b2cApp.id },
                addressKey: property.addressKey,
                unitName: unitName,
                unitType: unitType,
                callData: {
                    callId,
                },
            })

            expect(result.verifiedContactsCount).toBe(0)
            expect(result.createdMessagesCount).toBe(0)
            expect(result.erroredMessagesCount).toBe(0)
        })

        test('returns zero message attempts when no residents found for verified contacts', async () => {
            const unitName = faker.random.alphaNumeric(3)
            const unitType = FLAT_UNIT_TYPE
            const callId = faker.datatype.uuid()

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

            await sendVoIPCallStartMessageByTestClient(serviceUser, {
                app: { id: b2cApp.id },
                addressKey: property.addressKey,
                unitName: unitName,
                unitType: unitType,
                callData: {
                    callId,
                    b2cAppCallData: { B2CAppContext: '' },
                },
            })

            const [result] = await sendVoIPCallCancelMessageByTestClient(serviceUser, {
                app: { id: b2cApp.id },
                addressKey: property.addressKey,
                unitName: unitName,
                unitType: unitType,
                callData: {
                    callId,
                },
            })

            expect(result.verifiedContactsCount).toBe(1)
            expect(result.createdMessagesCount).toBe(0)
            expect(result.erroredMessagesCount).toBe(0)
        })

        test('Does not send message if has no callStatus in status "started" in cache', async () => {
            const unitName = faker.random.alphaNumeric(3)
            const unitType = FLAT_UNIT_TYPE

            await prepareUser({ admin, organization, property, unitName, unitType })

            const callId = faker.datatype.uuid()
            let cache

            await sendVoIPCallStartMessageByTestClient(serviceUser, {
                app: { id: b2cApp.id },
                addressKey: property.addressKey,
                unitName: unitName,
                unitType: FLAT_UNIT_TYPE,
                callData: {
                    callId,
                    b2cAppCallData: { B2CAppContext: '' },
                },
            })

            cache = await getCallStatus({ organizationId: organization.id, propertyId: property.id, b2cAppId: b2cApp.id, callId })
            expect(cache).not.toBe(null)

            await setCallStatus({ ...cache, organizationId: organization.id, propertyId: property.id, b2cAppId: b2cApp.id, callId, status: CALL_STATUS_ANSWERED })

            const [result] = await sendVoIPCallCancelMessageByTestClient(serviceUser, {
                app: { id: b2cApp.id },
                addressKey: property.addressKey,
                unitName: unitName,
                unitType: FLAT_UNIT_TYPE,
                callData: {
                    callId,
                },
            })
            expect(result.verifiedContactsCount).toBe(1)
            expect(result.createdMessagesCount).toBe(0)
            expect(result.erroredMessagesCount).toBe(1)

            cache = await getCallStatus({ organizationId: organization.id, propertyId: property.id, b2cAppId: b2cApp.id, callId })
        })

        describe('Cache', () => {
            test('Updates call status in cache', async () => {
                const unitName = faker.random.alphaNumeric(3)
                const unitType = FLAT_UNIT_TYPE

                const residentsCount = 3
                const prepareDataPromises = []
                const preparedUsers = []

                for (let i = 0; i < residentsCount; i++) {
                    prepareDataPromises.push((async ({ admin, organization, property, unitName, unitType }) => {
                        const preparedUser = await prepareUser({ admin, organization, property, unitName, unitType })
                        preparedUsers.push(preparedUser)
                    })({ admin, organization, property, unitName, unitType }))
                }
                await Promise.all(prepareDataPromises)

                const callId = faker.datatype.uuid()
                let cache

                await sendVoIPCallStartMessageByTestClient(serviceUser, {
                    app: { id: b2cApp.id },
                    addressKey: property.addressKey,
                    unitName: unitName,
                    unitType: unitType,
                    callData: { callId, b2cAppCallData: { B2CAppContext: '' } },
                })

                cache = await getCallStatus({ organizationId: organization.id, propertyId: property.id, b2cAppId: b2cApp.id, callId })
                expect(cache).not.toBe(null)
                expect(cache.status).toBe(CALL_STATUS_STARTED)

                const [result] = await sendVoIPCallCancelMessageByTestClient(serviceUser, {
                    app: { id: b2cApp.id },
                    addressKey: property.addressKey,
                    unitName: unitName,
                    unitType: unitType,
                    callData: { callId },
                })
                expect(result.verifiedContactsCount).toBe(residentsCount)
                expect(result.createdMessagesCount).toBe(residentsCount)
                expect(result.erroredMessagesCount).toBe(0)

                cache = await getCallStatus({ organizationId: organization.id, propertyId: property.id, b2cAppId: b2cApp.id, callId })
                expect(cache).not.toBe(null)
                expect(cache.status).toBe(CALL_STATUS_ANSWERED)
            })

            test('Does not update status if have no users to send push', async () => {
                const unitName = faker.random.alphaNumeric(3)
                const unitType = FLAT_UNIT_TYPE

                const { contact } = await prepareUser({ admin, organization, property, unitName, unitType })

                const callId = faker.datatype.uuid()
                let cache

                const [r] = await sendVoIPCallStartMessageByTestClient(serviceUser, {
                    app: { id: b2cApp.id },
                    addressKey: property.addressKey,
                    unitName: unitName,
                    unitType: FLAT_UNIT_TYPE,
                    callData: {
                        callId,
                        b2cAppCallData: { B2CAppContext: '' },
                    },
                })

                cache = await getCallStatus({ organizationId: organization.id, propertyId: property.id, b2cAppId: b2cApp.id, callId })
                expect(cache).not.toBe(null)

                await updateTestContact(admin, contact.id, { deletedAt: new Date().toISOString() })

                const [result] = await sendVoIPCallCancelMessageByTestClient(serviceUser, {
                    app: { id: b2cApp.id },
                    addressKey: property.addressKey,
                    unitName: unitName,
                    unitType: FLAT_UNIT_TYPE,
                    callData: {
                        callId,
                    },
                })
                expect(result.verifiedContactsCount).toBe(0)
                expect(result.createdMessagesCount).toBe(0)
                expect(result.erroredMessagesCount).toBe(0)

                cache = await getCallStatus({ organizationId: organization.id, propertyId: property.id, b2cAppId: b2cApp.id, callId })
                expect(cache).toEqual(expect.objectContaining(cache))
            })

        })

    })

})