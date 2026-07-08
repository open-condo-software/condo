jest.mock('@open-condo/keystone/kv', () => ({
    getKVClient: jest.fn(),
}))

const { getKVClient } = require('@open-condo/keystone/kv')

const { KvDataProvider } = require('./kv')

const USER_FIXTURE = {
    u1: { id: 'u1', name: 'Alice', deletedAt: null },
    u2: { id: 'u2', name: 'Bob', deletedAt: '2024-06-01T00:00:00.000Z' },
    u3: { id: 'u3', name: 'Carol', deletedAt: null },
}

function createKvStore (entries = USER_FIXTURE) {
    const store = new Map(
        Object.entries(entries).map(([id, object]) => [`{User}:${id}`, JSON.stringify(object)]),
    )
    return {
        mget: jest.fn(async (keys) => keys.map((key) => store.get(key) ?? null)),
        _store: store,
    }
}

describe('KvDataProvider', () => {
    let provider

    beforeEach(() => {
        provider = new KvDataProvider()
        getKVClient.mockReset()
    })

    test('finds one record by id via mget', async () => {
        const kv = createKvStore()
        getKVClient.mockReturnValue(kv)

        const result = await provider.find({ schemaName: 'User', condition: { id: 'u1' } })

        expect(result).toEqual([USER_FIXTURE.u1])
        expect(kv.mget).toHaveBeenCalledWith(['{User}:u1'])
    })

    test('finds multiple records by id_in', async () => {
        const kv = createKvStore()
        getKVClient.mockReturnValue(kv)

        const result = await provider.find({
            schemaName: 'User',
            condition: { id_in: ['u1', 'u2', 'u3'] },
        })

        expect(result).toEqual([USER_FIXTURE.u1, USER_FIXTURE.u2, USER_FIXTURE.u3])
        expect(kv.mget).toHaveBeenCalledWith(['{User}:u1', '{User}:u2', '{User}:u3'])
    })

    test('filters soft-deleted records when deletedAt is null', async () => {
        const kv = createKvStore()
        getKVClient.mockReturnValue(kv)

        const result = await provider.find({
            schemaName: 'User',
            condition: { id_in: ['u1', 'u2', 'u3'], deletedAt: null },
        })

        expect(result).toEqual([USER_FIXTURE.u1, USER_FIXTURE.u3])
    })

    test('returns empty array for soft-deleted single id with deletedAt null filter', async () => {
        const kv = createKvStore()
        getKVClient.mockReturnValue(kv)

        const result = await provider.find({
            schemaName: 'User',
            condition: { id: 'u2', deletedAt: null },
        })

        expect(result).toEqual([])
    })

    test('returns empty array when id is missing in kv store', async () => {
        const kv = createKvStore()
        getKVClient.mockReturnValue(kv)

        const result = await provider.find({ schemaName: 'User', condition: { id: 'missing' } })

        expect(result).toEqual([])
        expect(kv.mget).toHaveBeenCalledWith(['{User}:missing'])
    })

    test('returns only existing records for partial id_in match', async () => {
        const kv = createKvStore()
        getKVClient.mockReturnValue(kv)

        const result = await provider.find({
            schemaName: 'User',
            condition: { id_in: ['u1', 'missing', 'u3'] },
        })

        expect(result).toEqual([USER_FIXTURE.u1, USER_FIXTURE.u3])
    })

    test('returns empty array for empty id_in', async () => {
        const kv = createKvStore()
        getKVClient.mockReturnValue(kv)

        const result = await provider.find({ schemaName: 'User', condition: { id_in: [] } })

        expect(result).toEqual([])
        expect(kv.mget).not.toHaveBeenCalled()
    })

    test('preserves id_in order in results', async () => {
        const kv = createKvStore()
        getKVClient.mockReturnValue(kv)

        const result = await provider.find({
            schemaName: 'User',
            condition: { id_in: ['u3', 'u1'] },
        })

        expect(result).toEqual([USER_FIXTURE.u3, USER_FIXTURE.u1])
    })

    test('throws on invalid JSON payload', async () => {
        const kv = createKvStore({ broken: { id: 'broken' } })
        kv._store.set('{User}:broken', 'not-json')
        getKVClient.mockReturnValue(kv)

        await expect(provider.find({ schemaName: 'User', condition: { id: 'broken' } }))
            .rejects
            .toThrow('Invalid JSON in KV object for User')
    })

    test('throws for unsupported filter shapes', async () => {
        await expect(provider.find({
            schemaName: 'User',
            condition: { name_contains: 'Alice' },
        })).rejects.toThrow('supports only { id }, { id_in }, and optional deletedAt: null filters')
    })

    test('canFind rejects deletedAt filters other than null', () => {
        expect(provider.canFind({ condition: { id: 'u1', deletedAt: '2024-01-01' } })).toBe(false)
    })

    test('canFind rejects arbitrary filter shapes', () => {
        expect(provider.canFind({ condition: { name_contains: 'x' } })).toBe(false)
    })

    test('canFind accepts id, id_in, and deletedAt null combinations', () => {
        expect(provider.canFind({ condition: { id: 'u1' } })).toBe(true)
        expect(provider.canFind({ condition: { id_in: ['u1', 'u2'] } })).toBe(true)
        expect(provider.canFind({ condition: { id_in: ['u1'], deletedAt: null } })).toBe(true)
    })

    test('uses native mget-compatible hash-tagged keys', () => {
        expect(provider._getObjectKey('User', 'u1')).toEqual('{User}:u1')
        expect(provider._getObjectKey('Message', 'm1')).toEqual('{Message}:m1')
    })
})
