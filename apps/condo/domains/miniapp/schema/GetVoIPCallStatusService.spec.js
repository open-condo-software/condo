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
const { getCallStatus, buildCallStatusToken, generateCallStatusId, parseCallStatusToken } = require('@condo/domains/miniapp/utils/voip')
const { VOIP_INCOMING_CALL_MESSAGE_TYPE } = require('@condo/domains/notification/constants/constants')
const { Message } = require('@condo/domains/notification/utils/testSchema')
const { FLAT_UNIT_TYPE } = require('@condo/domains/property/constants/common')
const { makeClientWithResidentAccessAndProperty } = require('@condo/domains/property/utils/testSchema')
const { makeClientWithServiceUser } = require('@condo/domains/user/utils/testSchema')

const { ERRORS } = require('./GetVoIPCallStatusService')


/**
 * @param {Parameters<typeof buildCallStatusToken>[0]} id
 * @returns 
 */
function buildQueryPayload (id) {
    const token = buildCallStatusToken(id)
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

        describe('should throw error if token is invalid', () => {
            const TEST_CASES = [
                { name: 'empty', token: '' },
                { name: 'invalid character', token: '\u0000' },
                { name: 'unsigned ID', token: generateCallStatusId() },
                { name: 'too long', token: '1'.repeat(1000) },
            ]

            test.each(TEST_CASES)('$name', async ({ token }) => {
                await expectToThrowGQLErrorToResult(async () => {
                    await getVoIPCallStatusByTestClient(await makeClient(), { token })
                }, ERRORS.TOKEN_INVALID)
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
            expect(new URL(msg.meta.data.getVoIPCallStatusUrl).searchParams.get('data.token')).toHaveLength(45)
        
            const wrongCallId = faker.random.alphaNumeric(8)
            const missingCallPayload = buildQueryPayload(generateCallStatusId())
        
        
            await expectToThrowGQLErrorToResult(async () => {
                await getVoIPCallStatusByTestClient(await makeClient(), missingCallPayload)
            }, ERRORS.CALL_NOT_FOUND) 
        
            const callStatus = await getCallStatus({ b2cAppId: b2cApp.id, organizationId: organization.id, addressKey: property.addressKey, callId: wrongCallId })
            expect(callStatus).toBeNull()
        })
        
        test.each(['id', 'signature'])('Throws TOKEN_INVALID if token %s is tampered with', async part => {
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
            const callStatusToken = new URL(msg.meta.data.getVoIPCallStatusUrl).searchParams.get('data.token')
            const [id, signature] = callStatusToken.split('.')
            const tamper = value => `${value[0] === 'A' ? 'B' : 'A'}${value.slice(1)}`
            const wrongCallStatusToken = part === 'id' ? `${tamper(id)}.${signature}` : `${id}.${tamper(signature)}`
        
            await expectToThrowGQLErrorToResult(async () => {
                await getVoIPCallStatusByTestClient(await makeClient(), {
                    token: wrongCallStatusToken,
                })
            }, ERRORS.TOKEN_INVALID)
        
            const callStatus = await getCallStatus({ b2cAppId: b2cApp.id, organizationId: organization.id, addressKey: property.addressKey, callId })
            expect(callStatus).not.toBeNull()
            expect(parseCallStatusToken(wrongCallStatusToken)).toBeNull()
        })

    })

})