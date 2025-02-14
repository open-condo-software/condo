const Valkey = require('iovalkey')

const conf = require('@open-condo/config')

const { getRedisPrefix } = require('./redis')

describe('Redis adapter', () => {
    const OLD_ENV = JSON.parse(JSON.stringify(process.env))
    let redisClient
    let nonPrefixedClient
    let moduleName

    beforeAll(() => {

        jest.resetModules()
        try {
            const url = conf['VALKEY_URL'] ? JSON.parse(conf['VALKEY_URL']) : JSON.parse(conf['REDIS_URL'])
            nonPrefixedClient = new Valkey.Cluster(url)
            process.env.VALKEY_URL = conf['VALKEY_URL'] ? conf['VALKEY_URL'] : conf['REDIS_URL']
        } catch (err) {
            process.env.VALKEY_URL = conf['VALKEY_URL'] || conf['REDIS_URL'] || [{ 'port':7001, 'host':'127.0.0.1' }, { 'port':7002, 'host':'127.0.0.1' }, { 'port':7003, 'host':'127.0.0.1' }]
            nonPrefixedClient = new Valkey(process.env.VALKEY_URL)
        }

        moduleName = require(process.cwd() + '/package.json').name.split('/').pop() + ':'

        const { getRedisClient } = require('./redis')
        redisClient = getRedisClient('test')
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


    test('redis keyPrefix should be module specific', async () => {
        expect(redisClient.options.keyPrefix).toMatch(moduleName)
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
        const range = await redisClient.lrange('testList', 0, -1)
        expect(range).toEqual(expect.arrayContaining(['1']))
        const multi = redisClient.multi()
        await multi.rpush('testList', 2).expire('testList', 0).exec()

        const expiredKey = await redisClient.keys('testList')
        expect(expiredKey).toHaveLength(0)
    })
})
