const { faker } = require('@faker-js/faker')
const connectRedis = require('connect-redis')
const dayjs = require('dayjs')
const session = require('express-session')
const Valkey = require('iovalkey')

const conf = require('@open-condo/config')
const { setSession, destroySession } = require('@open-condo/keystone/session')

const RedisStore = connectRedis(session)


describe('session', () => {
    /** @type {RedisStore}  */
    let sessionStore
    let client
    beforeAll(async () => {
        try {
            const url = conf['VALKEY_URL'] ? JSON.parse(conf['VALKEY_URL']) : JSON.parse(conf['REDIS_URL'])
            client = new Valkey.Cluster(url)
        } catch (err) {
            client = new Valkey(conf.VALKEY_URL || conf.REDIS_URL)
        }

        sessionStore = new RedisStore({ client })
    })

    test('setSession', async () => {
        const sessionId = faker.random.alphaNumeric(8)
        const userId = faker.datatype.uuid()
        const ttl = 19 * 24 * 60 * 60 * 1000 // 19 dayjs
        const expiresAt = dayjs().add(ttl)
        const additionalFieldKey = faker.random.alphaNumeric(8)
        const additionalFieldValue = faker.random.alphaNumeric(8)

        await setSession(sessionStore, {
            sessionId,
            keystoneItemId: userId,
            expires: expiresAt.toISOString(),
            additionalFields: {
                [additionalFieldKey]: additionalFieldValue,
            },
        })

        const storedValueJSON = await client.get(`sess:${sessionId}`)
        expect(storedValueJSON).toBeDefined()
        const storedValue = JSON.parse(storedValueJSON)
        const expiresAtISO = expiresAt.toISOString()
        expect(storedValue).toEqual(expect.objectContaining({
            [additionalFieldKey]: additionalFieldValue,
            keystoneListKey: 'User',
            keystoneItemId: userId,
            cookie: expect.objectContaining({
                // Do not check for milliseconds for less random errors in tests
                // Because actual time in cookie can differ in few milliseconds
                expires: expect.stringContaining(expiresAtISO.slice(0, expiresAtISO.length - 5)),
                httpOnly: true,
                path: '/',
                sameSite: 'Lax',
            }),
        }))

        const keyTtl = await client.pttl(`sess:${sessionId}`)
        expect(keyTtl).toBeGreaterThan(0)
        const resultInMinutes = keyTtl / 1000 / 60
        const ttlInMinutes = ttl / 1000 / 60
        expect(resultInMinutes).toBeCloseTo(ttlInMinutes)
    })

    test('destroySession', async () => {
        const sessionId = faker.random.alphaNumeric(8)
        const userId = faker.datatype.uuid()
        const ttl = 19 * 24 * 60 * 60 * 1000 // 19 dayjs
        const expiresAt = dayjs().add(ttl)
        const additionalFieldKey = faker.random.alphaNumeric(8)
        const additionalFieldValue = faker.random.alphaNumeric(8)

        await setSession(sessionStore, {
            sessionId,
            keystoneItemId: userId,
            cookieOptions: { expires: expiresAt.toISOString() },
            additionalFields: {
                [additionalFieldKey]: additionalFieldValue,
            },
        })

        const storedValueJSON = await client.get(`sess:${sessionId}`)
        expect(storedValueJSON).toBeDefined()

        await destroySession(sessionStore, sessionId)
        const storedValueAfterDestroyJSON = await client.get(`sess:${sessionId}`)
        expect(storedValueAfterDestroyJSON).toBeNull()
    })

})
