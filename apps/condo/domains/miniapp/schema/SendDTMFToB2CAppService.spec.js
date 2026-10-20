require('@condo/domains/common/utils/testSchema/env').mockEnv({
    VOIP_CALL_STATUS_JWT_SECRET: jest.requireActual('@open-condo/miniapp-utils/helpers/uuid').generateUUIDv4(),
})

const index = require('@app/condo')
const { faker } = require('@faker-js/faker')

const { setFakeClientMode, expectToThrowGQLErrorToResult, makeClient, makeLoggedInAdminClient } = require('@open-condo/keystone/test.utils')

const { sendDTMFToB2CAppByTestClient, createTestB2CApp, makeStartCallRequest, createTestB2CAppProperty, createTestB2CAppAccessRightSet, createTestB2CAppAccessRight, createTestAppMessageSetting, prepareVoIPUser } = require('@condo/domains/miniapp/utils/testSchema')
const { buildCallStatusToken, generateCallStatusId } = require('@condo/domains/miniapp/utils/voip')
const { VOIP_INCOMING_CALL_MESSAGE_TYPE } = require('@condo/domains/notification/constants/constants')
const { makeClientWithResidentAccessAndProperty } = require('@condo/domains/property/utils/testSchema')
const { makeClientWithServiceUser } = require('@condo/domains/user/utils/testSchema')

const { ERRORS } = require('./SendDTMFToB2CAppService')


/**
 * @param {Parameters<typeof buildCallStatusToken>[0]} id
 * @returns 
 */
function buildQueryPayload (id) {
    const token = buildCallStatusToken(id)
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
        describe('should throw error if token is invalid', () => {
            const TEST_CASES = [
                { name: 'empty', token: '' },
                { name: 'invalid character', token: '\u0000' },
                { name: 'unsigned ID', token: generateCallStatusId() },
                { name: 'too long', token: '1'.repeat(1000) },
            ]

            test.each(TEST_CASES)('$name', async ({ token }) => {
                await expectToThrowGQLErrorToResult(async () => {
                    await sendDTMFToB2CAppByTestClient(await makeClient(), { token, data: { dtmfCode: '#' } })
                }, ERRORS.TOKEN_INVALID)
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
                updateToken: () => buildQueryPayload(generateCallStatusId()).token,
                expected: ERRORS.CALL_NOT_FOUND,
            },
            {
                name: 'throws TOKEN_INVALID if token ID is tampered with',
                updateToken: token => `${token[0] === 'A' ? 'B' : 'A'}${token.slice(1)}`,
                expected: ERRORS.TOKEN_INVALID,
            },
            {
                name: 'throws TOKEN_INVALID if token signature is tampered with',
                updateToken: token => {
                    const [id, signature] = token.split('.')
                    return `${id}.${signature[0] === 'A' ? 'B' : 'A'}${signature.slice(1)}`
                },
                expected: ERRORS.TOKEN_INVALID,
            },
        ]

        test.each(ERROR_CASES)('$name', async ({ updateToken, expected }) => {
            const client = await makeClient()
            const { callStatusToken } = await makeStartCallRequest({ admin, serviceUserClient: serviceUser, b2cAppId: b2cApp.id, resident: receiver.resident, property })
        
            const attrs = {
                token: updateToken(callStatusToken),
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