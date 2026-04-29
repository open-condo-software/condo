
const { faker } = require('@faker-js/faker')
const express = require('express')

const conf = require('@open-condo/config')
const {
    makeLoggedInAdminClient,
    makeLoggedInClient,
    makeClient,
    expectToThrowGQLErrorToResult,
} = require('@open-condo/keystone/test.utils')

const { sendDTMFToB2CAppByTestClient, createTestB2CApp, createTestB2CAppIntercomConfig } = require('@condo/domains/miniapp/utils/testSchema')
const { makeClientWithSupportUser } = require('@condo/domains/user/utils/testSchema')


const SERVER_URL = conf.SERVER_URL

let intercomResponseStatus = 200

const intercomApp = express()
intercomApp.use(express.json())
intercomApp.post('/dtmf', (_req, res) => {
    return res.status(intercomResponseStatus).json({ ok: true })
})

// nosemgrep: problem-based-packs.insecure-transport.js-node.using-http-server.using-http-server
const intercomServer = intercomApp.listen(0)
const intercomAddress = intercomServer.address()
const intercomBaseUrl = typeof intercomAddress === 'string' ? intercomAddress : `http://${intercomAddress.address}:${intercomAddress.port}`
const intercomUrl = `${intercomBaseUrl}/dtmf`


describe('SendDTMFToB2CAppService', () => {
    let admin
    let b2cApp
    let b2cAppWithoutConfig

    beforeAll(async () => {
        admin = await makeLoggedInAdminClient()
        const [intercomConfig] = await createTestB2CAppIntercomConfig(admin, { sendDTMFUrl: intercomUrl, accessToken: faker.random.alphaNumeric(8) });
        [b2cApp] = await createTestB2CApp(admin, { intercomConfig: { connect: { id: intercomConfig.id } } });
        [b2cAppWithoutConfig] = await createTestB2CApp(admin)
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
            const [result] = await sendDTMFToB2CAppByTestClient(client, { id: b2cApp.id }, { 
                property: { id: faker.datatype.uuid() },
                organization: { id: faker.datatype.uuid() },
                callStatusToken: faker.datatype.alphaNumeric(8),
                data: { dtmfCode: '1234' },
            })
            expect(result.status).toEqual('OK')
        })
    })

    describe('Errors', () => {
        const defaultArgs = {
            property: { id: faker.datatype.uuid() },
            organization: { id: faker.datatype.uuid() },
            callStatusToken: faker.datatype.alphaNumeric(8),
        }

        const ERROR_CASES = [
            {
                name: 'throws error if app id not allowed',
                setup: () => {},
                getClient: () => makeClient(),
                args: () => ({ app: { id: b2cApp.id }, extraAttrs: { ...defaultArgs, data: { dtmfCode: '1234' } } }),
                expected: { mutation: 'sendDTMFToB2CApp', code: 'FORBIDDEN', type: 'APP_NOT_ALLOWED' },
            },
            {
                name: 'throws error if app not found',
                setup: () => {},
                getClient: () => makeClient(),
                args: () => ({ app: { id: b2cAppWithoutConfig.id }, extraAttrs: { ...defaultArgs, data: { dtmfCode: '1234' } } }),
                expected: { mutation: 'sendDTMFToB2CApp', code: 'BAD_USER_INPUT', type: 'APP_NOT_FOUND' },
            },
            {
                name: 'throws error if dtmfCode empty',
                setup: () => {},
                getClient: () => makeClient(),
                args: () => ({ app: { id: b2cApp.id }, extraAttrs: { ...defaultArgs, data: { dtmfCode: '' } } }),
                expected: { mutation: 'sendDTMFToB2CApp', code: 'BAD_USER_INPUT', type: 'INVALID_DTMF_CODE' },
            },
            {
                name: 'throws error if intercom returns 403',
                setup: () => { intercomResponseStatus = 403 },
                getClient: () => makeClient(),
                args: () => ({ app: { id: b2cApp.id }, extraAttrs: { ...defaultArgs, data: { dtmfCode: '1234' } } }),
                expected: { mutation: 'sendDTMFToB2CApp', code: 'INTERNAL_ERROR', type: 'INVALID_ACCESS_TOKEN' },
            },
            {
                name: 'throws error if intercom returns 404',
                setup: () => { intercomResponseStatus = 404 },
                getClient: () => makeClient(),
                args: () => ({ app: { id: b2cApp.id }, extraAttrs: { ...defaultArgs, data: { dtmfCode: '1234' } } }),
                expected: { mutation: 'sendDTMFToB2CApp', code: 'NOT_FOUND', type: 'CALL_NOT_FOUND' },
            },
            {
                name: 'throws error if intercom returns 500',
                setup: () => { intercomResponseStatus = 500 },
                getClient: () => makeClient(),
                args: () => ({ app: { id: b2cApp.id }, extraAttrs: { ...defaultArgs, data: { dtmfCode: '1234' } } }),
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

    describe('express route', () => {
        test('works', async () => {
            const args = {
                callId: faker.datatype.uuid(),
                dtmfCode: '#',
                appId: b2cApp.id,
                propertyId: faker.datatype.uuid(),
                organizationId: faker.datatype.uuid(),
                callStatusToken: faker.datatype.alphaNumeric(8),
            }
            const url = new URL(`${SERVER_URL}/api/sendDTMFToB2CApp`)
            for (const key in args) {
                url.searchParams.set(key, args[key])
            }
            const result = await fetch(url.toString(), {
                method: 'GET',
            })
            expect(result).toBeDefined()
            const resultJSON = await result.json()
            expect(resultJSON).toHaveProperty('status', 'OK')
        })
    })
})