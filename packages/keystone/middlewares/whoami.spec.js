const { faker } = require('@faker-js/faker')
const express = require('express')

jest.mock('@open-condo/config', () => ({
    RATE_LIMIT_CONFIG: '{}',
    DISABLE_RATE_LIMIT: undefined,
    X_TARGET_OPTIONS: 'condo-app,billing',
    WERF_COMMIT_HASH: 'test-build-sha',
}))

const mockRedisClient = {
    get: jest.fn(),
    ttl: jest.fn(),
}

jest.mock('@open-condo/keystone/kv', () => ({
    getKVClient: jest.fn(() => mockRedisClient),
}))

const mockLogger = {
    error: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
}

jest.mock('@open-condo/keystone/logging', () => ({
    getLogger: jest.fn(() => mockLogger),
}))

const conf = require('@open-condo/config')
const { fetch } = require('@open-condo/keystone/fetch')
const { getKVClient } = require('@open-condo/keystone/kv')
const { initTestExpressApp, getTestExpressApp } = require('@open-condo/keystone/test.utils')

const { WhoAmIMiddleware } = require('./whoami')

describe('WhoAmIMiddleware', () => {
    const appName = 'TestWhoAmI'
    const endpoint = '/api/whoami'
    let requestOverrides = {}
    let baseUrl

    // nosemgrep: javascript.express.security.audit.express-check-csurf-middleware-usage.express-check-csurf-middleware-usage
    const app = express()
    app.set('trust proxy', true)
    app.use((req, res, next) => {
        if (requestOverrides.user !== undefined) {
            req.user = requestOverrides.user
        }
        if (requestOverrides.id !== undefined) {
            req.id = requestOverrides.id
        }
        if (requestOverrides.startId !== undefined) {
            req.startId = requestOverrides.startId
        }
        if (requestOverrides.originalIp !== undefined) {
            req.originalIp = requestOverrides.originalIp
        }
        next()
    })

    beforeAll(async () => {
        const middleware = new WhoAmIMiddleware({ endpoint })
        const whoamiApp = await middleware.prepareMiddleware()
        app.use(whoamiApp)
    })

    initTestExpressApp(appName, app)

    beforeAll(() => {
        baseUrl = getTestExpressApp(appName).baseUrl
    })

    beforeEach(() => {
        jest.clearAllMocks()
        requestOverrides = {}
        conf.RATE_LIMIT_CONFIG = '{}'
        conf.DISABLE_RATE_LIMIT = undefined
        conf.X_TARGET_OPTIONS = 'condo-app,billing'
        conf.WERF_COMMIT_HASH = 'test-build-sha'
        mockRedisClient.get.mockResolvedValue(null)
        mockRedisClient.ttl.mockResolvedValue(-2)
        getKVClient.mockReturnValue(mockRedisClient)
    })

    async function getWhoAmI (headers = {}) {
        const response = await fetch(`${baseUrl}${endpoint}`, { headers })
        const body = await response.json()
        return { response, body }
    }

    test('returns anonymous userId and public request fields', async () => {
        const requestId = faker.datatype.uuid()
        const startRequestId = faker.datatype.uuid()
        const originalIp = '10.0.0.5'
        requestOverrides = {
            id: requestId,
            startId: startRequestId,
            originalIp,
        }

        const { response, body } = await getWhoAmI({
            'x-forwarded-for': '203.0.113.10',
            'user-agent': 'whoami-test',
        })

        expect(response.status).toBe(200)
        expect(body.ip).toBe('203.0.113.10')
        expect(body.userId).toBeNull()
        expect(body.requestId).toBe(requestId)
        expect(body.startRequestId).toBe(startRequestId)
        expect(body.originalIp).toBe(originalIp)
        expect(body.build).toBe('test-build-sha')
        expect(body.time).toEqual(expect.any(String))
        expect(Date.parse(body.time)).not.toBeNaN()
        expect(body.host).toEqual(expect.any(String))
        expect(body.protocol).toBe('http')
        expect(body.headers).toEqual(expect.objectContaining({
            'user-agent': 'whoami-test',
        }))
        expect(body.geolocation).toEqual({
            country: null,
            region: null,
            city: null,
        })
    })

    test('returns authenticated userId from session', async () => {
        const userId = faker.datatype.uuid()
        requestOverrides = { user: { id: userId } }

        const { body } = await getWhoAmI()

        expect(body.userId).toBe(userId)
        expect(body.rateLimits.complexity.identity).toBe('user')
    })

    test('strips secret headers from response', async () => {
        const { body } = await getWhoAmI({
            cookie: 'session=secret',
            authorization: 'Bearer secret-token',
            'proxy-authorization': 'Basic secret',
            'x-proxy-signature': 'sig',
            'set-cookie': 'a=b',
            'user-agent': 'keep-me',
            'x-forwarded-for': '203.0.113.20',
        })

        expect(body.headers.cookie).toBeUndefined()
        expect(body.headers.authorization).toBeUndefined()
        expect(body.headers['proxy-authorization']).toBeUndefined()
        expect(body.headers['x-proxy-signature']).toBeUndefined()
        expect(body.headers['set-cookie']).toBeUndefined()
        expect(body.headers['user-agent']).toBe('keep-me')
    })

    test('reads geolocation from proxy headers', async () => {
        const { body } = await getWhoAmI({
            'cf-ipcountry': 'DE',
            'cf-region-code': 'BE',
            'cf-ipcity': 'Berlin',
        })

        expect(body.geolocation).toEqual({
            country: 'DE',
            region: 'BE',
            city: 'Berlin',
        })
    })

    test('returns complexity quota from redis without incrementing', async () => {
        mockRedisClient.get.mockResolvedValue('40')
        mockRedisClient.ttl.mockResolvedValue(120)

        const before = Date.now()
        const { body } = await getWhoAmI({
            'x-forwarded-for': '198.51.100.7',
        })
        const after = Date.now()

        expect(getKVClient).toHaveBeenCalledWith('whoami')
        expect(mockRedisClient.get).toHaveBeenCalledWith('rate-limit:ip:198.51.100.7')
        expect(mockRedisClient.ttl).toHaveBeenCalledWith('rate-limit:ip:198.51.100.7')
        expect(body.rateLimits.complexity).toEqual(expect.objectContaining({
            enabled: true,
            identity: 'ip',
            limit: 100,
            used: 40,
            remaining: 60,
            window: '1h',
        }))
        expect(body.rateLimits.complexity.reset).toBeGreaterThanOrEqual(Math.ceil((before + 120000) / 1000))
        expect(body.rateLimits.complexity.reset).toBeLessThanOrEqual(Math.ceil((after + 120000) / 1000))
    })

    test('skips redis when rate limiting is disabled', async () => {
        conf.DISABLE_RATE_LIMIT = 'true'

        const { body } = await getWhoAmI()

        expect(getKVClient).not.toHaveBeenCalled()
        expect(mockRedisClient.get).not.toHaveBeenCalled()
        expect(body.rateLimits.complexity).toEqual({ enabled: false })
    })

    test('returns 200 with unavailable rate limit when redis fails', async () => {
        mockRedisClient.get.mockRejectedValue(new Error('redis down'))

        const { response, body } = await getWhoAmI({
            'x-forwarded-for': '198.51.100.8',
        })

        expect(response.status).toBe(200)
        expect(body.rateLimits.complexity).toEqual(expect.objectContaining({
            enabled: true,
            identity: 'ip',
            limit: 100,
            used: 0,
            remaining: 100,
            reset: null,
            window: '1h',
            error: 'unavailable',
        }))
        expect(mockLogger.error).toHaveBeenCalled()
    })

    test('returns unavailable when redis read stalls past timeout', async () => {
        mockRedisClient.get.mockImplementation(() => new Promise(() => {}))
        mockRedisClient.ttl.mockImplementation(() => new Promise(() => {}))

        const { response, body } = await getWhoAmI({
            'x-forwarded-for': '198.51.100.9',
        })

        expect(response.status).toBe(200)
        expect(getKVClient).toHaveBeenCalledWith('whoami')
        expect(body.rateLimits.complexity).toEqual(expect.objectContaining({
            enabled: true,
            error: 'unavailable',
            used: 0,
            remaining: 100,
        }))
        expect(mockLogger.error).toHaveBeenCalled()
    }, 10000)

    test('accepts x-target only when listed in X_TARGET_OPTIONS', async () => {
        const allowed = await getWhoAmI({ 'x-target': 'condo-app' })
        expect(allowed.body.target).toBe('condo-app')
        expect(allowed.body.headers['x-target']).toBe('condo-app')

        const denied = await getWhoAmI({ 'x-target': 'unknown-app' })
        expect(denied.body.target).toBeNull()
        expect(denied.body.headers['x-target']).toBe('unknown-app')
    })

    test('uses custom quota for authenticated user', async () => {
        const userId = faker.datatype.uuid()
        requestOverrides = { user: { id: userId } }
        conf.RATE_LIMIT_CONFIG = JSON.stringify({
            authedQuota: 1000,
            customQuotas: { [userId]: 42 },
            window: '30m',
        })
        mockRedisClient.get.mockResolvedValue('10')
        mockRedisClient.ttl.mockResolvedValue(-1)

        const { body } = await getWhoAmI()

        expect(mockRedisClient.get).toHaveBeenCalledWith(`rate-limit:user:${userId}`)
        expect(body.rateLimits.complexity).toEqual({
            enabled: true,
            identity: 'user',
            limit: 42,
            used: 10,
            remaining: 32,
            reset: null,
            window: '30m',
        })
    })
})
