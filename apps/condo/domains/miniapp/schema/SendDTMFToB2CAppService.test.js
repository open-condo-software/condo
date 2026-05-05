
const { faker } = require('@faker-js/faker')
const express = require('express')

const conf = require('@open-condo/config')
const {
    makeLoggedInAdminClient,
    makeLoggedInClient,
    makeClient,
    expectToThrowGQLErrorToResult,
    initTestExpressApp,
    getTestExpressApp,
} = require('@open-condo/keystone/test.utils')

const {
    sendDTMFToB2CAppByTestClient, createTestB2CApp, createTestB2CAppIntercomConfig,
    createTestB2CAppProperty,
    createTestB2CAppAccessRight,
    createTestB2CAppAccessRightSet,
    createTestAppMessageSetting,
    sendVoIPCallStartMessageByTestClient,
    prepareUserWithVerifiedResidentAndContact,
    updateTestB2CAppIntercomConfig,
    sendVoIPCallCancelMessageByTestClient,
} = require('@condo/domains/miniapp/utils/testSchema')
const { VOIP_INCOMING_CALL_MESSAGE_TYPE, CANCELED_CALL_MESSAGE_PUSH_TYPE } = require('@condo/domains/notification/constants/constants')
const { Message } = require('@condo/domains/notification/utils/testSchema')
const { makeClientWithResidentAccessAndProperty } = require('@condo/domains/property/utils/testSchema')
const { makeClientWithSupportUser, makeClientWithServiceUser } = require('@condo/domains/user/utils/testSchema')
const { SEND_VOIP_CALL_CANCEL_MESSAGE_CANCEL_REASON_ANSWERED } = require('../constants')



const SERVER_URL = conf.SERVER_URL

let intercomResponseStatus = 200

const intercomApp = express()
intercomApp.use(express.json())
intercomApp.post('/dtmf', (_req, res) => {
    return res.status(intercomResponseStatus).json({ ok: true })
})

describe('SendDTMFToB2CAppService', () => {

    initTestExpressApp('Flowise', intercomApp, 'http')

    let admin
    let serviceUser
    let b2cApp
    let b2cAppWithoutConfig
    let property
    let organization
    let user
    let contact
    let resident
    let intercomConfig

    async function makeStartCallRequest (app = b2cApp, type = 'b2c') {
        const callId = faker.datatype.uuid()
        const dtmfCommand = faker.random.alphaNumeric(4)
        await sendVoIPCallStartMessageByTestClient(serviceUser, {
            app: { id: app.id },
            addressKey: property.addressKey,
            unitName: resident.unitName,
            unitType: resident.unitType,
            callData: {
                callId,
                ...type === 'b2c' 
                    ? { b2cAppCallData: { B2CAppContext: '' } }
                    : { nativeCallData: {
                        voipAddress: faker.internet.ipv4(),
                        voipPassword: faker.internet.password(), 
                        voipLogin: faker.internet.userName(),
                        voipPanels: [{ dtmfCommand }],
                    } }
                ,
            },
        })
        const [msg] = await Message.getAll(admin, { user: { id: user.id }, type: VOIP_INCOMING_CALL_MESSAGE_TYPE, deletedAt: null }, { sortBy: ['createdAt_DESC'] })
        const { callStatusToken } = msg.meta.data
        return { callId, callStatusToken, propertyId: property.id, organizationId: organization.id, msg, dtmfCommand }
    }

    beforeAll(async () => {
        admin = await makeLoggedInAdminClient()
        const intercomUrl = `${getTestExpressApp('Flowise').baseUrl}/dtmf`;
        [intercomConfig] = await createTestB2CAppIntercomConfig(admin, { sendDTMFUrl: intercomUrl, accessToken: faker.random.alphaNumeric(8) });
        [b2cApp] = await createTestB2CApp(admin, { intercomConfig: { connect: { id: intercomConfig.id } } });
        [b2cAppWithoutConfig] = await createTestB2CApp(admin)
        
        const organizationProperty = await makeClientWithResidentAccessAndProperty()
        organization = organizationProperty.organization 
        property = organizationProperty.property

        const residentUserContact = await prepareUserWithVerifiedResidentAndContact({ admin, organization, property })
        user = residentUserContact.user
        resident = residentUserContact.resident
        contact = residentUserContact.contact

        await createTestB2CAppProperty(admin, b2cApp, { address: property.address, addressMeta: property.addressMeta })
        await createTestB2CAppProperty(admin, b2cAppWithoutConfig, { address: property.address, addressMeta: property.addressMeta })

        serviceUser = await makeClientWithServiceUser()
        const [accessRightSet] = await createTestB2CAppAccessRightSet(admin, b2cApp, { canExecuteSendVoIPCallStartMessage: true, canExecuteSendVoIPCallCancelMessage: true })
        await createTestB2CAppAccessRight(admin, serviceUser.user, b2cApp, { accessRightSet: { connect: { id: accessRightSet.id } } })

        const [accessRightSetWithoutConfig] = await createTestB2CAppAccessRightSet(admin, b2cAppWithoutConfig, { canExecuteSendVoIPCallStartMessage: true })
        await createTestB2CAppAccessRight(admin, serviceUser.user, b2cAppWithoutConfig, { accessRightSet: { connect: { id: accessRightSetWithoutConfig.id } } })

        await createTestAppMessageSetting(admin, { b2cApp, numberOfNotificationInWindow: 1000, type: VOIP_INCOMING_CALL_MESSAGE_TYPE })
        await createTestAppMessageSetting(admin, { b2cApp: b2cAppWithoutConfig, numberOfNotificationInWindow: 1000, type: VOIP_INCOMING_CALL_MESSAGE_TYPE })

    })

    beforeEach(() => {
        intercomResponseStatus = 200
    })

    describe('Access', () => {
        const TEST_CASES = [
            {
                name: 'admin can',
                getClient: () => makeLoggedInAdminClient(),
            },
            {
                name: 'support can',
                getClient: () => makeClientWithSupportUser(),
            },
            {
                name: 'user can',
                getClient: () => makeLoggedInClient(),
            },
            {
                name: 'anonymous can',
                getClient: () => makeClient(),
            },
        ]

        test.each(TEST_CASES)('$name', async ({ getClient }) => {
            const { callId, propertyId, organizationId, callStatusToken } = await makeStartCallRequest()

            const client = await getClient()
            const [result] = await sendDTMFToB2CAppByTestClient(client, { id: b2cApp.id }, { 
                callId,
                property: { id: propertyId },
                organization: { id: organizationId },
                callStatusToken,
                data: { dtmfCode: faker.random.alphaNumeric(4) },
            })
            expect(result.status).toEqual('OK')
        })
    })

    describe('Errors', () => {

        afterAll(async () => {
            await updateTestB2CAppIntercomConfig(admin, intercomConfig.id, { deletedAt: null })
        })

        const ERROR_CASES = [
            {
                name: 'throws error if call not found',
                getApp: () => b2cAppWithoutConfig,
                expected: { mutation: 'sendDTMFToB2CApp', code: 'NOT_FOUND', type: 'CALL_NOT_FOUND' },
            },
            {
                name: 'throws error if dtmfCode empty',
                getDTMFCode: () => '',
                expected: { mutation: 'sendDTMFToB2CApp', code: 'BAD_USER_INPUT', type: 'INVALID_DTMF_CODE' },
            },
            {
                name: 'throws error if intercom returns 403',
                setup: () => { intercomResponseStatus = 403 },
                expected: { mutation: 'sendDTMFToB2CApp', code: 'INTERNAL_ERROR', type: 'INVALID_ACCESS_TOKEN' },
            },
            {
                name: 'throws error if intercom returns 404',
                setup: () => { intercomResponseStatus = 404 },
                expected: { mutation: 'sendDTMFToB2CApp', code: 'NOT_FOUND', type: 'CALL_NOT_FOUND' },
            },
            {
                name: 'throws error if intercom returns 500',
                setup: () => { intercomResponseStatus = 500 },
                expected: { mutation: 'sendDTMFToB2CApp', code: 'INTERNAL_ERROR', type: 'UNKNOWN_ERROR' },
            },
            {
                name: 'throws error if app has no intercom config',
                setup: () => { intercomResponseStatus = 200 },
                assert: async (client, attrs) => {
                    await updateTestB2CAppIntercomConfig(admin, intercomConfig.id, { deletedAt: new Date().toISOString() })
                    await expectToThrowGQLErrorToResult(async () => {
                        await sendDTMFToB2CAppByTestClient(client, attrs.app, attrs)
                    }, { mutation: 'sendDTMFToB2CApp', code: 'FORBIDDEN', type: 'APP_NOT_ALLOWED' })
                    
                },
            },
        ]

        test.each(ERROR_CASES)('$name', async ({ setup, getApp, getDTMFCode, expected, assert }) => {
            setup?.()
            const client = await makeClient()
            const { callId, propertyId, organizationId, callStatusToken } = await makeStartCallRequest()

            const attrs = {
                callId, 
                property: { id: propertyId },
                organization: { id: organizationId },
                callStatusToken,
                app: { id: getApp ? getApp().id : b2cApp.id },
                data: {
                    dtmfCode: getDTMFCode ? getDTMFCode() : faker.random.alphaNumeric(4),
                },
            }

            if (assert) {
                await assert(client, attrs)
            } else {
                await expectToThrowGQLErrorToResult(async () => {
                    await sendDTMFToB2CAppByTestClient(client, attrs.app, attrs)
                }, expected)
            }
        })

    })

    describe('express route', () => {
        test('works', async () => {
            const { callId, propertyId, organizationId, callStatusToken } = await makeStartCallRequest()
            const { serverUrl } = await makeClient()

            const args = {
                callId,
                dtmfCode: '#',
                appId: b2cApp.id,
                propertyId,
                organizationId,
                callStatusToken,
                dv: 1,
                sender: JSON.stringify({ dv: 1, fingerprint: faker.random.alphaNumeric(8) }),
            }
            const url = new URL(`${serverUrl}/api/sendDTMFToB2CApp`)
            for (const key in args) {
                url.searchParams.set(key, args[key])
            }
            const result = await fetch(url.toString())
            expect(result).toBeDefined()
            const resultText = await result.text()
            const resultJSON = JSON.parse(resultText)
            expect(resultJSON).toHaveProperty('status', 'OK')
        })

        test('link and timeout are delivered with native voip push', async () => {
            const { callId, msg } = await makeStartCallRequest(b2cApp, 'native')
            const { serverUrl } = await makeClient()

            const voipPanels = JSON.parse(msg.meta.data.voipPanels)
            expect(voipPanels).toEqual(expect.arrayContaining([
                expect.objectContaining({
                    dtmfCommand: expect.any(String),
                    sendDTMFUrl: expect.stringMatching(new RegExp(`^${SERVER_URL}/api/sendDTMF`)),
                }),
            ]))
            expect(msg.meta.data.sendDTMFTimeout).toEqual(expect.any(String))
            expect(msg.meta.data.sendDTMFTimeout).toEqual(new Date(msg.meta.data.sendDTMFTimeout).toISOString())

            const url = voipPanels[0].sendDTMFUrl.replace(SERVER_URL, serverUrl)
            const result = await fetch(url)
            expect(result).toBeDefined()
            const resultText = await result.text()
            const resultJSON = JSON.parse(resultText)
            expect(resultJSON).toHaveProperty('status', 'OK')

            await sendVoIPCallCancelMessageByTestClient(serviceUser, {
                app: { id: b2cApp.id },
                addressKey: property.addressKey,
                unitName: resident.unitName,
                unitType: resident.unitType,
                callData: {
                    callId,
                    reason: SEND_VOIP_CALL_CANCEL_MESSAGE_CANCEL_REASON_ANSWERED,
                },
            })
            const [cancelMsg] = await Message.getAll(admin, { user: { id: user.id }, type: CANCELED_CALL_MESSAGE_PUSH_TYPE, deletedAt: null }, { sortBy: ['createdAt_DESC'], first: 1 } )
            expect(cancelMsg.meta.data.sendDTMFTimeout).toEqual(expect.any(String))
        })
    })
})