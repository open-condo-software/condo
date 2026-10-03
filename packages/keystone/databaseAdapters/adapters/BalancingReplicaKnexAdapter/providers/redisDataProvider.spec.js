jest.mock('@open-condo/keystone/kv', () => ({
    getKVClient: jest.fn(),
}))

const { getKVClient } = require('@open-condo/keystone/kv')

const { RedisDataProvider } = require('./redisDataProvider')

describe('RedisDataProvider', () => {
    test('executes simple id find via mget', async () => {
        const mget = jest.fn().mockResolvedValue([JSON.stringify({ id: 'u1', name: 'John' })])
        getKVClient.mockReturnValue({ mget })
        const provider = new RedisDataProvider()

        const result = await provider.find({ schemaName: 'User', condition: { id: 'u1' } })
        expect(result).toEqual([{ id: 'u1', name: 'John' }])
        expect(mget).toHaveBeenCalledWith(['User:u1'])
    })

    test('does not support arbitrary filter shapes', () => {
        const provider = new RedisDataProvider()
        expect(provider.supportsFind({ condition: { name_contains: 'x' } })).toBe(false)
    })
})
