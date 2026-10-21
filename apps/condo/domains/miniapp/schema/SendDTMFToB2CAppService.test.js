
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

const { SEND_VOIP_CALL_CANCEL_MESSAGE_CANCEL_REASON_ANSWERED, SEND_VOIP_CALL_CANCEL_MESSAGE_CANCEL_REASON_ENDED } = require('@condo/domains/miniapp/constants')
const {
    sendDTMFToB2CAppByTestClient, createTestB2CApp, createTestB2CAppIntercomConfig,
    createTestB2CAppProperty,
    createTestB2CAppAccessRight,
    createTestB2CAppAccessRightSet,
    createTestAppMessageSetting,
    sendVoIPCallStartMessageByTestClient,
    prepareVoIPUser,
    updateTestB2CAppIntercomConfig,
    sendVoIPCallCancelMessageByTestClient,
} = require('@condo/domains/miniapp/utils/testSchema')
const { SEND_DTMF_TO_B2C_APP_URL_PATH } = require('@condo/domains/miniapp/VoIPMiddleware')
const { VOIP_INCOMING_CALL_MESSAGE_TYPE, CANCELED_CALL_MESSAGE_PUSH_TYPE } = require('@condo/domains/notification/constants/constants')
const { Message } = require('@condo/domains/notification/utils/testSchema')
const { makeClientWithResidentAccessAndProperty } = require('@condo/domains/property/utils/testSchema')
const { makeClientWithSupportUser, makeClientWithServiceUser } = require('@condo/domains/user/utils/testSchema')

const { ERRORS } = require('./SendDTMFToB2CAppService') 


const SERVER_URL = conf.SERVER_URL

let intercomResponseStatus = 200
let lastIntercomRequest

// It's tests, no csrf middleware needed
// nosemgrep: javascript.express.security.audit.express-check-csurf-middleware-usage.express-check-csurf-middleware-usage
const intercomApp = express()
intercomApp.use(express.json())
intercomApp.post('/dtmf', (req, res) => {
    lastIntercomRequest = req.body
    return res.status(intercomResponseStatus).json({ ok: true })
})

describe('SendDTMFToB2CAppService', () => {

    initTestExpressApp('IntercomApp', intercomApp, 'http')

    let admin
    let serviceUser
    let b2cApp
    let b2cAppWithoutConfig
    let property
    let organization
    let user
    let resident
    let intercomConfig

    async function makeStartCallRequest (app = b2cApp, type = 'b2c', actor = { user, resident }) {
        const callId = faker.datatype.uuid()
        const dtmfCommand = faker.random.alphaNumeric(4)
        await sendVoIPCallStartMessageByTestClient(serviceUser, {
            app: { id: app.id },
            addressKey: property.addressKey,
            unitName: actor.resident.unitName,
            unitType: actor.resident.unitType,
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
        const [msg] = await Message.getAll(admin, { user: { id: actor.user.id }, type: VOIP_INCOMING_CALL_MESSAGE_TYPE, deletedAt: null }, { sortBy: ['createdAt_DESC'] })
        const callStatusToken = new URL(msg.meta.data.getVoIPCallStatusUrl).searchParams.get('data.token')
        return { callId, callStatusToken, propertyId: property.id, organizationId: organization.id, msg, dtmfCommand }
    }

    beforeAll(async () => {
        admin = await makeLoggedInAdminClient()
        const intercomUrl = `${getTestExpressApp('IntercomApp').baseUrl}/dtmf`;
        [intercomConfig] = await createTestB2CAppIntercomConfig(admin, { sendDTMFUrl: intercomUrl, accessToken: faker.random.alphaNumeric(8) });
        [b2cApp] = await createTestB2CApp(admin, { intercomConfig: { connect: { id: intercomConfig.id } } });
        [b2cAppWithoutConfig] = await createTestB2CApp(admin)
        
        const organizationProperty = await makeClientWithResidentAccessAndProperty()
        organization = organizationProperty.organization 
        property = organizationProperty.property

        const residentUserContact = await prepareVoIPUser({ admin, organization, property })
        user = residentUserContact.user
        resident = residentUserContact.resident

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
        lastIntercomRequest = null
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
            const { callStatusToken } = await makeStartCallRequest()

            const client = await getClient()
            const [result] = await sendDTMFToB2CAppByTestClient(client, { 
                token: callStatusToken,
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
                name: 'throws error if dtmfCode empty',
                getDTMFCode: () => '',
                expected: ERRORS.INVALID_DTMF_CODE,
            },
            {
                name: 'throws error if intercom returns 403',
                setup: () => { intercomResponseStatus = 403 },
                expected: ERRORS.INVALID_ACCESS_TOKEN,
            },
            {
                name: 'throws error if intercom returns 404',
                setup: () => { intercomResponseStatus = 404 },
                expected: ERRORS.CALL_NOT_FOUND,
            },
            {
                name: 'throws error if intercom returns 500',
                setup: () => { intercomResponseStatus = 500 },
                expected: ERRORS.UNKNOWN_ERROR,
            },
            {
                name: 'throws error if app has no intercom config',
                setup: () => { intercomResponseStatus = 200 },
                assert: async (client, attrs) => {
                    await updateTestB2CAppIntercomConfig(admin, intercomConfig.id, { deletedAt: new Date().toISOString() })
                    await expectToThrowGQLErrorToResult(async () => {
                        await sendDTMFToB2CAppByTestClient(client, attrs)
                    }, ERRORS.APP_NOT_ALLOWED)
                },
            },
        ]

        test.each(ERROR_CASES)('$name', async ({ setup, getDTMFCode, expected, assert }) => {
            setup?.()
            const client = await makeClient()
            const { callStatusToken } = await makeStartCallRequest()

            const attrs = {
                token: callStatusToken,
                data: {
                    dtmfCode: getDTMFCode ? getDTMFCode() : faker.random.alphaNumeric(4),
                },
            }

            if (assert) {
                await assert(client, attrs)
            } else {
                await expectToThrowGQLErrorToResult(async () => {
                    await sendDTMFToB2CAppByTestClient(client, attrs)
                }, expected)
            }
        })

    })

    describe('Logic', () => {

        test('Success case', async () => {
            const client = await makeClient()
            const { callStatusToken } = await makeStartCallRequest()

            intercomResponseStatus = 200
            const [result] = await sendDTMFToB2CAppByTestClient(client, {
                token: callStatusToken,
                data: {
                    dtmfCode: faker.random.alphaNumeric(4),
                },
            })

            expect(result).toEqual(expect.objectContaining({ status: 'OK' }))
        })

    })

    describe('express route', () => {
        test('does not allow DTMF after the call has ended', async () => {
            const actor = await prepareVoIPUser({ admin, organization, property, unitName: faker.random.alphaNumeric(8) })
            const { callId, callStatusToken } = await makeStartCallRequest(b2cApp, 'b2c', actor)
            expect(callStatusToken).toBeDefined()
            await sendVoIPCallCancelMessageByTestClient(serviceUser, {
                app: { id: b2cApp.id },
                addressKey: property.addressKey,
                unitName: actor.resident.unitName,
                unitType: actor.resident.unitType,
                callData: { callId, reason: SEND_VOIP_CALL_CANCEL_MESSAGE_CANCEL_REASON_ENDED },
            })
            await expectToThrowGQLErrorToResult(async () => {
                await sendDTMFToB2CAppByTestClient(await makeClient(), {
                    token: callStatusToken,
                    data: { dtmfCode: '#' },
                })
            }, ERRORS.CALL_NOT_FOUND)
            expect(lastIntercomRequest).toBeNull()
        })

        describe('accepts JSON data', () => {
            test.each([{}, { dv: 1, sender: { dv: 1, fingerprint: 'json-dtmf' } }])('accepts JSON metadata %p', async metadata => {
                const { callId, callStatusToken } = await makeStartCallRequest()
                const { serverUrl } = await makeClient()

                const url = new URL(`${serverUrl}${SEND_DTMF_TO_B2C_APP_URL_PATH}`)
                url.searchParams.set('data', JSON.stringify({ ...metadata, token: callStatusToken, data: { dtmfCode: '#' } }))

                const result = await fetch(url.toString(), { method: 'POST' })
                expect(result.status).toBe(200)
                expect(await result.json()).toEqual({ status: 'OK' })
                expect(lastIntercomRequest).toEqual({ callId, dtmfCode: '#' })
            })
        })

        describe('preserves DTMF in compact query', () => {
            test.each(['#', '+', '&', '*123#', 'a b'])('preserves DTMF %p in compact query', async dtmfCode => {
                const { callId, callStatusToken } = await makeStartCallRequest()
                const { serverUrl } = await makeClient()
                const url = new URL(`${serverUrl}${SEND_DTMF_TO_B2C_APP_URL_PATH}`)
                url.searchParams.set('data.token', callStatusToken)
                url.searchParams.set('data.data.dtmfCode', dtmfCode)

                const response = await fetch(url, { method: 'POST' })

                expect(response.status).toBe(200)
                expect(await response.json()).toEqual({ status: 'OK' })
                expect(lastIntercomRequest).toEqual({ callId, dtmfCode })
            })
        })

        describe('preserves JSON body precedence over query parameters', () => {
            test('preserves JSON body precedence over query parameters', async () => {
                const { callId, callStatusToken } = await makeStartCallRequest()
                const { serverUrl } = await makeClient()
                const response = await fetch(`${serverUrl}${SEND_DTMF_TO_B2C_APP_URL_PATH}?data.token=ignored&data.data.dtmfCode=ignored`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        data: {
                            dv: 1,
                            sender: { dv: 1, fingerprint: faker.random.alphaNumeric(8) },
                            token: callStatusToken,
                            data: { dtmfCode: '#' },
                        },
                    }),
                })

                expect(response.status).toBe(200)
                expect(await response.json()).toEqual({ status: 'OK' })
                expect(lastIntercomRequest).toEqual({ callId, dtmfCode: '#' })
            })
        })

        describe('rejects malformed query', () => {
            test.each([
                't=a&c=x', 'data.token=a', 'data.token=a&data.dtmfCode=x',
                'data.token=a&data.data.dtmfCode=x&data.data.dtmfCode=y',
                'data.token=a&data.data.dtmfCode[x]=y', 'data.token=a&data.data.dtmfCode=x&unknown=y',
                'data=%7B%7D', 'data=invalid', 'data=null', 'data=[]',
                'data=%7B%7D&data.token=a', 'data=%7B%7D&t=a',
            ])('rejects malformed query %p', async query => {
                const { serverUrl } = await makeClient()
                const response = await fetch(`${serverUrl}${SEND_DTMF_TO_B2C_APP_URL_PATH}?${query}`, { method: 'POST' })

                expect(response.status).toBe(400)
                expect(await response.json()).toEqual({
                    errors: [expect.objectContaining({ extensions: expect.objectContaining({ type: 'INVALID_PARAMETERS' }) })],
                })
                expect(lastIntercomRequest).toBeNull()
            })
        })

        describe('metadata headers for all input sources', () => {
            let call
            let serverUrl
            const sender = { dv: 1, fingerprint: 'header-dtmf' }
            const remoteClient = '31935ae4-5a69-4c15-b91b-376dc72c1d49-app.client'
            const headers = { 'X-Remote-Client': remoteClient }

            beforeAll(async () => {
                call = await makeStartCallRequest()
                serverUrl = (await makeClient()).serverUrl
            })

            async function sendRequest ({ format, headers: requestHeaders, metadata = {} }) {
                const url = new URL(`${serverUrl}${SEND_DTMF_TO_B2C_APP_URL_PATH}`)
                const data = { token: call.callStatusToken, data: { dtmfCode: '#' }, ...metadata }
                const options = { method: 'POST', headers: requestHeaders, skipTracingHeaders: true }
                if (format === 'flat') {
                    url.searchParams.set('data.token', call.callStatusToken)
                    url.searchParams.set('data.data.dtmfCode', '#')
                } else if (format === 'json') {
                    url.searchParams.set('data', JSON.stringify(data))
                } else {
                    options.headers = { ...requestHeaders, 'Content-Type': 'application/json' }
                    options.body = JSON.stringify({ data })
                }
                return fetch(url, options)
            }

            test.each([
                { name: 'flat query with UUID-prefixed remote client', format: 'flat', headers },
                { name: 'JSON query explicit metadata', format: 'json', headers, metadata: { dv: 1, sender } },
                { name: 'JSON body explicit metadata', format: 'body', headers, metadata: { dv: 1, sender } },
                { name: 'JSON query sender overrides invalid remote client', format: 'json', headers: { 'X-Remote-Client': 'bad client' }, metadata: { sender } },
                { name: 'JSON body sender overrides invalid remote client', format: 'body', headers: { 'X-Remote-Client': 'bad client' }, metadata: { sender } },
                { name: 'flat query without remote client', format: 'flat' },
                { name: 'JSON query defaults', format: 'json' },
                { name: 'JSON body defaults', format: 'body' },
                { name: 'body dv with derived sender', format: 'body', headers, metadata: { dv: 1 } },
                { name: 'body sender with default dv', format: 'body', metadata: { sender } },
                { name: 'case-insensitive remote-client header', format: 'body', headers: { 'x-rEMOTE-cLIENT': remoteClient } },
                { name: 'long remote client is truncated', format: 'flat', headers: { 'X-Remote-Client': 'a'.repeat(100) } },
            ])('$name', async request => {
                const response = await sendRequest(request)

                expect(response.status).toBe(200)
                expect(await response.json()).toEqual({ status: 'OK' })
                expect(lastIntercomRequest).toEqual({ callId: call.callId, dtmfCode: '#' })
            })

            test.each(['flat', 'json', 'body'])('ignores obsolete metadata headers for %s', async format => {
                const response = await sendRequest({
                    format,
                    headers: { ...headers, 'X-Sender': 'invalid', 'X-Dv': '2' },
                })

                expect(response.status).toBe(200)
                expect(await response.json()).toEqual({ status: 'OK' })
                expect(lastIntercomRequest).toEqual({ callId: call.callId, dtmfCode: '#' })
            })

            describe.each(['flat', 'json', 'body'])('default sender for %s', format => {
                test.each(['', 'abcd', 'bad client'])('uses default for invalid remote client %p', async remoteClient => {
                    const response = await sendRequest({ format, headers: { 'X-Remote-Client': remoteClient } })

                    expect(response.status).toBe(200)
                    expect(await response.json()).toEqual({ status: 'OK' })
                    expect(lastIntercomRequest).toEqual({ callId: call.callId, dtmfCode: '#' })
                })
            })

            test.each([
                { format: 'json', metadata: { dv: null, sender } },
                { format: 'body', metadata: { dv: null, sender } },
                { format: 'json', metadata: { sender: null } },
                { format: 'body', metadata: { sender: null } },
            ])('rejects invalid explicit $format metadata $metadata despite remote client', async ({ format, metadata }) => {
                const response = await sendRequest({ format, headers, metadata })

                expect(response.status).toBe(400)
                expect(await response.json()).toEqual({
                    errors: [expect.objectContaining({ extensions: expect.objectContaining({ type: 'INVALID_PARAMETERS' }) })],
                })
                expect(lastIntercomRequest).toBeNull()
            })

            test.each([null, [], 1, 'text'])('rejects non-object body data %p', async data => {
                const response = await fetch(`${serverUrl}${SEND_DTMF_TO_B2C_APP_URL_PATH}`, {
                    method: 'POST',
                    headers: { ...headers, 'Content-Type': 'application/json' },
                    body: JSON.stringify({ data }),
                })

                expect(response.status).toBe(400)
                expect(lastIntercomRequest).toBeNull()
            })
        })

        test('link and timeout are delivered with native voip push', async () => {
            const { callId, msg, dtmfCommand } = await makeStartCallRequest(b2cApp, 'native')
            const { serverUrl } = await makeClient()

            const voipPanels = JSON.parse(msg.meta.data.voipPanels)
            expect(voipPanels).toEqual(expect.arrayContaining([
                expect.objectContaining({
                    dtmfCommand: expect.any(String),
                    sendDTMFUrl: expect.stringMatching(new RegExp(`^${SERVER_URL}${SEND_DTMF_TO_B2C_APP_URL_PATH}`)),
                }),
            ]))
            expect(msg.meta.data.sendDTMFTimeout).toEqual(expect.any(String))
            expect(msg.meta.data.sendDTMFTimeout).toEqual(new Date(msg.meta.data.sendDTMFTimeout).toISOString())

            const url = voipPanels[0].sendDTMFUrl.replace(SERVER_URL, serverUrl)
            const result = await fetch(url, { method: 'POST' })
            expect(result).toBeDefined()
            const resultText = await result.text()
            const resultJSON = JSON.parse(resultText)
            expect(resultJSON).toHaveProperty('status', 'OK')
            expect(lastIntercomRequest).toEqual({ callId, dtmfCode: dtmfCommand })

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