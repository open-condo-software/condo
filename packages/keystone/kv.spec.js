const { faker } = require('@faker-js/faker')

const { getKVPrefix } = require('./kv')

describe('Key value adapter', () => {
    const OLD_ENV = JSON.parse(JSON.stringify(process.env))
    let client
    let nonPrefixedClient
    let moduleName

    beforeAll(() => {
        if (!process.env.KV_URL || !process.env.REDIS_URL) {
            process.env.REDIS_URL = JSON.stringify([{ 'port':7001, 'host':'127.0.0.1' }, { 'port':7002, 'host':'127.0.0.1' }, { 'port':7003, 'host':'127.0.0.1' }])
        }
        jest.resetModules()
        moduleName = require(process.cwd() + '/package.json').name.split('/').pop() + ':'

        const { getKVClient } = require('./kv')
        nonPrefixedClient = getKVClient('nonPrefixed', 'test', { kvOptions: {}, ignorePrefix: true })
        client = getKVClient('test')
    })

    afterAll(async () => {
        await client.disconnect()
        await nonPrefixedClient.disconnect()
    })

    afterAll(async () => {
        process.env = { ...OLD_ENV }
    })

    test('kv client should resolve cluster specific url', () => {
        const kvUrl = process.env.KV_URL || process.env.REDIS_URL

        expect(client).toHaveProperty('isCluster', !kvUrl.startsWith('redis') || !kvUrl.startsWith('valkey'))
    })

    test('prefix should be the name of root package json', () => {
        expect(getKVPrefix()).toEqual(moduleName)
    })

    test('key-value keyPrefix should be module specific', () => {
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
        const key = `incrTest:${faker.datatype.string(16)}`
        const incrStep = faker.datatype.number({ min: 1, max: 100 })

        const [[incrError, incrValue], [ttlError, ttlValue]] = await client
            .multi()
            .incrby(key, incrStep)
            .ttl(key)
            .exec()

        expect(incrError).toBeNull()
        expect(ttlError).toBeNull()
        expect(incrValue).toEqual(incrStep)
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
