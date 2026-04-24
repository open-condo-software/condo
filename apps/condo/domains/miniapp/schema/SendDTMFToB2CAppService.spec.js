jest.resetModules()

const { faker } = require('@faker-js/faker')
const express = require('express')

const { getSchemaCtx } = require('@open-condo/keystone/schema')
const {
    makeLoggedInAdminClient,
    makeLoggedInClient,
    makeClient,
    expectToThrowGQLErrorToResult,
    setFakeClientMode,
} = require('@open-condo/keystone/test.utils')

const { sendDTMFToB2CAppByTestClient, createTestB2CApp, updateTestB2CApp } = require('@condo/domains/miniapp/utils/testSchema')
const { makeClientWithSupportUser } = require('@condo/domains/user/utils/testSchema')

const TEST_B2C_APP_ID = faker.datatype.uuid()
const TEST_NOT_FOUND_B2C_APP_ID = faker.datatype.uuid()

let intercomResponseStatus = 200

const intercomApp = express()
intercomApp.use(express.json())
intercomApp.post('/dtmf', (_req, res) => {
    res.status(intercomResponseStatus).json({ ok: true })
})

// nosemgrep: problem-based-packs.insecure-transport.js-node.using-http-server.using-http-server
const intercomServer = intercomApp.listen(0)
const intercomAddress = intercomServer.address()
const intercomBaseUrl = typeof intercomAddress === 'string' ? intercomAddress : `http://${intercomAddress.address}:${intercomAddress.port}`

global._SEND_DTMF_TO_B2C_APP_SERVICE_CONFIG = {
    [TEST_B2C_APP_ID]: {
        url: `${intercomBaseUrl}/dtmf`,
        accessToken: faker.random.alphaNumeric(8),
    },
    [TEST_NOT_FOUND_B2C_APP_ID]: {
        url: `${intercomBaseUrl}/dtmf`,
        accessToken: faker.random.alphaNumeric(8),
    },
}

jest.mock('@open-condo/config', () => {
    const actual = jest.requireActual('@open-condo/config')
    return new Proxy(actual, {
        set () {},
        get (_, p) {
            if (p === 'SEND_DTMF_TO_B2C_APP_SERVICE_CONFIG') {
                return JSON.stringify(global._SEND_DTMF_TO_B2C_APP_SERVICE_CONFIG)
            }
            return actual[p]
        },
    })
})

// eslint-disable-next-line import/order
const index = require('@app/condo/index')


describe('SendDTMFToB2CAppService', () => {

    setFakeClientMode(index)

    beforeAll(async () => {
        const admin = await makeLoggedInAdminClient()
        const [b2cApp] = await createTestB2CApp(admin)
        // const [updated] = await updateTestB2CApp(admin, b2cApp.id, { newId: TEST_B2C_APP_ID })
        const { keystone } = await getSchemaCtx('B2CApp')
        const updated = await keystone.adapter.listAdapters.B2CApp.update(b2cApp.id, { id: TEST_B2C_APP_ID })
        console.log(updated)

    })

    afterAll(async () => {
        await new Promise((resolve) => intercomServer.close(resolve))
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
            const client = await getClient()
            const [result] = await sendDTMFToB2CAppByTestClient(client, { id: TEST_B2C_APP_ID }, { data: { dtmfCode: '1234' } })
            expect(result.status).toEqual('OK')
        })
    })

    describe('Errors', () => {
        const ERROR_CASES = [
            {
                name: 'throws error if app id not allowed',
                setup: () => {},
                getClient: () => makeClient(),
                args: () => ({ app: { id: faker.datatype.uuid() }, extraAttrs: { data: { dtmfCode: '1234' } } }),
                expected: { mutation: 'sendDTMFToB2CApp', code: 'FORBIDDEN', type: 'APP_NOT_ALLOWED' },
            },
            {
                name: 'throws error if app not found',
                setup: () => {},
                getClient: () => makeClient(),
                args: () => ({ app: { id: TEST_NOT_FOUND_B2C_APP_ID }, extraAttrs: { data: { dtmfCode: '1234' } } }),
                expected: { mutation: 'sendDTMFToB2CApp', code: 'BAD_USER_INPUT', type: 'APP_NOT_FOUND' },
            },
            {
                name: 'throws error if dtmfCode empty',
                setup: () => {},
                getClient: () => makeClient(),
                args: () => ({ app: { id: TEST_B2C_APP_ID }, extraAttrs: { data: { dtmfCode: '' } } }),
                expected: { mutation: 'sendDTMFToB2CApp', code: 'BAD_USER_INPUT', type: 'INVALID_DTMF_CODE' },
            },
            {
                name: 'throws error if intercom returns 403',
                setup: () => { intercomResponseStatus = 403 },
                getClient: () => makeClient(),
                args: () => ({ app: { id: TEST_B2C_APP_ID }, extraAttrs: { data: { dtmfCode: '1234' } } }),
                expected: { mutation: 'sendDTMFToB2CApp', code: 'INTERNAL_ERROR', type: 'INVALID_ACCESS_TOKEN' },
            },
            {
                name: 'throws error if intercom returns 404',
                setup: () => { intercomResponseStatus = 404 },
                getClient: () => makeClient(),
                args: () => ({ app: { id: TEST_B2C_APP_ID }, extraAttrs: { data: { dtmfCode: '1234' } } }),
                expected: { mutation: 'sendDTMFToB2CApp', code: 'NOT_FOUND', type: 'CALL_NOT_FOUND' },
            },
            {
                name: 'throws error if intercom returns 500',
                setup: () => { intercomResponseStatus = 500 },
                getClient: () => makeClient(),
                args: () => ({ app: { id: TEST_B2C_APP_ID }, extraAttrs: { data: { dtmfCode: '1234' } } }),
                expected: { mutation: 'sendDTMFToB2CApp', code: 'INTERNAL_ERROR', type: 'UNKNOWN_ERROR' },
            },
        ]

        test.each(ERROR_CASES)('$name', async ({ setup, getClient, args, expected, assert }) => {
            setup()
            const client = await getClient()
            const attrs = args()

            if (assert) {
                await assert(client, attrs)
            } else {
                await expectToThrowGQLErrorToResult(async () => {
                    await sendDTMFToB2CAppByTestClient(client, attrs.app, attrs.extraAttrs)
                }, expected)
            }
        })
    })
})