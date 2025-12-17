const { faker } = require('@faker-js/faker')
const dayjs = require('dayjs')
const jwt = require('jsonwebtoken')

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
    let URL
    let SECRET
    let adapter
    let NOTIFICATION_TYPE

    beforeEach(() => {
        fetch.mockResolvedValue({
            ok: true,
            status: 200,
            statusText: 'OK',
            text: jest.fn().mockResolvedValue('OK'),
            json: jest.fn().mockResolvedValue({ ok: true }),
        })

        APP_ID = `app.${faker.random.alphaNumeric(8)}`
        TOKEN = `tok_${faker.random.alphaNumeric(16)}`
        SECRET = `${faker.random.alphaNumeric(24)}`
        URL = `https://${faker.internet.domainName()}/notify`
        NOTIFICATION_TYPE = `type.${faker.random.alphaNumeric(8)}`

        adapter = new WebhookAdapter({
            [APP_ID]: { urls: [{ url: URL, messageTypes: [NOTIFICATION_TYPE] }] },
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
                type: NOTIFICATION_TYPE,
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

            expect(isOk).toBe(true)
            expect(result).toBeDefined()
            expect(result.successCount).toBe(1)
            expect(result.failureCount).toBe(0)
            expect(result.errors).toEqual({})

            expect(fetch).toHaveBeenCalledTimes(1)
            const [calledUrl, calledOpts] = fetch.mock.calls[0]
            expect(calledUrl).toBe(URL)
            expect(calledOpts.method).toBe('POST')
            expect(calledOpts.headers).toEqual({
                'Content-Type': 'application/json',
            })

            const parsed = JSON.parse(calledOpts.body).items
            expect(Array.isArray(parsed)).toBe(true)
            expect(parsed).toHaveLength(1)

            const posted = parsed[0]
            expect(posted.token).toBe(TOKEN)
            expect(posted.appId).toBe(APP_ID)
            expect(posted.type).toBe(PUSH_TYPE_DEFAULT)

            expect(posted.data).toBeDefined()
            expect(posted.data.type).toBe(NOTIFICATION_TYPE)
            expect(posted.data.ticketNumber).toBe(String(ticketNumber))
            expect(posted.data._title).toBe(notification.title)
            expect(posted.data._body).toBe(notification.body)
        })

        it('sends one encrypted notification and posts correct payload', async () => {
            const SECRET = faker.random.alphaNumeric(10)
            adapter = new WebhookAdapter({
                [APP_ID]: { urls: [{ url: URL, secret: SECRET, messageTypes: [NOTIFICATION_TYPE] } ] },
            })

            const notification = {
                title: faker.company.name(),
                body: `${dayjs().format()} ${faker.lorem.sentence()}`,
            }
            const ticketNumber = faker.datatype.number({ min: 1, max: 999999 })

            const data = {
                type: NOTIFICATION_TYPE,
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

            expect(isOk).toBe(true)
            expect(result).toBeDefined()
            expect(result.successCount).toBe(1)
            expect(result.failureCount).toBe(0)
            expect(result.errors).toEqual({})

            expect(fetch).toHaveBeenCalledTimes(1)
            const [calledUrl, calledOpts] = fetch.mock.calls[0]
            expect(calledUrl).toBe(URL)
            expect(calledOpts.method).toBe('POST')
            expect(calledOpts.headers).toEqual({
                'Content-Type': 'application/jwt',
            })

            const parsed = jwt.verify(calledOpts.body, SECRET).items

            expect(Array.isArray(parsed)).toBe(true)
            expect(parsed).toHaveLength(1)

            const posted = parsed[0]
            expect(posted.token).toBe(TOKEN)
            expect(posted.appId).toBe(APP_ID)
            expect(posted.type).toBe(PUSH_TYPE_DEFAULT)

            expect(posted.data).toBeDefined()
            expect(posted.data.type).toBe(NOTIFICATION_TYPE)
            expect(posted.data.ticketNumber).toBe(String(ticketNumber))
            expect(posted.data._title).toBe(notification.title)
            expect(posted.data._body).toBe(notification.body)
        })

        it('sends multiple tokens (same app) in one batch', async () => {
            const tokens = Array.from({ length: 3 }, () => `tok_${faker.random.alphaNumeric({ length: 12 })}`)
            const appIds = Object.fromEntries(tokens.map(t => [t, APP_ID]))

            const [isOk, result] = await adapter.sendNotification({
                notification: { title: 'x', body: 'y' },
                data: { type: NOTIFICATION_TYPE },
                tokens,
                pushTypes: {},
                appIds,
            })

            expect(isOk).toBe(true)
            expect(result.successCount).toBe(tokens.length)
            expect(result.failureCount).toBe(0)
            expect(fetch).toHaveBeenCalledTimes(1) // one appId -> 1 HTTP call

            const parsed = JSON.parse(fetch.mock.calls[0][1].body).items
            expect(parsed).toHaveLength(tokens.length)
        })

        it('sends tokens across two appIds -> two HTTP calls and aggregated counts', async () => {
            const APP_ID2 = `app.${faker.random.alphaNumeric(8)}`
            const URL2 = `https://${faker.internet.domainName()}/notify`

            // Recreate adapter with 2 app configs
            adapter = new WebhookAdapter({
                [APP_ID]: { urls: [{ url: URL, messageTypes: [NOTIFICATION_TYPE] }] },
                [APP_ID2]: { urls: [{ url: URL2, messageTypes: [NOTIFICATION_TYPE] }] },
            })

            const tokenA = `tok_${faker.random.alphaNumeric(12)}`
            const tokenB = `tok_${faker.random.alphaNumeric(12)}`
            const appIds = { [tokenA]: APP_ID, [tokenB]: APP_ID2 }

            const [isOk, result] = await adapter.sendNotification({
                notification: { title: 'multi', body: 'apps' },
                data: { type: NOTIFICATION_TYPE },
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

        it('sends tokens across two messageTypes -> two HTTP calls and aggregated counts', async () => {

            const NON_EXISTING_NOTIFICATION_TYPE = faker.random.alphaNumeric(12)

            const NOTIFICATION_TYPE2 = faker.random.alphaNumeric(12)
            const URL2 = `https://${faker.internet.domainName()}/notify`

            // Recreate adapter with 2 app configs
            adapter = new WebhookAdapter({
                [APP_ID]: { urls: [{ url: URL, messageTypes: [NOTIFICATION_TYPE] }, { url: URL2, messageTypes: [NOTIFICATION_TYPE2] }] },
            })

            const tokenA = `tok_${faker.random.alphaNumeric(12)}`
            const appIds = { [tokenA]: APP_ID }

            const [isOk, result] = await adapter.sendNotification({
                notification: { title: 'multi', body: 'apps' },
                data: { type: NOTIFICATION_TYPE },
                tokens: [tokenA],
                pushTypes: {},
                appIds,
            })

            expect(isOk).toBe(true)
            expect(result.successCount).toBe(1)
            expect(result.failureCount).toBe(0)
            expect(fetch).toHaveBeenCalledTimes(1)

            const urls = fetch.mock.calls.map(c => c[0]).sort()
            expect(urls).toEqual([URL].sort())

            const [isOk2, result2] = await adapter.sendNotification({
                notification: { title: 'multi', body: 'apps' },
                data: { type: NOTIFICATION_TYPE2 },
                tokens: [tokenA],
                pushTypes: {},
                appIds,
            })

            expect(isOk2).toBe(true)
            expect(result2.successCount).toBe(1)
            expect(result2.failureCount).toBe(0)
            expect(fetch).toHaveBeenCalledTimes(2)

            const [isOk3, result3] = await adapter.sendNotification({
                notification: { title: 'multi', body: 'apps' },
                data: { type: NON_EXISTING_NOTIFICATION_TYPE },
                tokens: [tokenA],
                pushTypes: {},
                appIds,
            })

            expect(isOk3).toBe(false)
            expect(result3.successCount).toBe(0)
            expect(result3.failureCount).toBe(0)
            expect(fetch).toHaveBeenCalledTimes(2)

            const urls2 = fetch.mock.calls.map(c => c[0]).sort()
            expect(urls2).toEqual([URL, URL2].sort())
        })
    })

    describe('disabled apps', () => {
        it('does not send when data.app is in APPS_WITH_DISABLED_NOTIFICATIONS', async () => {
            const [isOk, result] = await adapter.sendNotification({
                notification: { title: 'blocked', body: 'by policy' },
                data: { app: 'condo.app.clients', type: NOTIFICATION_TYPE },
                tokens: [TOKEN],
                pushTypes: {},
                appIds: { [TOKEN]: APP_ID },
            })

            expect(isOk).toBe(false)
            expect(result.successCount).toBe(0)
            expect(result.failureCount).toBe(0)
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

            const tokenA = `tok_${faker.random.alphaNumeric(12)}`
            const appIds = { [tokenA]: APP_ID }

            const [isOk, result] = await adapter.sendNotification({
                notification: { title: 'bad', body: 'server' },
                data: { type: NOTIFICATION_TYPE },
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
            const MISSING_APP_ID = `app.${faker.random.alphaNumeric(8)}`
            const tokenMissing = `tok_${faker.random.alphaNumeric(12)}`

            const [isOk, result] = await adapter.sendNotification({
                notification: { title: 'x', body: 'y' },
                data: { type: NOTIFICATION_TYPE },
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
            const APP_ID2 = `app.${faker.random.alphaNumeric(8)}`
            const URL2 = `https://${faker.internet.domainName()}/notify`
            adapter = new WebhookAdapter({
                [APP_ID]: { urls: [{ url: URL, messageTypes: [NOTIFICATION_TYPE] }] },
                [APP_ID2]: { urls: [{ url: URL2, messageTypes: [NOTIFICATION_TYPE] }] },
            })

            const tokenOk = `tok_${faker.random.alphaNumeric(12)}`
            const tokenFail = `tok_${faker.random.alphaNumeric(12)}`

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
                data: { app: 'condo', type: NOTIFICATION_TYPE },
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
                data: { app: 'condo', type: NOTIFICATION_TYPE },
                appIds: { [TOKEN]: APP_ID },
                pushTypes: {},
            })).rejects.toThrow()
        })

        it('throws when body is missing', async () => {
            await expect(adapter.sendNotification({
                tokens: [TOKEN],
                notification: { title: 'x' },
                data: { app: 'condo', type: NOTIFICATION_TYPE },
                appIds: { [TOKEN]: APP_ID },
                pushTypes: {},
            })).rejects.toThrow()
        })

        it('prepareData normalizes to strings', () => {
            const payload = {
                uuid: faker.datatype.uuid(),
                count: 123,
                flag: true,
                nil: null,
            }
            const normalized = WebhookAdapter.prepareData(payload)
            expect(typeof normalized.uuid).toBe('string')
            expect(normalized.count).toBe('123')
            expect(normalized.flag).toBe('true')
            expect('nil' in normalized).toBe(true)
            expect(normalized.nil).toBe('null')
        })
    })
})
