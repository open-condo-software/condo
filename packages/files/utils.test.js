const { faker } = require('@faker-js/faker')

const {
    __test__,
    validateAndParseFileConfig,
    authHandler,
    rateLimitHandler,
    parseAndValidateMeta,
} = require('./utils')
const { MetaSchema, SharePayloadSchema } = __test__

const USER_UUID = faker.datatype.uuid()
const ORGANIZATION_UUID = faker.datatype.uuid()

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
    user: { id: USER_UUID },
    organization: { id: ORGANIZATION_UUID },
    fileClientId: 'condo',
    modelNames: ['Example'],
    ...overrides,
})

const baseShare = (overrides = {}) => ({
    dv: 1,
    sender: { dv: 1, fingerprint: 'device-ABC_123' },
    id: faker.datatype.uuid(),
    user: { id: USER_UUID },
    fileClientId: 'condo',
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
                    quota: { default: 100, whitelist: [], overrides: {} },
                }
                const out = validateAndParseFileConfig(data)
                expect(out).toEqual(data)
            })

            test('rejects invalid key format', () => {
                const data = {
                    clients: {
                        'condo app': { name: 'condo-app', secret: 'some-secret-string' },
                    },
                    quota: { default: 100 },
                }
                const result = validateAndParseFileConfig(data)
                expect(result).toMatchObject({})
            })

            test('rejects invalid value shape', () => {
                const data = { condo: 'not-an-object' }
                const result = validateAndParseFileConfig(data)
                expect(result).toMatchObject({})
            })

            test('should set defaults for quota props when quota omitted', () => {
                const out = validateAndParseFileConfig({
                    clients: { condo: { secret: 'some-secret-string' } },
                })

                expect(out).toHaveProperty(['clients', 'condo', 'secret'], 'some-secret-string')

                expect(out).toHaveProperty(['quota', 'default'], 100)
                expect(out).toHaveProperty(['quota', 'whitelist'])
                expect(out.quota.whitelist).toEqual([])
                expect(out).toHaveProperty(['quota', 'overrides'])
                expect(out.quota.overrides).toEqual({})
            })

            test('should honor provided quota.default', () => {
                const out = validateAndParseFileConfig({
                    clients: { condo: { secret: 'some-secret-string' } },
                    quota: { default: 5 },
                })

                expect(out).toHaveProperty(['clients', 'condo', 'secret'])
                expect(out).toHaveProperty(['quota', 'default'], 5)
                // missing props still defaulted
                expect(out.quota.whitelist).toEqual([])
                expect(out.quota.overrides).toEqual({})
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

            test('userId must be uuid', () => {
                const bad = MetaSchema.safeParse(baseMeta({ user: { id: 'nope' } }))
                expect(bad.success).toBe(false)
                expect(bad.error.issues[0].message.toLowerCase()).toMatch(/invalid uuid/)
            })

            test('fileClientId must be non-empty string', () => {
                const bad = MetaSchema.safeParse(baseMeta({ fileClientId: '' }))
                expect(bad.success).toBe(false)
                expect(bad.error.issues[0].message.toLowerCase()).toMatch('too small: expected string to have >=1 characters')
            })

            test('modelNames must be non-empty array of strings', () => {
                const bad = MetaSchema.safeParse(baseMeta({ modelNames: [] }))
                expect(bad.success).toBe(false)
                expect(bad.error.issues[0].message.toLowerCase()).toMatch('too small: expected array to have >=1 items')
            })
        })

        describe('InlineAttachPayloadSchema (direct)', () => {
            const { InlineAttachPayloadSchema } = __test__

            const base = () => ({
                dv: 1,
                sender: { dv: 1, fingerprint: 'device-ABC_123' },
                itemId: faker.datatype.uuid(),
                modelName: 'ExampleModel',
            })

            test('valid payload passes', () => {
                const ok = InlineAttachPayloadSchema.safeParse(base())
                expect(ok.success).toBe(true)
            })

            test('dv must equal 1', () => {
                const bad = InlineAttachPayloadSchema.safeParse({ ...base(), dv: 2 })
                expect(bad.success).toBe(false)
                expect(bad.error.issues[0].message).toMatch('Invalid input: expected 1')
            })

            test('sender.dv must equal 1', () => {
                const bad = InlineAttachPayloadSchema.safeParse({ ...base(), sender: { dv: 2, fingerprint: 'device-ABC_123' } })
                expect(bad.success).toBe(false)
                expect(bad.error.issues[0].message).toMatch('Invalid input: expected 1')
            })

            test('fingerprint must match regex', () => {
                const bad = InlineAttachPayloadSchema.safeParse({ ...base(), sender: { dv: 1, fingerprint: 'bad space' } })
                expect(bad.success).toBe(false)
                expect(bad.error.issues[0].message).toMatch(/Invalid string|Invalid/)
            })

            test('itemId must be uuid', () => {
                const bad = InlineAttachPayloadSchema.safeParse({ ...base(), itemId: 'nope' })
                expect(bad.success).toBe(false)
                expect(bad.error.issues[0].message.toLowerCase()).toMatch(/invalid uuid/)
            })

            test('modelName must be non-empty string', () => {
                const bad = InlineAttachPayloadSchema.safeParse({ ...base(), modelName: '' })
                expect(bad.success).toBe(false)
                expect(bad.error.issues[0].message.toLowerCase()).toMatch('too small: expected string to have >=1 characters')
            })
        })


        describe('SharePayloadSchema (direct)', () => {
            test('valid payload passes', () => {
                const ok = SharePayloadSchema.safeParse(baseShare())
                expect(ok.success).toBe(true)
            })

            test('dv must equal 1', () => {
                const bad = SharePayloadSchema.safeParse(baseShare({ dv: 2 }))
                expect(bad.success).toBe(false)
                expect(bad.error.issues[0].message).toMatch('Invalid input: expected 1')
            })

            test('sender.dv must equal 1', () => {
                const bad = SharePayloadSchema.safeParse(baseShare({ sender: { dv: 2, fingerprint: 'device-ABC_123' } }))
                expect(bad.success).toBe(false)
                expect(bad.error.issues[0].message).toMatch('Invalid input: expected 1')
            })

            test('fingerprint must match regex', () => {
                const bad = SharePayloadSchema.safeParse(baseShare({ sender: { dv: 1, fingerprint: 'bad space' } }))
                expect(bad.success).toBe(false)
                expect(bad.error.issues[0].message).toMatch(/Invalid string|Invalid/)
            })

            test('id must be uuid', () => {
                const bad = SharePayloadSchema.safeParse(baseShare({ id: 'nope' }))
                expect(bad.success).toBe(false)
                expect(bad.error.issues[0].message.toLowerCase()).toMatch(/invalid uuid/)
            })

            test('user id must be uuid', () => {
                const bad = SharePayloadSchema.safeParse(baseShare({ user: { id: 'nope' } }))
                expect(bad.success).toBe(false)
                expect(bad.error.issues[0].message.toLowerCase()).toMatch(/invalid uuid/)
            })

            test('fileClientId must be non-empty string', () => {
                const bad = SharePayloadSchema.safeParse(baseShare({ fileClientId: '' }))
                expect(bad.success).toBe(false)
                expect(bad.error.issues[0].message.toLowerCase()).toMatch('too small: expected string to have >=1 characters')
            })

            test('modelNames is optional, but when present must be non-empty array', () => {
                const okWithout = SharePayloadSchema.safeParse(baseShare({ modelNames: undefined }))
                expect(okWithout.success).toBe(true)

                const bad = SharePayloadSchema.safeParse(baseShare({ modelNames: [] }))
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
                const { req, next } = makeReqRes()
                const { onError, calls } = onErrorRunner()
                const metaStr = JSON.stringify(baseMeta())
                const result = parseAndValidateMeta(metaStr, req, next, onError)
                expect(calls.called).toBe(false)
                expect(result).toMatchObject(baseMeta())
            })

            test('rejects non-JSON string with 400 + parse message', () => {
                const { req, next } = makeReqRes()
                const { onError, calls } = onErrorRunner()
                parseAndValidateMeta('nope', req, next, onError)
                expect(calls.called).toBe(true)
                const lastCall = next.mock.calls[0]

                expect(lastCall).toHaveLength(1)
                expect(lastCall[0]).toEqual(expect.objectContaining({
                    name: 'GQLError',
                    extensions: expect.objectContaining({
                        code: 'BAD_USER_INPUT',
                        type: 'INVALID_META',
                    }),
                }))
            })

            test('rejects wrong type with 400', () => {
                const { req, next } = makeReqRes()
                const { onError, calls } = onErrorRunner()
                parseAndValidateMeta(42, req, next, onError)
                expect(calls.called).toBe(true)
                const lastCall = next.mock.calls[0]

                expect(lastCall).toHaveLength(1)
                expect(lastCall[0]).toEqual(expect.objectContaining({
                    name: 'GQLError',
                    extensions: expect.objectContaining({
                        code: 'BAD_USER_INPUT',
                        type: 'INVALID_META',
                    }),
                }))
            })

            test('rejects mismatch user id with 400', () => {
                const req = { user: { id: faker.datatype.uuid(), deletedAt: null } }
                const { next } = makeReqRes({ req })
                const { onError, calls } = onErrorRunner()
                parseAndValidateMeta(baseMeta(), req, next, onError)
                expect(calls.called).toBe(true)
                const lastCall = next.mock.calls[0]

                expect(lastCall).toHaveLength(1)
                expect(lastCall[0]).toEqual(expect.objectContaining({
                    name: 'GQLError',
                    extensions: expect.objectContaining({
                        code: 'BAD_USER_INPUT',
                        type: 'INVALID_META',
                    }),
                }))
            })

            test('modelNames should be non empty array', () => {
                const { req, next } = makeReqRes()
                const { onError } = onErrorRunner()
                parseAndValidateMeta(baseMeta({ modelNames: [] }), req, next, onError)
                const lastCall = next.mock.calls[0]

                expect(lastCall).toHaveLength(1)
                expect(lastCall[0]).toEqual(expect.objectContaining({
                    name: 'GQLError',
                    extensions: expect.objectContaining({
                        code: 'BAD_USER_INPUT',
                        type: 'INVALID_META',
                        message: 'Invalid file meta JSON object received',
                    }),
                }))
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
                const lastCall = next.mock.calls[0]

                expect(lastCall).toHaveLength(1)
                expect(lastCall[0]).toEqual(expect.objectContaining({
                    name: 'GQLError',
                    extensions: expect.objectContaining({
                        code: 'UNAUTHENTICATED',
                        type: 'AUTHORIZATION_REQUIRED',
                    }),
                }))
            })

            test('blocks deleted user', async () => {
                const { res, next } = makeReqRes({ req: { user: { id: 'x', deletedAt: 'now' } } })
                await authHandler()({ user: { id: 'x', deletedAt: 'now' } }, res, next)
                const lastCall = next.mock.calls[0]

                expect(lastCall).toHaveLength(1)
                expect(lastCall[0]).toEqual(expect.objectContaining({
                    name: 'GQLError',
                    extensions: expect.objectContaining({
                        code: 'UNAUTHENTICATED',
                        type: 'AUTHORIZATION_REQUIRED',
                    }),
                }))
            })
        })

        describe('rateLimitHandler', () => {
            test('allows under quota (using default)', async () => {
                const guard = { incrementHourCounter: jest.fn().mockResolvedValue(1) }
                const { req, res, next } = makeReqRes()
                await rateLimitHandler({ quota: { default: 10 }, guard })(req, res, next)
                expect(next).toHaveBeenCalled()
            })

            test('blocks when user over default quota', async () => {
                const guard = { incrementHourCounter: jest.fn().mockResolvedValueOnce(11) }
                const { req, res, next } = makeReqRes()
                await rateLimitHandler({ quota: { default: 10 }, guard })(req, res, next)
                const lastCall = next.mock.calls[0]

                expect(lastCall).toHaveLength(1)
                expect(lastCall[0]).toEqual(expect.objectContaining({
                    name: 'GQLError',
                    extensions: expect.objectContaining({
                        code: 'TOO_MANY_REQUESTS',
                        type: 'RATE_LIMIT_EXCEEDED',
                    }),
                }))
            })

            test('whitelisted user bypasses limiter and counter is not incremented', async () => {
                const guard = { incrementHourCounter: jest.fn() }
                const { req, res, next } = makeReqRes()
                await rateLimitHandler({ quota: { default: 1, whitelist: [USER_UUID], overrides: {} }, guard })(req, res, next)
                expect(guard.incrementHourCounter).not.toHaveBeenCalled()
                expect(next).toHaveBeenCalled()
            })

            test('per-user override is applied instead of default (allow at limit)', async () => {
                const guard = { incrementHourCounter: jest.fn().mockResolvedValue(5) }
                const { req, res, next } = makeReqRes()
                const overrides = { [USER_UUID]: 5 }
                await rateLimitHandler({ quota: { default: 2, overrides }, guard })(req, res, next)
                expect(next).toHaveBeenCalled()
            })

            test('per-user override blocks when exceeded', async () => {
                const guard = { incrementHourCounter: jest.fn().mockResolvedValue(6) }
                const { req, res, next } = makeReqRes()
                const overrides = { [USER_UUID]: 5 }
                await rateLimitHandler({ quota: { default: 100, overrides }, guard })(req, res, next)
                const lastCall = next.mock.calls[0]

                expect(lastCall).toHaveLength(1)
                expect(lastCall[0]).toEqual(expect.objectContaining({
                    name: 'GQLError',
                    extensions: expect.objectContaining({
                        code: 'TOO_MANY_REQUESTS',
                        type: 'RATE_LIMIT_EXCEEDED',
                    }),
                }))
            })
        })
    })
}

module.exports = { FileMiddlewareUtilsTests }
