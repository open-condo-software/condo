const { faker } = require('@faker-js/faker')

const {
    __test__,
    validateAndParseFileConfig,
    authHandler,
    rateLimitHandler,
} = require('./utils')
const { parseAndValidateMeta, extractRequestIp, MetaSchema } = __test__

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
        describe('validateAndParseFileConfig', () => {
            test('accepts valid config', () => {
                const data = {
                    clients: {
                        condo: { name: 'condo-app', secret: 'some-secret-string' },
                    },
                    quota: { user: 100, ip: 100 },
                }
                const out = validateAndParseFileConfig(data)
                expect(out).toEqual(data)
            })

            test('rejects invalid key format', () => {
                const data = {
                    clients: {
                        'condo app': { name: 'condo-app', secret: 'some-secret-string' },
                    },
                    quota: { user: 100, ip: 100 },
                }
                const result = validateAndParseFileConfig(data)
                expect(result).toMatchObject({})
            })

            test('rejects invalid value shape', () => {
                const data = { condo: 'not-an-object' }
                const result = validateAndParseFileConfig(data)
                expect(result).toMatchObject({})
            })

            test('should set defaults for quota props', () => {
                const defaultQuota = validateAndParseFileConfig({
                    clients: { condo: { secret: 'some-secret-string' } },
                })

                expect(defaultQuota).toHaveProperty(['clients', 'condo', 'secret'])
                expect(defaultQuota).toHaveProperty(['quota', 'user'], 100)
                expect(defaultQuota).toHaveProperty(['quota', 'ip'], 100)

                const ipQuota = validateAndParseFileConfig({
                    clients: { condo: { secret: 'some-secret-string' } },
                    quota: { ip: 2 },
                })
                expect(ipQuota).toHaveProperty(['clients', 'condo', 'secret'])
                expect(ipQuota).toHaveProperty(['quota', 'user'], 100)
                expect(ipQuota).toHaveProperty(['quota', 'ip'], 2)

                const userQuota = validateAndParseFileConfig({
                    clients: { condo: { secret: 'some-secret-string' } },
                    quota: { user: 5 },
                })

                expect(userQuota).toHaveProperty(['clients', 'condo', 'secret'])
                expect(userQuota).toHaveProperty(['quota', 'user'], 5)
                expect(userQuota).toHaveProperty(['quota', 'ip'], 100)
            })
        })


        describe('MetaSchema (direct)', () => {
            test('valid meta passes', () => {
                const ok = MetaSchema.safeParse(baseMeta())
                expect(ok.success).toBe(true)
            })

            test('dv must equal 1', () => {
                const bad = MetaSchema.safeParse(baseMeta({ dv: 2 }))
                expect(bad.success).toBe(false)
                expect(bad.error.issues[0].message).toMatch('Invalid input: expected 1')
            })

            test('sender.dv must equal 1', () => {
                const bad = MetaSchema.safeParse(baseMeta({ sender: { dv: 2, fingerprint: 'device-ABC_123' } }))
                expect(bad.success).toBe(false)
                expect(bad.error.issues[0].message).toMatch('Invalid input: expected 1')
            })

            test('fingerprint must match regex', () => {
                const bad = MetaSchema.safeParse(baseMeta({ sender: { dv: 1, fingerprint: 'bad space' } }))
                expect(bad.success).toBe(false)
                expect(bad.error.issues[0].message).toMatch(/Invalid string|Invalid/)
            })

            test('authedItem must be uuid', () => {
                const bad = MetaSchema.safeParse(baseMeta({ authedItem: 'nope' }))
                expect(bad.success).toBe(false)
                expect(bad.error.issues[0].message.toLowerCase()).toMatch(/invalid uuid/)
            })

            test('appId must be non-empty string', () => {
                const bad = MetaSchema.safeParse(baseMeta({ appId: '' }))
                expect(bad.success).toBe(false)
                expect(bad.error.issues[0].message.toLowerCase()).toMatch('too small: expected string to have >=1 characters')
            })

            test('modelNames must be non-empty array of strings', () => {
                const bad = MetaSchema.safeParse(baseMeta({ modelNames: [] }))
                expect(bad.success).toBe(false)
                expect(bad.error.issues[0].message.toLowerCase()).toMatch('too small: expected array to have >=1 items')
            })
        })

        describe('parseAndValidateMeta (via middleware helper)', () => {
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

            test('rejects non-JSON string with 400 + parse message', () => {
                const { req, res } = makeReqRes()
                const { onError } = onErrorRunner()
                parseAndValidateMeta('nope', req, res, onError)
                expect(res.status).toHaveBeenCalledWith(400)
                expect(res.json).toHaveBeenCalledWith({ error: 'Invalid type for the "meta" multipart field' })
            })

            test('rejects wrong type with 400', () => {
                const { req, res } = makeReqRes()
                const { onError } = onErrorRunner()
                parseAndValidateMeta(42, req, res, onError)
                expect(res.status).toHaveBeenCalledWith(400)
            })

            test('rejects mismatch authedItem with 403', () => {
                const req = { user: { id: faker.datatype.uuid(), deletedAt: null } }
                const { res } = makeReqRes({ req })
                const { onError } = onErrorRunner()
                parseAndValidateMeta(baseMeta(), req, res, onError)
                expect(res.status).toHaveBeenCalledWith(403)
                expect(res.json).toHaveBeenCalledWith({ error: 'Wrong authedItem. Unable to upload file for another user' })
            })

            test('400 error returns first Zod message', () => {
                const { req, res } = makeReqRes()
                const { onError } = onErrorRunner()
                parseAndValidateMeta(baseMeta({ modelNames: [] }), req, res, onError)
                expect(res.status).toHaveBeenCalledWith(400)
                const msg = res.json.mock.calls[0][0].error
                expect(typeof msg).toBe('string')
                expect(msg.length).toBeGreaterThan(0)
            })
        })

        // ----------------- extractRequestIp -----------------

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

        // ----------------- authHandler & rateLimitHandler -----------------

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
                    .mockResolvedValueOnce(11) // user
                    .mockResolvedValueOnce(1),  // ip (won't be reached)
                }
                const { req, res, next } = makeReqRes()
                await rateLimitHandler({ quota: { user: 10, ip: 10 }, guard })(req, res, next)
                expect(res.status).toHaveBeenCalledWith(429)
                expect(next).not.toHaveBeenCalled()
            })

            test('blocks when ip over quota', async () => {
                const guard = { incrementHourCounter: jest.fn()
                    .mockResolvedValueOnce(1)   // user
                    .mockResolvedValueOnce(999), // ip
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
