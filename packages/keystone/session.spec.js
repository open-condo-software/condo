const { faker } = require('@faker-js/faker')
const connectRedis = require('connect-redis')
const dayjs = require('dayjs')
const session = require('express-session')
const IORedis = require('ioredis')

const conf = require('@open-condo/config')
const { setSession, destroySession } = require('@open-condo/keystone/session')

const RedisStore = connectRedis(session)


describe('session', () => {
    /** @type {RedisStore}  */
    let sessionStore
    let redisClient
    beforeAll(async () => {
        redisClient = new IORedis(conf.REDIS_URL)
        sessionStore = new RedisStore({ client: redisClient })
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

        const storedValueJSON = await redisClient.get(`sess:${sessionId}`)
        expect(storedValueJSON).toBeDefined()
        const storedValue = JSON.parse(storedValueJSON)
        expect(storedValue).toEqual(expect.objectContaining({
            [additionalFieldKey]: additionalFieldValue,
            keystoneListKey: 'User',
            keystoneItemId: userId,
            cookie: expect.objectContaining({
                expires: expiresAt.toISOString(),
                httpOnly: true,
                path: '/',
                sameSite: 'Lax',
            }),
        }))

        const keyTtl = await redisClient.pttl(`sess:${sessionId}`)
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

        const storedValueJSON = await redisClient.get(`sess:${sessionId}`)
        expect(storedValueJSON).toBeDefined()

        await destroySession(sessionStore, sessionId)
        const storedValueAfterDestroyJSON = await redisClient.get(`sess:${sessionId}`)
        expect(storedValueAfterDestroyJSON).toBeNull()
    })

})
