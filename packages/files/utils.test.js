const { faker } = require('@faker-js/faker')

const {
    __test__,
    validateAndParseAppClients,
    authHandler,
    rateLimitHandler,
} = require('./utils')
const { parseAndValidateMeta, extractRequestIp } = __test__

const USER_UUID = faker.datatype.uuid()

function makeReqRes (overrides = {}) {
    const req = {
        is: () => 'multipart/form-data',
        user: { id: USER_UUID, deletedAt: null },
        ip: '::ffff:127.0.0.1',
        ...overrides.req,
    }
    const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
        ...overrides.res,
    }
    const next = jest.fn()
    return { req, res, next }
}

function onErrorRunner () {
    const calls = { called: false }
    const onError = (fn) => { calls.called = true; fn() }
    return { onError, calls }
}

const baseMeta = (overrides = {}) => ({
    dv: 1,
    sender: { dv: 1, fingerprint: 'device-ABC_123' },
    authedItem: USER_UUID,
    appId: 'condo',
    modelNames: ['Example'],
    ...overrides,
})

const FileMiddlewareUtilsTests = () => {
    describe('file middleware utils', () => {
        describe('validateAndParseAppClients', () => {
            test('accepts valid map', () => {
                const data = {
                    condo: { name: 'condo-app', secret: 'some-secret-string' },
                }
                const out = validateAndParseAppClients(data)
                expect(out).toEqual(data)
            })

            test('rejects invalid key format', () => {
                const data = {
                    'condo app': { name: 'condo-app', secret: 'some-secret-string' },
                }
                expect(() => validateAndParseAppClients(data)).toThrow()
            })

            test('rejects invalid value shape', () => {
                const data = {
                    condo: 'not-an-object',
                }
                expect(() => validateAndParseAppClients(data)).toThrow()
            })
        })

        describe('parseAndValidateMeta', () => {
            test('accepts valid meta object', () => {
                const { req, res } = makeReqRes()
                const { onError, calls } = onErrorRunner()
                const meta = baseMeta()
                const result = parseAndValidateMeta(meta, req, res, onError)

                expect(calls.called).toBe(false)
                expect(result).toEqual(meta)
                expect(res.status).not.toHaveBeenCalled()
            })

            test('accepts valid meta JSON string', () => {
                const { req, res } = makeReqRes()
                const { onError, calls } = onErrorRunner()
                const metaStr = JSON.stringify(baseMeta())
                const result = parseAndValidateMeta(metaStr, req, res, onError)
                expect(calls.called).toBe(false)
                expect(result).toMatchObject(baseMeta())
            })

            test('rejects non-JSON string', () => {
                const { req, res } = makeReqRes()
                const { onError } = onErrorRunner()
                parseAndValidateMeta('nope', req, res, onError)
                expect(res.status).toHaveBeenCalledWith(400)
                expect(res.json).toHaveBeenCalledWith({ error: 'Invalid type for the "meta" multipart field' })
            })

            test('rejects wrong type', () => {
                const { req, res } = makeReqRes()
                const { onError } = onErrorRunner()
                parseAndValidateMeta(42, req, res, onError)
                expect(res.status).toHaveBeenCalledWith(400)
            })

            test('rejects missing dv', () => {
                const { req, res } = makeReqRes()
                const { onError } = onErrorRunner()
                parseAndValidateMeta(baseMeta({ dv: undefined }), req, res, onError)
                expect(res.json).toHaveBeenCalledWith({ error: 'Missing dv field for meta object' })
            })

            test('rejects missing sender', () => {
                const { req, res } = makeReqRes()
                const { onError } = onErrorRunner()
                parseAndValidateMeta(baseMeta({ sender: undefined }), req, res, onError)
                expect(res.json).toHaveBeenCalledWith({ error: 'Missing sender field for meta object' })
            })

            test('rejects wrong sender fields', () => {
                const { req, res } = makeReqRes()
                const { onError } = onErrorRunner()
                parseAndValidateMeta(baseMeta({ sender: { dv: 'x', fingerprint: 1 } }), req, res, onError)
                expect(res.json).toHaveBeenCalledWith({
                    error: 'Wrong sender field data. Correct format is { "dv": 1, "fingerprint": "uniq-device-or-container-id" }',
                })
            })

            test('rejects dv not equal to 1', () => {
                const { req, res } = makeReqRes()
                const { onError } = onErrorRunner()
                parseAndValidateMeta(baseMeta({ dv: 2, sender: { dv: 2, fingerprint: 'device-ABC_123' } }), req, res, onError)
                expect(res.json).toHaveBeenCalledWith({ error: 'Wrong value for data version number' })
            })

            test('rejects bad fingerprint', () => {
                const { req, res } = makeReqRes()
                const { onError } = onErrorRunner()
                parseAndValidateMeta(baseMeta({ sender: { dv: 1, fingerprint: 'bad space' } }), req, res, onError)
                expect(res.json).toHaveBeenCalledWith({ error: 'Wrong sender.fingerprint value provided' })
            })

            test('rejects missing authedItem', () => {
                const { req, res } = makeReqRes()
                const { onError } = onErrorRunner()
                parseAndValidateMeta(baseMeta({ authedItem: undefined }), req, res, onError)
                expect(res.json).toHaveBeenCalledWith({ error: 'Missing authedItem field for meta object' })
            })

            test('rejects non-UUID authedItem', () => {
                const { req, res } = makeReqRes()
                const { onError } = onErrorRunner()
                parseAndValidateMeta(baseMeta({ authedItem: 'nope' }), req, res, onError)
                expect(res.json).toHaveBeenCalledWith({ error: 'Wrong authedItem value provided' })
            })

            test('rejects authedItem mismatch', () => {
                const uuid = faker.datatype.uuid()
                const { res } = makeReqRes({ req: { user: { id: uuid, deletedAt: null } } })
                const { onError } = onErrorRunner()
                parseAndValidateMeta(baseMeta(), { user: { id: uuid } }, res, onError)
                expect(res.json).toHaveBeenCalledWith({ error: 'Wrong authedItem. Unable to upload file for another user' })
            })

            test('rejects missing appId', () => {
                const { req, res } = makeReqRes()
                const { onError } = onErrorRunner()
                parseAndValidateMeta(baseMeta({ appId: undefined }), req, res, onError)
                expect(res.json).toHaveBeenCalledWith({ error: 'Missing appId field for meta object' })
            })

            test('rejects missing modelNames', () => {
                const { req, res } = makeReqRes()
                const { onError } = onErrorRunner()
                parseAndValidateMeta(baseMeta({ modelNames: undefined }), req, res, onError)
                expect(res.json).toHaveBeenCalledWith({ error: 'Missing modelNames field for meta object' })
            })
        })

        describe('extractRequestIp', () => {
            test('handles IPv6-style forwarded ip with IPv4 tail', () => {
                const ip = extractRequestIp({ ip: '::ffff:10.0.0.5' })
                expect(ip).toBe('10.0.0.5')
            })

            test('handles plain IPv4', () => {
                const ip = extractRequestIp({ ip: '192.168.1.10' })
                expect(ip).toBe('192.168.1.10')
            })
        })

        describe('authHandler', () => {
            test('allows valid user', async () => {
                const { req, res, next } = makeReqRes()
                await authHandler()(req, res, next)
                expect(next).toHaveBeenCalled()
            })

            test('blocks missing user', async () => {
                const { res, next } = makeReqRes({ req: { user: null } })
                await authHandler()({ user: null }, res, next)
                expect(res.status).toHaveBeenCalledWith(403)
                expect(res.json).toHaveBeenCalledWith({ error: 'Authorization is required' })
                expect(next).not.toHaveBeenCalled()
            })

            test('blocks deleted user', async () => {
                const { res, next } = makeReqRes({ req: { user: { id: 'x', deletedAt: 'now' } } })
                await authHandler()({ user: { id: 'x', deletedAt: 'now' } }, res, next)
                expect(res.status).toHaveBeenCalledWith(403)
                expect(next).not.toHaveBeenCalled()
            })
        })

        describe('rateLimitHandler', () => {
            test('allows under quota', async () => {
                const guard = { incrementHourCounter: jest.fn().mockResolvedValue(1) }
                const { req, res, next } = makeReqRes()
                await rateLimitHandler({ quota: { user: 10, ip: 10 }, guard })(req, res, next)
                expect(next).toHaveBeenCalled()
            })

            test('blocks when user over quota', async () => {
                const guard = { incrementHourCounter: jest.fn()
                    .mockResolvedValueOnce(11)
                    .mockResolvedValueOnce(1),
                }
                const { req, res, next } = makeReqRes()
                await rateLimitHandler({ quota: { user: 10, ip: 10 }, guard })(req, res, next)
                expect(res.status).toHaveBeenCalledWith(429)
                expect(next).not.toHaveBeenCalled()
            })

            test('blocks when ip over quota', async () => {
                const guard = { incrementHourCounter: jest.fn()
                    .mockResolvedValueOnce(1)
                    .mockResolvedValueOnce(999),
                }
                const { req, res, next } = makeReqRes()
                await rateLimitHandler({ quota: { user: 10, ip: 10 }, guard })(req, res, next)
                expect(res.status).toHaveBeenCalledWith(429)
                expect(next).not.toHaveBeenCalled()
            })
        })
    })
}

module.exports = { FileMiddlewareUtilsTests }
