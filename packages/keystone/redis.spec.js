const Redis = require('ioredis')

const conf = require('@open-condo/config')

const { getRedisPrefix } = require('./redis')

describe('Redis adapter', () => {
    const OLD_ENV = JSON.parse(JSON.stringify(process.env))
    let redisClient
    let nonPrefixedClient
    let moduleName

    beforeAll(() => {

        jest.resetModules()
        process.env.REDIS_URL = conf['REDIS_URL'] || 'redis://127.0.0.1:6379'
        process.env.REDIS_FALLBACK_CONFIG = conf['REDIS_FALLBACK_CONFIG'] || '{"enabled": true}'

        moduleName = require(process.cwd() + '/package.json').name.split('/').pop() + ':'

        const { getRedisClient } = require('./redis')
        redisClient = getRedisClient('test')
        nonPrefixedClient = new Redis(process.env.REDIS_URL)
    })

    afterAll(async () => {
        await nonPrefixedClient.del('test')
        await nonPrefixedClient.del(`${moduleName}test1`)
        await nonPrefixedClient.del(`${moduleName}incrTest`)
        await nonPrefixedClient.del(`${moduleName}testList`)
        await nonPrefixedClient.del('someNewFallbackPrefix:test')
        await nonPrefixedClient.disconnect()
        await redisClient.disconnect()

        process.env = { ...OLD_ENV }
    })

    test('prefix should be the name of root package json', () => {
        expect(getRedisPrefix()).toEqual(moduleName)
    })

    test('prefix might be redefined via REDIS_PREFIX env variable', () => {
        jest.resetModules()
        process.env.REDIS_URL = conf['REDIS_URL'] || 'redis://127.0.0.1:6379'
        process.env.REDIS_FALLBACK_CONFIG = conf['REDIS_FALLBACK_CONFIG'] || '{"enabled": true}'
        process.env.REDIS_PREFIX = ':some-New-Prefix:'

        const { getRedisPrefix } = require('./redis')
        expect(getRedisPrefix()).toEqual('some_New_Prefix:')

        jest.resetModules()
        process.env.REDIS_URL = conf['REDIS_URL'] || 'redis://127.0.0.1:6379'
        process.env.REDIS_FALLBACK_CONFIG = conf['REDIS_FALLBACK_CONFIG'] || '{"enabled": true}'
        process.env.REDIS_PREFIX = ''
    })

    test('adapter should fallback to REDIS_FALLBACK_CONFIG[\'prefix\'] ', async () => {
        jest.resetModules()
        process.env.REDIS_URL = conf['REDIS_URL'] || 'redis://127.0.0.1:6379'
        process.env.REDIS_FALLBACK_CONFIG = '{"enabled": true, "prefix": "someNewFallbackPrefix"}'
        process.env.REDIS_PREFIX = 'another_prefix_migrate_to'

        const { getRedisClient, getRedisPrefix } = require('@open-condo/keystone/redis')

        expect(getRedisPrefix()).toEqual('another_prefix_migrate_to:')
        const newPrefixedRedisClient = getRedisClient('newPrefixedRedisClient')

        await nonPrefixedClient.set('someNewFallbackPrefix:test', 1)
        const operationResult = await nonPrefixedClient.get('someNewFallbackPrefix:test')

        expect(operationResult).toEqual('1')

        const fallbackResult = await newPrefixedRedisClient.get('test')

        expect(fallbackResult).toEqual(operationResult)

        await newPrefixedRedisClient.disconnect()
        jest.resetModules()
        process.env.REDIS_URL = conf['REDIS_URL'] || 'redis://127.0.0.1:6379'
        process.env.REDIS_FALLBACK_CONFIG = conf['REDIS_FALLBACK_CONFIG'] || '{"enabled": true}'
        process.env.REDIS_PREFIX = ''
    })


    test('redis keyPrefix should be module specific', async () => {
        expect(redisClient.options.keyPrefix).toMatch(moduleName)
    })

    test('redis handles non prefixed key with fallback enabled', async () => {
        await nonPrefixedClient.set('test', 'result')
        const res = await nonPrefixedClient.get('test')
        expect(res).toMatch('result')

        const key = await redisClient.get('test')
        expect(key).toMatch(res)
    })

    test('default redis client set all keys with prefix', async () => {
        await redisClient.set('test1', 'result1')
        const result = await redisClient.get('test1')
        expect(result).toMatch('result1')

        const result1 = await nonPrefixedClient.get('test1')
        expect(result1).toBeNull()

        const result2 = await nonPrefixedClient.get(`${moduleName}test1`)
        expect(result2).toMatch(result)
    })

    test('pipeline/multi operations should work as expected', async () => {
        const [[incrError, incrValue], [ttlError, ttlValue]] = await redisClient
            .multi()
            .incrby('incrTest', 1)
            .ttl('incrTest')
            .exec()

        expect(incrError).toBeNull()
        expect(ttlError).toBeNull()
        expect(incrValue).toEqual(1)
        expect(ttlValue).toEqual(-1)
    })

    test('redis should work with oidc adapter', async () => {
        await redisClient.rpush('testList', 1)
        const key = await nonPrefixedClient.keys(`${moduleName}testList`)
        expect(key).toEqual(expect.arrayContaining([`${moduleName}testList`]))
        const range = await redisClient.lrange('testList', 0, -1)
        expect(range).toEqual(expect.arrayContaining(['1']))
        const multi = redisClient.multi()
        await multi.rpush('testList', 2).expire('testList', 0).exec()

        const expiredKey = await redisClient.keys('testList')
        expect(expiredKey).toHaveLength(0)
    })
})
