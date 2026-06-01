jest.mock('@open-condo/config', () => {
    const actual = jest.requireActual('@open-condo/config')
    const VOIP_CALL_STATUS_JWT_SECRET = jest.requireActual('@open-condo/miniapp-utils/helpers/uuid').generateUUIDv4()
    return new Proxy(actual, {
        set: () => {},
        get: (target, p) => {
            if (p === 'VOIP_CALL_STATUS_JWT_SECRET') {
                return VOIP_CALL_STATUS_JWT_SECRET
            }
            return target[p]
        },
    })
})

const index = require('@app/condo')
const { faker } = require('@faker-js/faker')

const {
    makeLoggedInAdminClient,
    makeClient,
    expectToThrowGQLErrorToResult,
    setFakeClientMode,
} = require('@open-condo/keystone/test.utils')

const { CALL_NOT_FOUND_ERROR } = require('@condo/domains/miniapp/constants')
const {
    createTestB2CApp,
    sendVoIPCallStartMessageByTestClient,
    createTestB2CAppProperty,
    createTestB2CAppAccessRight,
    createTestB2CAppAccessRightSet,
    createTestAppMessageSetting,
    getVoIPCallStatusByTestClient,
    prepareVoIPUser,
} = require('@condo/domains/miniapp/utils/testSchema')
const { getCallStatus, MAX_CALL_ID_LENGTH, isCallStatusTokenEqual, buildCallStatusJWTToken, parseCallStatusJWTToken } = require('@condo/domains/miniapp/utils/voip')
const { VOIP_INCOMING_CALL_MESSAGE_TYPE } = require('@condo/domains/notification/constants/constants')
const { Message } = require('@condo/domains/notification/utils/testSchema')
const { FLAT_UNIT_TYPE } = require('@condo/domains/property/constants/common')
const { makeClientWithResidentAccessAndProperty } = require('@condo/domains/property/utils/testSchema')
const { makeClientWithServiceUser } = require('@condo/domains/user/utils/testSchema')

const { ERRORS } = require('./GetVoIPCallStatusService')


/**
 * @param {Parameters<typeof buildCallStatusJWTToken>[0]} data 
 * @returns 
 */
function buildQueryPayload (data) {
    const token = buildCallStatusJWTToken(data)
    if (!token) throw new Error('Invalid token data, check "buildQueryPayload"')
    return { token }
}


describe('GetVoIPCallStatusService spec', () => {
    setFakeClientMode(index)

    let admin
    
    beforeAll(async () => {
        admin = await makeLoggedInAdminClient()
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
                    await getVoIPCallStatusByTestClient(await makeClient(), buildQueryPayload({
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
            const [accessRightSet] = await createTestB2CAppAccessRightSet(admin, b2cApp, { canExecuteSendVoIPCallStartMessage: true, canExecuteSendVoIPCallCancelMessage: true })
            await createTestB2CAppAccessRight(admin, serviceUser.user, b2cApp, { accessRightSet: { connect: { id: accessRightSet.id } } })
            await createTestAppMessageSetting(admin, { b2cApp, numberOfNotificationInWindow: 1000, type: VOIP_INCOMING_CALL_MESSAGE_TYPE })
        })

        test(`Throws ${CALL_NOT_FOUND_ERROR} if call not found`, async () => {
            const unitName = faker.random.alphaNumeric(8)
            const unitType = FLAT_UNIT_TYPE
            const callId = faker.random.alphaNumeric(8)
            const { user } = await prepareVoIPUser({ admin, organization, property, unitName, unitType })
            await sendVoIPCallStartMessageByTestClient(admin, {
                app: { id: b2cApp.id },
                addressKey: property.addressKey,
                unitName,
                unitType,
                callData: {
                    callId,
                    b2cAppCallData: { B2CAppContext: '' },
                },
            })
            const [msg] = await Message.getAll(admin, { type: VOIP_INCOMING_CALL_MESSAGE_TYPE, user: { id: user.id } }, { sortBy: ['createdAt_DESC'], first: 1 })
            const callStatusJwtToken = JSON.parse(new URL(msg.meta.data.getVoIPCallStatusUrl).searchParams.get('data')).token
        
            const wrongCallId = faker.random.alphaNumeric(8)
            const parsedToken = parseCallStatusJWTToken(callStatusJwtToken)
            const wrongCallIdJwtToken = buildCallStatusJWTToken({ ...parsedToken, callId: wrongCallId })
        
        
            await expectToThrowGQLErrorToResult(async () => {
                await getVoIPCallStatusByTestClient(await makeClient(), {
                    token: wrongCallIdJwtToken,
                })
            }, ERRORS.CALL_NOT_FOUND) 
        
            const callStatus = await getCallStatus({ b2cAppId: b2cApp.id, organizationId: organization.id, addressKey: property.addressKey, callId: wrongCallId })
            expect(callStatus).toBeNull()
        })
        
        test(`Throws ${CALL_NOT_FOUND_ERROR} if call was found but token does not match`, async () => {
            const unitName = faker.random.alphaNumeric(8)
            const unitType = FLAT_UNIT_TYPE
            const callId = faker.random.alphaNumeric(8)
            const { user } = await prepareVoIPUser({ admin, organization, property, unitName, unitType })
            await sendVoIPCallStartMessageByTestClient(admin, {
                app: { id: b2cApp.id },
                addressKey: property.addressKey,
                unitName,
                unitType,
                callData: {
                    callId,
                    b2cAppCallData: { B2CAppContext: '' },
                },
            })
        
            const [msg] = await Message.getAll(admin, { type: VOIP_INCOMING_CALL_MESSAGE_TYPE, user: { id: user.id } }, { sortBy: ['createdAt_DESC'], first: 1 })
            const callStatusJwtToken = JSON.parse(new URL(msg.meta.data.getVoIPCallStatusUrl).searchParams.get('data')).token
        
            const wrongCallStatusToken = faker.random.alphaNumeric(8)
        
            const parsedToken = parseCallStatusJWTToken(callStatusJwtToken)
            const wrongCallStatusTokenJwtToken = buildCallStatusJWTToken({ ...parsedToken, callStatusToken: wrongCallStatusToken })
        
            await expectToThrowGQLErrorToResult(async () => {
                await getVoIPCallStatusByTestClient(await makeClient(), {
                    token: wrongCallStatusTokenJwtToken,
                })
            }, ERRORS.CALL_NOT_FOUND)
        
            const callStatus = await getCallStatus({ b2cAppId: b2cApp.id, organizationId: organization.id, addressKey: property.addressKey, callId })
            expect(callStatus).not.toBeNull()
            expect(isCallStatusTokenEqual({ callStatus, callStatusToken: wrongCallStatusToken })).toBe(false)
        })

    })

})