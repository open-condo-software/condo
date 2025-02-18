const Valkey = require('iovalkey')

const conf = require('@open-condo/config')

const { getRedisPrefix } = require('./redis')

describe('Key value adapter', () => {
    const OLD_ENV = JSON.parse(JSON.stringify(process.env))
    let client
    let nonPrefixedClient
    let moduleName

    beforeEach(() => {
        jest.resetModules()
        try {
            const url = conf['VALKEY_URL'] ? JSON.parse(conf['VALKEY_URL']) : JSON.parse(conf['REDIS_URL'])
            nonPrefixedClient = new Valkey.Cluster(url)
            process.env.VALKEY_URL = conf['VALKEY_URL'] ? conf['VALKEY_URL'] : conf['REDIS_URL']
        } catch (err) {
            // process.env.VALKEY_URL = '[{ "port":7001,"host":"127.0.0.1" }, { "port":7002, "host":"127.0.0.1" }, { "port":7003, "host":"127.0.0.1" }]'
            nonPrefixedClient = new Valkey(process.env.VALKEY_URL)
        }

        moduleName = require(process.cwd() + '/package.json').name.split('/').pop() + ':'

        jest.resetModules()

        const { getRedisClient } = require('./redis')
        client = getRedisClient('test')
    })

    afterEach(async () => {
        await client.flushdb()
        await client.disconnect()
        await nonPrefixedClient.disconnect()
    })

    afterAll(async () => {
        process.env = { ...OLD_ENV }
    })

    test.skip('Adapter should work with legacy environment', async () => {
        delete process.env.REDIS_URL
        delete process.env.VALKEY_URL
        expect(process.env.VALKEY_URL).toBeUndefined()
        expect(process.env.REDIS_URL).toBeUndefined()
        process.env.REDIS_URL = 'redis://127.0.0.1:7001'
        expect(process.env.REDIS_URL).toBe('redis://127.0.0.1:7001')
        jest.resetModules()

        const { getRedisClient } = require('./redis')

        const client = getRedisClient('newEnv')

        const ping = await client.ping()
        expect(ping).toEqual('PONG')
        expect(client).toHaveProperty('isCluster', false)
    })

    test('prefix should be the name of root package json', () => {
        expect(getRedisPrefix()).toEqual(moduleName)
    })

    test('key-value keyPrefix should be module specific', async () => {
        expect(client.options.keyPrefix).toMatch(moduleName)
    })

    test('default key-value client set all keys with prefix', async () => {
        await client.set('test1', 'result1')
        const result = await client.get('test1')
        expect(result).toMatch('result1')

        const result1 = await nonPrefixedClient.get('test1')
        expect(result1).toBeNull()

        const result2 = await nonPrefixedClient.get(`${moduleName}test1`)
        expect(result2).toMatch(result)
    })

    test('pipeline/multi operations should work as expected', async () => {
        const [[incrError, incrValue], [ttlError, ttlValue]] = await client
            .multi()
            .incrby('incrTest', 1)
            .ttl('incrTest')
            .exec()

        expect(incrError).toBeNull()
        expect(ttlError).toBeNull()
        expect(incrValue).toEqual(1)
        expect(ttlValue).toEqual(-1)
    })

    test('should work with oidc adapter', async () => {
        await client.rpush('testList', 1)
        const range = await client.lrange('testList', 0, -1)
        expect(range).toEqual(expect.arrayContaining(['1']))
        const multi = client.multi()
        await multi.rpush('testList', 2).expire('testList', 0).exec()

        const expiredKey = await client.keys('testList')
        expect(expiredKey).toHaveLength(0)
    })
})
