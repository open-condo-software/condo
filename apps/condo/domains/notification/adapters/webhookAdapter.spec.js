// __tests__/webhookAdapter.spec.js

const { faker } = require('@faker-js/faker')
const dayjs = require('dayjs')

jest.mock('@open-condo/keystone/fetch', () => ({ fetch: jest.fn() }))
jest.mock('@open-condo/config',  () => {
    const actual = jest.requireActual('@open-condo/config')
    return {
        ...actual,
        APPS_WITH_DISABLED_NOTIFICATIONS: '["condo.app.clients"]',
    }
})

const { fetch } = require('@open-condo/keystone/fetch')

const {
    PUSH_TYPE_DEFAULT,
} = require('@condo/domains/notification/constants/constants')

const { WebhookAdapter } = require('./webhookAdapter.js')

describe('WebhookAdapter', () => {
    let APP_ID
    let TOKEN
    let AUTH
    let URL
    let adapter

    beforeEach(() => {
        fetch.mockResolvedValue({
            ok: true,
            status: 200,
            statusText: 'OK',
            text: jest.fn().mockResolvedValue('OK'),
            json: jest.fn().mockResolvedValue({ ok: true }),
        })

        APP_ID = `app.${faker.random.alphaNumeric({ length: 8 })}`
        TOKEN = `tok_${faker.random.alphaNumeric({ length: 16 })}`
        AUTH = `Bearer ${faker.random.alphaNumeric({ length: 24 })}`
        URL = `https://${faker.internet.domainName()}/notify`

        adapter = new WebhookAdapter({
            [APP_ID]: { url: URL, authorizationHeader: AUTH },
        })
    })

    afterEach(() => {
        jest.clearAllMocks()
    })

    describe('success path', () => {
        it('sends one notification and posts correct payload', async () => {
            const notification = {
                title: faker.company.name(),
                body: `${dayjs().format()} ${faker.lorem.sentence()}`,
            }
            const ticketNumber = faker.datatype.number({ min: 1, max: 999999 })

            const data = {
                app: 'condo',
                type: 'notification',
                ticketNumber,
            }

            const tokens = [TOKEN]
            const pushTypes = {} // default
            const appIds = { [TOKEN]: APP_ID }

            const [isOk, result] = await adapter.sendNotification({
                notification,
                data,
                tokens,
                pushTypes,
                appIds,
            })

            // Adapter result
            expect(isOk).toBe(true)
            expect(result).toBeDefined()
            expect(result.successCount).toBe(1)
            expect(result.failureCount).toBe(0)
            expect(result.errors).toEqual({})
            expect(result.pushContext).toEqual({}) // current adapter returns {}

            // HTTP call
            expect(fetch).toHaveBeenCalledTimes(1)
            const [calledUrl, calledOpts] = fetch.mock.calls[0]
            expect(calledUrl).toBe(URL)
            expect(calledOpts.method).toBe('POST')
            expect(calledOpts.headers).toEqual({
                'Content-Type': 'application/json',
                'Authorization': AUTH,
            })

            const parsed = JSON.parse(calledOpts.body)
            expect(Array.isArray(parsed.notifications)).toBe(true)
            expect(parsed.notifications).toHaveLength(1)

            const posted = parsed.notifications[0]
            expect(posted.token).toBe(TOKEN)
            expect(posted.appId).toBe(APP_ID)
            expect(posted.type).toBe(PUSH_TYPE_DEFAULT)

            expect(posted.data).toBeDefined()
            expect(posted.data.type).toBe('notification')
            expect(posted.data.app).toBe('condo')
            expect(posted.data.ticketNumber).toBe(String(ticketNumber)) // String(...) conversion in prepareData
            expect(posted.data._title).toBe(notification.title)
            expect(posted.data._body).toBe(notification.body)
        })

        it('sends multiple tokens (same app) in one batch', async () => {
            const tokens = Array.from({ length: 3 }, () => `tok_${faker.random.alphaNumeric({ length: 12 })}`)
            const appIds = Object.fromEntries(tokens.map(t => [t, APP_ID]))

            const [isOk, result] = await adapter.sendNotification({
                notification: { title: 'x', body: 'y' },
                data: { app: 'condo', type: 'notification' },
                tokens,
                pushTypes: {},
                appIds,
            })

            expect(isOk).toBe(true)
            expect(result.successCount).toBe(tokens.length)
            expect(result.failureCount).toBe(0)
            expect(fetch).toHaveBeenCalledTimes(1) // one appId -> 1 HTTP call

            const parsed = JSON.parse(fetch.mock.calls[0][1].body)
            expect(parsed.notifications).toHaveLength(tokens.length)
        })

        it('sends tokens across two appIds -> two HTTP calls and aggregated counts', async () => {
            const APP_ID2 = `app.${faker.random.alphaNumeric({ length: 8 })}`
            const AUTH2 = `Bearer ${faker.random.alphaNumeric({ length: 24 })}`
            const URL2 = `https://${faker.internet.domainName()}/notify`

            // Recreate adapter with 2 app configs
            adapter = new WebhookAdapter({
                [APP_ID]: { url: URL, authorizationHeader: AUTH },
                [APP_ID2]: { url: URL2, authorizationHeader: AUTH2 },
            })

            const tokenA = `tok_${faker.random.alphaNumeric({ length: 12 })}`
            const tokenB = `tok_${faker.random.alphaNumeric({ length: 12 })}`
            const appIds = { [tokenA]: APP_ID, [tokenB]: APP_ID2 }

            const [isOk, result] = await adapter.sendNotification({
                notification: { title: 'multi', body: 'apps' },
                data: { app: 'condo', type: 'notification' },
                tokens: [tokenA, tokenB],
                pushTypes: {},
                appIds,
            })

            expect(isOk).toBe(true)
            expect(result.successCount).toBe(2)
            expect(result.failureCount).toBe(0)
            expect(fetch).toHaveBeenCalledTimes(2)

            const urls = fetch.mock.calls.map(c => c[0]).sort()
            expect(urls).toEqual([URL, URL2].sort())
        })
    })

    describe('disabled apps', () => {
        it('does not send when data.app is in APPS_WITH_DISABLED_NOTIFICATIONS', async () => {
            const [isOk, result] = await adapter.sendNotification({
                notification: { title: 'blocked', body: 'by policy' },
                data: { app: 'condo.app.clients', type: 'notification' }, // disabled by mocked config
                tokens: [TOKEN],
                pushTypes: {},
                appIds: { [TOKEN]: APP_ID },
            })

            expect(isOk).toBe(false)               // successCount=0 → false
            expect(result.successCount).toBe(0)
            expect(result.failureCount).toBe(0)    // nothing attempted
            expect(result.errors).toEqual({})
            expect(fetch).not.toHaveBeenCalled()
        })
    })

    describe('error paths', () => {
        it('treats 500 response as failure for that appId batch', async () => {
            // Make fetch return 500 on first call
            fetch.mockResolvedValueOnce({
                ok: false,
                status: 500,
                statusText: 'Internal Server Error',
                text: jest.fn().mockResolvedValue('oops'),
                json: jest.fn().mockResolvedValue({ error: 'oops' }),
            })

            const tokenA = `tok_${faker.random.alphaNumeric({ length: 12 })}`
            const appIds = { [tokenA]: APP_ID }

            const [isOk, result] = await adapter.sendNotification({
                notification: { title: 'bad', body: 'server' },
                data: { app: 'condo', type: 'notification' },
                tokens: [tokenA],
                pushTypes: {},
                appIds,
            })

            expect(isOk).toBe(false)
            expect(result.successCount).toBe(0)
            expect(result.failureCount).toBe(1)
            expect(result.errors[APP_ID]).toBe(1)
            expect(fetch).toHaveBeenCalledTimes(1)
        })

        it('counts missing app config as failure for that batch', async () => {
            // Adapter only knows APP_ID. We provide a token mapped to a different appId.
            const MISSING_APP_ID = `app.${faker.random.alphaNumeric({ length: 8 })}`
            const tokenMissing = `tok_${faker.random.alphaNumeric({ length: 12 })}`

            const [isOk, result] = await adapter.sendNotification({
                notification: { title: 'x', body: 'y' },
                data: { app: 'condo', type: 'notification' },
                tokens: [tokenMissing],
                pushTypes: {},
                appIds: { [tokenMissing]: MISSING_APP_ID },
            })

            expect(isOk).toBe(false)
            expect(result.successCount).toBe(0)
            expect(result.failureCount).toBe(1)
            expect(result.errors[MISSING_APP_ID]).toBe(1)
            expect(fetch).not.toHaveBeenCalled()
        })

        it('partial failure across two appIds (one 200, one 500)', async () => {
            const APP_ID2 = `app.${faker.random.alphaNumeric({ length: 8 })}`
            const AUTH2 = `Bearer ${faker.random.alphaNumeric({ length: 24 })}`
            const URL2 = `https://${faker.internet.domainName()}/notify`
            adapter = new WebhookAdapter({
                [APP_ID]: { url: URL, authorizationHeader: AUTH },
                [APP_ID2]: { url: URL2, authorizationHeader: AUTH2 },
            })

            const tokenOk = `tok_${faker.random.alphaNumeric({ length: 12 })}`
            const tokenFail = `tok_${faker.random.alphaNumeric({ length: 12 })}`

            // First call OK, second call 500
            fetch
                .mockResolvedValueOnce({
                    ok: true,
                    status: 200,
                    text: jest.fn().mockResolvedValue('OK'),
                    json: jest.fn().mockResolvedValue({ ok: true }),
                })
                .mockResolvedValueOnce({
                    ok: false,
                    status: 500,
                    statusText: 'Internal Server Error',
                    text: jest.fn().mockResolvedValue('bang'),
                    json: jest.fn().mockResolvedValue({ error: 'bang' }),
                })

            const [isOk, result] = await adapter.sendNotification({
                notification: { title: 'mix', body: 'batch' },
                data: { app: 'condo', type: 'notification' },
                tokens: [tokenOk, tokenFail],
                pushTypes: {},
                appIds: { [tokenOk]: APP_ID, [tokenFail]: APP_ID2 },
            })

            expect(isOk).toBe(false)
            expect(result.successCount).toBe(1)
            expect(result.failureCount).toBe(1)
            expect(result.errors[APP_ID2]).toBe(1)
            expect(fetch).toHaveBeenCalledTimes(2)
        })
    })

    describe('validation & utilities', () => {
        it('throws when title is missing', async () => {
            await expect(adapter.sendNotification({
                tokens: [TOKEN],
                notification: { body: faker.lorem.sentence() },
                data: { app: 'condo', type: 'notification' },
                appIds: { [TOKEN]: APP_ID },
                pushTypes: {},
            })).rejects.toThrow() // EMPTY_NOTIFICATION_TITLE_BODY_ERROR
        })

        it('throws when body is missing', async () => {
            await expect(adapter.sendNotification({
                tokens: [TOKEN],
                notification: { title: 'x' },
                data: { app: 'condo', type: 'notification' },
                appIds: { [TOKEN]: APP_ID },
                pushTypes: {},
            })).rejects.toThrow()
        })

        it('prepareData normalizes to strings', () => {
            const payload = {
                uuid: faker.datatype.uuid(),
                count: 123,                   // number
                flag: true,                   // boolean
                nil: null,                    // dropped
            }
            const normalized = WebhookAdapter.prepareData(payload)
            expect(typeof normalized.uuid).toBe('string')
            expect(normalized.count).toBe('123')
            expect(normalized.flag).toBe('true')
            expect('nil' in normalized).toBe(true) // your current impl String(null) -> "null"
            expect(normalized.nil).toBe('null')
        })
    })
})
