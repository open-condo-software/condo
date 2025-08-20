const supertest = require('supertest')

const FileMiddlewareUnitTests = () => {
    jest.mock('@open-condo/config', () => ({}))
    jest.mock('./utils', () => ({
        RedisGuard: class {
            incrementHourCounter () { return Promise.resolve(1) }
        },
        authHandler: () => (req, res, next) => next(),
        rateLimitHandler: () => (req, res, next) => next(),
        parserHandler: () => (req, res, next) => { req.meta = {}; req.files = []; next() },
        fileStorageHandler: () => (req, res) => res.json({ ok: true, route: 'upload' }),
        attachHandler: () => (req, res) => res.status(200).send('OK'),
        validateAndParseAppClients: (data) => data,
    }))
    describe('file middleware unit tests', () => {
        let conf
        let FileMiddleware

        beforeEach(() => {
            jest.resetModules()
            conf = require('@open-condo/config')
            Object.keys(conf).forEach(k => delete conf[k])
            FileMiddleware = require('./fileMiddleware').FileMiddleware
        })

        test('loadQuota: accepts JSON string', () => {
            conf.FILE_QUOTA = JSON.stringify({ user: 5, ip: 7 })
            const mw = new FileMiddleware({})
            expect(mw.quota).toEqual({ user: 5, ip: 7 })
        })

        test('loadQuota: accepts object', () => {
            conf.FILE_QUOTA = { user: 9, ip: 11 }
            const mw = new FileMiddleware({})
            expect(mw.quota).toEqual({ user: 9, ip: 11 })
        })

        test('loadQuota: falls back to defaults on parse error', () => {
            conf.FILE_QUOTA = '{bad json'
            const mw = new FileMiddleware({})
            expect(mw.quota).toEqual({ user: 100, ip: 100 })
        })

        test('loadAppClients: accepts JSON string', () => {
            conf.FILE_APP_CLIENTS = JSON.stringify({
                condo: { name: 'condo-app', secret: 'some-secret-string' },
            })
            const mw = new FileMiddleware({})
            expect(mw.appClients).toMatchObject({
                condo: { name: 'condo-app', secret: 'some-secret-string' },
            })
        })

        test('loadAppClients: accepts object', () => {
            conf.FILE_APP_CLIENTS = {
                condo: { name: 'condo-app', secret: 'some-secret-string' },
            }
            const mw = new FileMiddleware({})
            expect(mw.appClients.condo.name).toBe('condo-app')
        })

        test('loadAppClients: disabled when missing', () => {
            delete conf.FILE_APP_CLIENTS
            const mw = new FileMiddleware({})
            expect(mw.appClients).toBeUndefined()
        })

        test('loadAppClients: throws on invalid JSON', () => {
            conf.FILE_APP_CLIENTS = '{not json'
            expect(() => new FileMiddleware({})).toThrow(
                'Unable to parse required FILE_APP_CLIENTS json from environment'
            )
        })

        test('prepareMiddleware: mounts routes that respond', async () => {
            conf = require('@open-condo/config')
            conf.FILE_APP_CLIENTS = {
                condo: { name: 'condo-app', secret: 'some-secret-string' },
            }
            const mw = new FileMiddleware({})
            const app = mw.prepareMiddleware({ keystone: {} })
            const request = supertest(app)

            const uploadRes = await request.post('/api/files/upload')
            expect(uploadRes.statusCode).toBe(200)
            expect(uploadRes.body).toEqual({ ok: true, route: 'upload' })

            const attachRes = await request.post('/api/files/attach')
            expect(attachRes.statusCode).toBe(200)
            expect(attachRes.text).toBe('OK')
        })

        test('loadAppClients: surfaces Zod issues as Error(JSON)', () => {
            jest.resetModules()
            conf = require('@open-condo/config')
            conf.FILE_APP_CLIENTS = { condo: { name: 'ok', secret: 'ok-secret' } }
            jest.doMock('./utils', () => {
                return {
                    RedisGuard: class { incrementHourCounter () { return Promise.resolve(1) } },
                    authHandler: () => (req, res, next) => next(),
                    rateLimitHandler: () => (req, res, next) => next(),
                    parserHandler: () => (req, res, next) => { req.meta = {}; req.files = []; next() },
                    fileStorageHandler: () => (req, res) => res.json({ ok: true }),
                    attachHandler: () => (req, res) => res.status(200).send('OK'),
                    validateAndParseAppClients: () => {
                        const err = new Error('ZodError')
                        err.name = 'ZodError'
                        err.issues = [{ path: ['condo', 'secret'], message: 'too short' }]
                        throw err
                    },
                }
            })
            const { FileMiddleware: MW } = require('./fileMiddleware')
            expect(() => new MW({})).toThrow(JSON.stringify([{ path: ['condo', 'secret'], message: 'too short' }]))
        })
    })
}

module.exports = { FileMiddlewareUnitTests }
