const { faker } = require('@faker-js/faker')

const conf = require('@open-condo/config')
const {
    makeLoggedInAdminClient,
    makeClient,
} = require('@open-condo/keystone/test.utils')

const { 
    SEND_VOIP_CALL_CANCEL_MESSAGE_CANCEL_REASON_ANSWERED, SEND_VOIP_CALL_CANCEL_MESSAGE_CANCEL_REASON_ENDED,
    CALL_STATUS_STARTED, CALL_STATUS_ENDED, CALL_STATUS_ANSWERED,
} = require('@condo/domains/miniapp/constants')
const {
    createTestB2CApp,
    sendVoIPCallStartMessageByTestClient,
    createTestB2CAppProperty,
    createTestB2CAppAccessRight,
    createTestB2CAppAccessRightSet,
    createTestAppMessageSetting,
    getVoIPCallStatusByTestClient,
    makeStartCallRequest,
    sendVoIPCallCancelMessageByTestClient,
    prepareVoIPUser,
} = require('@condo/domains/miniapp/utils/testSchema')
const { GET_VOIP_CALL_STATUS_URL_PATH } = require('@condo/domains/miniapp/VoIPMiddleware')
const {
    VOIP_INCOMING_CALL_MESSAGE_TYPE,
    CANCELED_CALL_MESSAGE_PUSH_TYPE,
} = require('@condo/domains/notification/constants/constants')
const { Message } = require('@condo/domains/notification/utils/testSchema')
const { FLAT_UNIT_TYPE } = require('@condo/domains/property/constants/common')
const { makeClientWithResidentAccessAndProperty } = require('@condo/domains/property/utils/testSchema')
const { makeClientWithSupportUser, makeClientWithNewRegisteredAndLoggedInUser,
    makeClientWithServiceUser,
} = require('@condo/domains/user/utils/testSchema')

const { ERRORS } = require('./GetVoIPCallStatusService')

const SERVER_URL = conf.SERVER_URL

describe('GetVoIPCallStatusService', () => {
    let admin

    beforeAll(async () => {
        admin = await makeLoggedInAdminClient()
    })

    describe('Access', () => {
        let b2cApp
        let property
        let organization
        let serviceUser
        let callId
        let callStatusToken

        beforeAll(async () => {
            const [testB2CApp] = await createTestB2CApp(admin)
            b2cApp = testB2CApp

            const { organization: testOrganization, property: testProperty } = await makeClientWithResidentAccessAndProperty()
            property = testProperty
            organization = testOrganization
            await createTestB2CAppProperty(admin, b2cApp, { address: testProperty.address, addressMeta: testProperty.addressMeta })
            serviceUser = await makeClientWithServiceUser()
            await createTestB2CAppAccessRight(admin, serviceUser.user, b2cApp)

            callId = faker.datatype.uuid()
            const unitName = faker.random.alphaNumeric(8)
            const unitType = FLAT_UNIT_TYPE
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
            const [msg] = await Message.getAll(admin, { type: VOIP_INCOMING_CALL_MESSAGE_TYPE, user: { id: user.id } }, { first: 1, sortBy: ['createdAt_DESC'] })
            callStatusToken = new URL(msg.meta.data.getVoIPCallStatusUrl).searchParams.get('data.token')
        })

        const TEST_CASES = [
            { name: 'admin can', getClient: () => admin },
            { name: 'support can', getClient: () => makeClientWithSupportUser() },
            { name: 'user can', getClient: () => makeClientWithNewRegisteredAndLoggedInUser() },
            { name: 'anonymous can', getClient: () => makeClient() },
        ]

        test.each(TEST_CASES)('$name', async ({ getClient }) => {
            const client = await getClient()
            const [result] = await getVoIPCallStatusByTestClient(client, { token: callStatusToken })
            expect(result).toHaveProperty('status', CALL_STATUS_STARTED)
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

        test(`Receives ${CALL_STATUS_STARTED} if call started`, async () => {
            const unitName = faker.random.alphaNumeric(8)
            const unitType = FLAT_UNIT_TYPE
            const callId = faker.random.alphaNumeric(8)
            const { user } = await prepareVoIPUser({ admin, organization, property, unitName, unitType })
            await sendVoIPCallStartMessageByTestClient(serviceUser, {
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

            const [{ status }] = await getVoIPCallStatusByTestClient(await makeClient(), {
                token: callStatusToken,
            })
            expect(status).toEqual(CALL_STATUS_STARTED)
        })

        test(`Receives ${CALL_STATUS_ENDED} if call ended`, async () => {
            const unitName = faker.random.alphaNumeric(8)
            const unitType = FLAT_UNIT_TYPE
            const callId = faker.random.alphaNumeric(8)
            const { user } = await prepareVoIPUser({ admin, organization, property, unitName, unitType })
            await sendVoIPCallStartMessageByTestClient(serviceUser, {
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
            await sendVoIPCallCancelMessageByTestClient(serviceUser, {
                app: { id: b2cApp.id },
                addressKey: property.addressKey,
                unitName,
                unitType,
                callData: {
                    callId,
                    reason: SEND_VOIP_CALL_CANCEL_MESSAGE_CANCEL_REASON_ENDED,
                },
            })

            const [{ status }] = await getVoIPCallStatusByTestClient(await makeClient(), {
                token: callStatusToken,
            })
            expect(status).toEqual(CALL_STATUS_ENDED)
        })

        test(`Receives ${CALL_STATUS_ANSWERED} if call ended with answer`, async () => {
            const unitName = faker.random.alphaNumeric(8)
            const unitType = FLAT_UNIT_TYPE
            const callId = faker.random.alphaNumeric(8)
            const { user } = await prepareVoIPUser({ admin, organization, property, unitName, unitType })
            const addressKey = property.addressKey
            await sendVoIPCallStartMessageByTestClient(serviceUser, {
                app: { id: b2cApp.id },
                addressKey,
                unitName,
                unitType,
                callData: {
                    callId,
                    b2cAppCallData: { B2CAppContext: '' },
                },
            })
            const [msg] = await Message.getAll(admin, { type: VOIP_INCOMING_CALL_MESSAGE_TYPE, user: { id: user.id } }, { sortBy: ['createdAt_DESC'], first: 1 })
            const callStatusToken = new URL(msg.meta.data.getVoIPCallStatusUrl).searchParams.get('data.token')

            await sendVoIPCallCancelMessageByTestClient(serviceUser, {
                app: { id: b2cApp.id },
                addressKey,
                unitName,
                unitType,
                callData: {
                    callId,
                    reason: SEND_VOIP_CALL_CANCEL_MESSAGE_CANCEL_REASON_ANSWERED,
                },
            })

            const [{ status }] = await getVoIPCallStatusByTestClient(await makeClient(), {
                token: callStatusToken,
            })
            expect(status).toEqual(CALL_STATUS_ANSWERED)
        })

    })

    describe('express route', () => {
        let serviceUser
        let organization
        let property
        let b2cApp

        async function fetchGetCallStatusUrl (url) {
            const result = await fetch(url)
            return result.json()
        }

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

        describe('accepts JSON data', () => {
            test.each([{}, { dv: 1, sender: { dv: 1, fingerprint: 'json-status' } }])('accepts JSON metadata %p', async metadata => {
                const { resident } = await prepareVoIPUser({ admin, organization, property, unitName: faker.random.alphaNumeric(8) })
                const { callStatusToken } = await makeStartCallRequest({
                    admin,
                    serviceUserClient: serviceUser,
                    b2cAppId: b2cApp.id,
                    resident,
                })
                const { serverUrl } = await makeClient()
                const url = new URL(`${serverUrl}${GET_VOIP_CALL_STATUS_URL_PATH}`)
                url.searchParams.set('data', JSON.stringify({
                    ...metadata,
                    token: callStatusToken,
                }))

                const response = await fetch(url)

                expect(response.status).toBe(200)
                expect(await response.json()).toEqual({ status: CALL_STATUS_STARTED })
            })
        })

        describe('rejects malformed query', () => {
            test.each([
                '', 't=a', 't=a&t=b', 'data.token=a&data.token=b', 'data.token[x]=a',
                'data.token=a&unexpected=b', 'data.token=a&data.__proto__.polluted=true',
                'data.token=a&data.constructor.prototype.polluted=true',
                'data=invalid', 'data=%7B%7D', 'data=null', 'data=[]', 'data=%22text%22',
                'data=%7B%7D&data.token=a', 'data=%7B%7D&t=a', 'data=%7B%7D&data=%7B%7D',
            ])('rejects malformed query %p', async query => {
                const { serverUrl } = await makeClient()
                const response = await fetch(`${serverUrl}${GET_VOIP_CALL_STATUS_URL_PATH}?${query}`)

                expect(response.status).toBe(400)
                expect(await response.json()).toEqual({
                    errors: [expect.objectContaining({ extensions: expect.objectContaining({ type: 'INVALID_PARAMETERS' }) })],
                })
            })
        })

        describe('metadata headers', () => {
            let callStatusToken
            let serverUrl
            const sender = { dv: 1, fingerprint: 'header-status' }
            const headers = { 'X-Dv': '1', 'X-Sender': JSON.stringify(sender) }

            beforeAll(async () => {
                const { resident } = await prepareVoIPUser({ admin, organization, property, unitName: faker.random.alphaNumeric(8) })
                const call = await makeStartCallRequest({ admin, serviceUserClient: serviceUser, b2cAppId: b2cApp.id, resident })
                callStatusToken = call.callStatusToken
                serverUrl = (await makeClient()).serverUrl
            })

            test.each([
                { name: 'flat query with headers', headers },
                { name: 'flat query without headers' },
                { name: 'JSON query without metadata', data: {} },
                { name: 'JSON query metadata fallback', data: { dv: 1, sender } },
                { name: 'JSON query overrides conflicting headers', headers: { 'X-Dv': '2', 'X-Sender': '{"dv":2,"fingerprint":""}' }, data: { dv: 1, sender } },
                { name: 'JSON query ignores malformed unused headers', headers: { 'X-Dv': 'invalid', 'X-Sender': 'invalid' }, data: { dv: 1, sender } },
                { name: 'case-insensitive header names', headers: { 'x-dV': '1', 'x-sENDER': JSON.stringify(sender) } },
                { name: 'only X-Dv fills missing JSON dv', headers: { 'X-Dv': '1' }, data: { sender } },
                { name: 'only X-Sender fills missing JSON sender', headers: { 'X-Sender': JSON.stringify(sender) }, data: { dv: 1 } },
                { name: 'JSON dv ignores its malformed header independently', headers: { 'X-Dv': 'invalid', 'X-Sender': JSON.stringify(sender) }, data: { dv: 1 } },
                { name: 'JSON sender ignores its malformed header independently', headers: { 'X-Dv': '1', 'X-Sender': 'invalid' }, data: { sender } },
                { name: 'only X-Dv retains default sender', headers: { 'X-Dv': '1' } },
                { name: 'only X-Sender retains default dv', headers: { 'X-Sender': JSON.stringify(sender) } },
                { name: 'long tracing identifier is not a sender', headers: { 'X-Remote-Client': 'a'.repeat(100) } },
            ])('$name', async ({ headers: requestHeaders, data }) => {
                const url = new URL(`${serverUrl}${GET_VOIP_CALL_STATUS_URL_PATH}`)
                if (data === undefined) url.searchParams.set('data.token', callStatusToken)
                else url.searchParams.set('data', JSON.stringify({ ...data, token: callStatusToken }))

                const response = await fetch(url, { headers: requestHeaders })

                expect(response.status).toBe(200)
                expect(await response.json()).toEqual({ status: CALL_STATUS_STARTED })
            })

            test.each(['data.token', 't', 'unknown'])('rejects JSON query mixed with %s', async key => {
                const url = new URL(`${serverUrl}${GET_VOIP_CALL_STATUS_URL_PATH}`)
                url.searchParams.set('data', JSON.stringify({ token: callStatusToken }))
                url.searchParams.set(key, callStatusToken)
                const response = await fetch(url)

                expect(response.status).toBe(400)
                expect(await response.json()).toEqual({
                    errors: [expect.objectContaining({ extensions: expect.objectContaining({ type: 'INVALID_PARAMETERS' }) })],
                })
            })

            test.each([
                { name: 'empty X-Dv', headers: { 'X-Dv': '' } },
                { name: 'non-JSON X-Dv', headers: { 'X-Dv': 'invalid' } },
                { name: 'string X-Dv', headers: { 'X-Dv': '"1"' } },
                { name: 'boolean X-Dv', headers: { 'X-Dv': 'true' } },
                { name: 'array X-Dv', headers: { 'X-Dv': '[1]' } },
                { name: 'null X-Dv', headers: { 'X-Dv': 'null' } },
                { name: 'unsupported X-Dv', headers: { 'X-Dv': '2' }, type: ERRORS.DV_VERSION_MISMATCH.type },
                { name: 'empty X-Sender', headers: { 'X-Sender': '' } },
                { name: 'non-JSON X-Sender', headers: { 'X-Sender': 'invalid' } },
                { name: 'string X-Sender', headers: { 'X-Sender': '"fingerprint"' } },
                { name: 'array X-Sender', headers: { 'X-Sender': '[]' } },
                { name: 'null X-Sender', headers: { 'X-Sender': 'null' } },
                { name: 'incomplete X-Sender', headers: { 'X-Sender': '{"fingerprint":"valid-id"}' } },
                { name: 'short fingerprint', headers: { 'X-Sender': '{"dv":1,"fingerprint":"a"}' }, type: ERRORS.WRONG_SENDER_FORMAT.type },
                { name: 'long fingerprint', headers: { 'X-Sender': JSON.stringify({ dv: 1, fingerprint: 'a'.repeat(43) }) }, type: ERRORS.WRONG_SENDER_FORMAT.type },
                { name: 'invalid sender version', headers: { 'X-Sender': '{"dv":2,"fingerprint":"valid-id"}' }, type: ERRORS.WRONG_SENDER_FORMAT.type },
                { name: 'JSON sender is not masked by X-Dv', headers: { 'X-Dv': '1' }, data: { sender: { dv: 2, fingerprint: 'valid-id' } }, type: ERRORS.WRONG_SENDER_FORMAT.type },
                { name: 'JSON dv is not masked by X-Sender', headers: { 'X-Sender': JSON.stringify(sender) }, data: { dv: 2 }, type: ERRORS.DV_VERSION_MISMATCH.type },
                { name: 'null JSON dv', data: { dv: null } },
                { name: 'null JSON sender', data: { sender: null } },
                { name: 'unsupported JSON dv despite valid headers', headers, data: { dv: 2 }, type: ERRORS.DV_VERSION_MISMATCH.type },
                { name: 'null JSON dv despite valid headers', headers, data: { dv: null } },
                { name: 'invalid JSON sender despite valid headers', headers, data: { sender: { dv: 2, fingerprint: 'valid-id' } }, type: ERRORS.WRONG_SENDER_FORMAT.type },
                { name: 'null JSON sender despite valid headers', headers, data: { sender: null } },
            ])('rejects $name without falling back', async ({ headers: requestHeaders, data = {}, type = 'INVALID_PARAMETERS' }) => {
                const url = new URL(`${serverUrl}${GET_VOIP_CALL_STATUS_URL_PATH}`)
                url.searchParams.set('data', JSON.stringify({ ...data, token: callStatusToken }))
                const response = await fetch(url, { headers: requestHeaders })

                expect(response.status).toBe(400)
                expect(await response.json()).toEqual({
                    errors: [expect.objectContaining({ extensions: expect.objectContaining({ type }) })],
                })
            })
        })

        test('Receives url and timeout in start and end pushes', async () => {
            const unitName = faker.random.alphaNumeric(8)
            const unitType = FLAT_UNIT_TYPE
            const callId = faker.random.alphaNumeric(8)
            const { user } = await prepareVoIPUser({ admin, organization, property, unitName, unitType })
            const client = await makeClient()
            await sendVoIPCallStartMessageByTestClient(serviceUser, {
                app: { id: b2cApp.id },
                addressKey: property.addressKey,
                unitName,
                unitType,
                callData: {
                    callId,
                    b2cAppCallData: { B2CAppContext: '' },
                },
            })
            let [msg] = await Message.getAll(admin, { type: VOIP_INCOMING_CALL_MESSAGE_TYPE, user: { id: user.id } }, { sortBy: ['createdAt_DESC'], first: 1 })
            let { getVoIPCallStatusUrl, getVoIPCallStatusTimeout } = msg.meta.data

            expect(getVoIPCallStatusUrl).toEqual(expect.any(String))
            expect(getVoIPCallStatusTimeout).toEqual(expect.any(String))
            getVoIPCallStatusUrl = getVoIPCallStatusUrl.replace(SERVER_URL, client.serverUrl)

            const status1 = await fetchGetCallStatusUrl(getVoIPCallStatusUrl)
            expect(status1.status).toEqual(CALL_STATUS_STARTED)

            await sendVoIPCallCancelMessageByTestClient(serviceUser, {
                app: { id: b2cApp.id },
                addressKey: property.addressKey,
                unitName,
                unitType,
                callData: {
                    callId,
                    reason: SEND_VOIP_CALL_CANCEL_MESSAGE_CANCEL_REASON_ENDED,
                },
            });
            [msg] = await Message.getAll(admin, { type: CANCELED_CALL_MESSAGE_PUSH_TYPE, user: { id: user.id } }, { sortBy: ['createdAt_DESC'], first: 1 })

            expect(msg.meta.data.getVoIPCallStatusUrl).not.toBeDefined()
            expect(msg.meta.data.getVoIPCallStatusTimeout).toEqual(expect.any(String))

            const status2 = await fetchGetCallStatusUrl(getVoIPCallStatusUrl)
            expect(status2.status).toEqual(CALL_STATUS_ENDED)
        })

    })

})