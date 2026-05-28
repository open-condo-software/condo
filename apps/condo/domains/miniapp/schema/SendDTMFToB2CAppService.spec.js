require('@condo/domains/common/utils/testSchema/env').mockEnv({
    VOIP_CALL_STATUS_JWT_SECRET: jest.requireActual('@open-condo/miniapp-utils/helpers/uuid').generateUUIDv4(),
})

const index = require('@app/condo')
const { faker } = require('@faker-js/faker')

const { setFakeClientMode, expectToThrowGQLErrorToResult, makeClient, makeLoggedInAdminClient } = require('@open-condo/keystone/test.utils')

const { sendDTMFToB2CAppByTestClient, createTestB2CApp, makeStartCallRequest, createTestB2CAppProperty, createTestB2CAppAccessRightSet, createTestB2CAppAccessRight, createTestAppMessageSetting, prepareVoIPUser } = require('@condo/domains/miniapp/utils/testSchema')
const { MAX_CALL_ID_LENGTH, buildCallStatusJWTToken, parseCallStatusJWTToken } = require('@condo/domains/miniapp/utils/voip')
const { VOIP_INCOMING_CALL_MESSAGE_TYPE } = require('@condo/domains/notification/constants/constants')
const { makeClientWithResidentAccessAndProperty } = require('@condo/domains/property/utils/testSchema')
const { makeClientWithServiceUser } = require('@condo/domains/user/utils/testSchema')

const { ERRORS } = require('./SendDTMFToB2CAppService')


/**
 * @param {Parameters<typeof buildCallStatusJWTToken>[0]} data 
 * @returns 
 */
function buildQueryPayload (data) {
    const token = buildCallStatusJWTToken(data)
    if (!token) throw new Error('Invalid token data, check "buildQueryPayload"')
    return { token }
}

describe('SendDTMFToB2CAppService spec', () => {
    setFakeClientMode(index)

    let admin
    
    beforeAll(async () => {
        admin = await makeLoggedInAdminClient()
    })

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
        const [accessRightSet] = await createTestB2CAppAccessRightSet(admin, b2cApp, { canExecuteSendVoIPCallStartMessage: true, canExecuteSendVoIPCallCancelMessage: true })
        await createTestB2CAppAccessRight(admin, serviceUser.user, b2cApp, { accessRightSet: { connect: { id: accessRightSet.id } } })
        await createTestAppMessageSetting(admin, { b2cApp, numberOfNotificationInWindow: 1000, type: VOIP_INCOMING_CALL_MESSAGE_TYPE })
    })

    describe('Validation', () => {
        describe('should throw error if callId is invalid', () => {
            let b2cApp
            let property
            let organization

            beforeAll(async () => {
                const [testB2CApp] = await createTestB2CApp(admin)
                b2cApp = testB2CApp

                const { organization: testOrganization, property: testProperty } = await makeClientWithResidentAccessAndProperty()
                property = testProperty
                organization = testOrganization
            })

            const TEST_CASES = [
                { name: 'empty', callId: '' },
                { name: 'invalid character 1', callId: '\u0000' },
                { name: 'invalid character 2', callId: '±' },
                { name: `exceeds maximum length of ${MAX_CALL_ID_LENGTH}`, callId: '1'.repeat(MAX_CALL_ID_LENGTH + 1) },
            ]

            test.each(TEST_CASES)('$name', async ({ callId }) => {
                await expectToThrowGQLErrorToResult(async () => {
                    await sendDTMFToB2CAppByTestClient(await makeClient(), buildQueryPayload({
                        addressKey: property.addressKey,
                        organizationId: organization.id,
                        b2cAppId: b2cApp.id,
                        callId,
                        callStatusToken: faker.random.alphaNumeric(8),
                    }))
                }, ERRORS.INVALID_CALL_ID)
            })
        })
    })

    describe('Errors', () => {
        let receiver

        beforeAll(async () => {
            receiver = await prepareVoIPUser({ admin, organization, property })
        })

        const ERROR_CASES = [
            {
                name: 'throws error if call not found',
                updateJWTToken: (jwtTokenParsed) => ({ ...jwtTokenParsed, callId: faker.random.alphaNumeric(8) }),
                expected: ERRORS.CALL_NOT_FOUND,
            },
        ]

        test.each(ERROR_CASES)('$name', async ({ updateJWTToken, expected }) => {
            const client = await makeClient()
            console.error('PROPERTY 1', property)
            const { callStatusJWTToken } = await makeStartCallRequest({ admin, serviceUserClient: serviceUser, b2cAppId: b2cApp.id, resident: receiver.resident, property })

            const callStatusJWTTokenParsed = parseCallStatusJWTToken(callStatusJWTToken)
            const callStatusJWTTokenFinal = updateJWTToken ? updateJWTToken(callStatusJWTTokenParsed) : callStatusJWTTokenParsed
        
            const attrs = {
                token: buildCallStatusJWTToken(callStatusJWTTokenFinal),
                data: {
                    dtmfCode: faker.random.alphaNumeric(4),
                },
            }
        
            await expectToThrowGQLErrorToResult(async () => {
                await sendDTMFToB2CAppByTestClient(client, attrs)
            }, expected)
        })

    })

}) 