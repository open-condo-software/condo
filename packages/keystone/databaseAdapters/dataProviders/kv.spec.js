jest.mock('@open-condo/keystone/kv', () => ({
    getKVClient: jest.fn(),
}))

const { getKVClient } = require('@open-condo/keystone/kv')

const {
    executeProviderSqlMutation,
    executeProviderSqlSelect,
} = require('./executeProviderSql')
const { KvDataProvider } = require('./kv')

const { BalancingReplicaKnexAdapter } = require('../adapters/BalancingReplicaKnexAdapter/adapter')
const { createPoolBasedSourceRegistry } = require('../sourceRegistry')

const USER_FIXTURE = {
    u1: { id: 'u1', name: 'Alice', deletedAt: null },
    u2: { id: 'u2', name: 'Bob', deletedAt: '2024-06-01T00:00:00.000Z' },
    u3: { id: 'u3', name: 'Carol', deletedAt: null },
}

const KEYSTONE_USER_INSERT_SQL =
    'insert into "public"."CachedUser" ("createdAt", "createdBy", "dv", "id", "name", "sender", "updatedAt", "updatedBy", "v") values ($1, $2, $3, $4, $5, $6, $7, $8, $9) returning *'

const KEYSTONE_USER_SELECT_BY_ID_SQL =
    'select "t0".* from "public"."CachedUser" as "t0" where true and ("t0"."deletedAt" is null) and ("t0"."id" = $1) limit $2'

const KEYSTONE_USER_UPDATE_SQL =
    'update "public"."CachedUser" set "name" = $1, "v" = $2, "updatedAt" = $3, "updatedBy" = $4, "dv" = $5, "sender" = $6 where "id" = $7 returning *'

function createKvStore (entries = USER_FIXTURE, schemaName = 'User') {
    const store = new Map(
        Object.entries(entries).map(([id, object]) => [`{${schemaName}}:${id}`, JSON.stringify(object)]),
    )

    return {
        mget: async (keys) => keys.map((key) => store.get(key) ?? null),
        get: async (key) => store.get(key) ?? null,
        set: async (key, value, mode) => {
            if (mode === 'NX' && store.has(key)) return null
            store.set(key, value)
            return 'OK'
        },
        // Mirrors UPDATE_SCRIPT semantics used by KvDataProvider.update
        eval: async (_script, _numKeys, key, patchJson, id) => {
            const existingRaw = store.get(key)
            if (existingRaw == null) return false
            const existing = JSON.parse(existingRaw)
            const patch = JSON.parse(patchJson)
            const merged = { ...existing, ...patch, id }
            const mergedJson = JSON.stringify(merged)
            store.set(key, mergedJson)
            return mergedJson
        },
        _store: store,
    }
}

function createKvBackedAdapter () {
    const adapter = new BalancingReplicaKnexAdapter({
        databaseUrl: 'custom:{"main":"postgresql://postgres:postgres@127.0.0.1:5432/main"}',
        replicaPools: {
            main: { databases: ['main'], writable: true },
            kv: { provider: 'kv', writable: true },
        },
        routingRules: [
            { tableName: 'CachedUser', target: 'kv' },
            { target: 'main' },
        ],
    })
    adapter._replicaPoolsConfig = {
        main: { databases: ['main'], writable: true },
        kv: { provider: 'kv', writable: true },
    }
    adapter._poolTables = {
        main: new Set(['User']),
        kv: new Set(),
    }
    adapter._sourceRegistry = createPoolBasedSourceRegistry({
        poolTables: adapter._poolTables,
        routingRules: adapter._routingRules,
        replicaPoolsConfig: adapter._replicaPoolsConfig,
    })
    return adapter
}

function createPostgresListAdapterStub () {
    return {
        find: jest.fn(() => {
            throw new Error('postgres list adapter find should not be called for KV-backed table')
        }),
        itemsQuery: jest.fn(() => {
            throw new Error('postgres list adapter itemsQuery should not be called for KV-backed table')
        }),
        _create: jest.fn(() => {
            throw new Error('postgres list adapter _create should not be called for KV-backed table')
        }),
        _update: jest.fn(),
        _delete: jest.fn(),
    }
}

describe('KvDataProvider', () => {
    let provider

    beforeEach(() => {
        provider = new KvDataProvider()
        getKVClient.mockReset()
    })

    describe('find', () => {
        test.each([
            [
                'single id',
                { id: 'u1' },
                [USER_FIXTURE.u1],
            ],
            [
                'id_in with soft-delete filter',
                { id_in: ['u1', 'u2', 'u3'], deletedAt: null },
                [USER_FIXTURE.u1, USER_FIXTURE.u3],
            ],
            [
                'partial id_in match',
                { id_in: ['u1', 'missing', 'u3'] },
                [USER_FIXTURE.u1, USER_FIXTURE.u3],
            ],
            [
                'empty id_in',
                { id_in: [] },
                [],
            ],
        ])('%s', async (_, condition, expected) => {
            const kv = createKvStore()
            getKVClient.mockReturnValue(kv)

            const result = await provider.find({ schemaName: 'User', condition })

            expect(result).toEqual(expected)
        })

        test('throws on unsupported filter shapes', async () => {
            await expect(provider.find({
                schemaName: 'User',
                condition: { name_contains: 'Alice' },
            })).rejects.toThrow('supports only { id }, { id_in }, and optional deletedAt: null filters')
        })

        test('throws on invalid JSON payload', async () => {
            const kv = createKvStore()
            kv._store.set('{User}:broken', 'not-json')
            getKVClient.mockReturnValue(kv)

            await expect(provider.find({ schemaName: 'User', condition: { id: 'broken' } }))
                .rejects
                .toThrow('Invalid JSON in KV object for User')
        })
    })

    describe('write lifecycle', () => {
        test('create, update, and soft-delete round-trip in KV store', async () => {
            const kv = createKvStore({})
            getKVClient.mockReturnValue(kv)

            const created = await provider.create({
                schemaName: 'User',
                data: { id: 'new-1', name: 'New', deletedAt: null },
            })
            expect(created).toEqual({ id: 'new-1', name: 'New', deletedAt: null })
            expect(JSON.parse(kv._store.get('{User}:new-1'))).toEqual(created)

            const updated = await provider.update({
                schemaName: 'User',
                id: 'new-1',
                data: { name: 'Renamed' },
            })
            expect(updated.name).toEqual('Renamed')
            expect(JSON.parse(kv._store.get('{User}:new-1')).name).toEqual('Renamed')

            const deleted = await provider.delete({ schemaName: 'User', id: 'new-1' })
            expect(deleted.deletedAt).toEqual(expect.any(String))

            const visibleRows = await provider.find({
                schemaName: 'User',
                condition: { id: 'new-1', deletedAt: null },
            })
            expect(visibleRows).toEqual([])
        })

        test('rejects create when id already exists', async () => {
            getKVClient.mockReturnValue(createKvStore())

            await expect(provider.create({ schemaName: 'User', data: USER_FIXTURE.u1 }))
                .rejects
                .toThrow('KV object already exists')
        })
    })
})

describe('executeProviderSql with KvDataProvider', () => {
    let provider

    beforeEach(() => {
        provider = new KvDataProvider()
        getKVClient.mockReset()
        getKVClient.mockReturnValue(createKvStore({}, 'CachedUser'))
    })

    test('GraphQL insert SQL persists row readable by id select SQL', async () => {
        const insertBindings = [
            '2026-01-01T00:00:00.000Z',
            'creator-id',
            1,
            'cached-1',
            'Cached Alice',
            { dv: 1 },
            '2026-01-01T00:00:00.000Z',
            'creator-id',
            1,
        ]

        const insertResult = await executeProviderSqlMutation({
            provider,
            schemaName: 'CachedUser',
            sqlOperationName: 'insert',
            sql: KEYSTONE_USER_INSERT_SQL,
            bindings: insertBindings,
        })

        expect(insertResult.rows).toEqual([{
            createdAt: insertBindings[0],
            createdBy: insertBindings[1],
            dv: insertBindings[2],
            id: insertBindings[3],
            name: insertBindings[4],
            sender: insertBindings[5],
            updatedAt: insertBindings[6],
            updatedBy: insertBindings[7],
            v: insertBindings[8],
        }])

        const selectResult = await executeProviderSqlSelect({
            provider,
            schemaName: 'CachedUser',
            sql: KEYSTONE_USER_SELECT_BY_ID_SQL,
            bindings: ['cached-1', 1],
        })

        expect(selectResult.rows).toEqual([expect.objectContaining({
            id: 'cached-1',
            name: 'Cached Alice',
        })])
    })

    test('GraphQL update SQL mutates stored document', async () => {
        getKVClient.mockReturnValue(createKvStore({
            u1: { id: 'u1', name: 'Alice', deletedAt: null, v: 1 },
        }, 'CachedUser'))

        const updateBindings = ['Bob', 2, '2026-01-02T00:00:00.000Z', 'editor-id', 1, { dv: 1 }, 'u1']
        const updateResult = await executeProviderSqlMutation({
            provider,
            schemaName: 'CachedUser',
            sqlOperationName: 'update',
            sql: KEYSTONE_USER_UPDATE_SQL,
            bindings: updateBindings,
        })

        expect(updateResult.rows).toEqual([expect.objectContaining({ id: 'u1', name: 'Bob', v: 2 })])

        const selectResult = await executeProviderSqlSelect({
            provider,
            schemaName: 'CachedUser',
            sql: KEYSTONE_USER_SELECT_BY_ID_SQL,
            bindings: ['u1', 1],
        })

        expect(selectResult.rows[0].name).toEqual('Bob')
    })

    test('rejects COUNT queries on provider pool', async () => {
        const countSql =
            'select count(*) as "count" from (select * from "public"."CachedUser" as "t0" where ("t0"."deletedAt" is null)) as "unused_alias"'

        await expect(executeProviderSqlSelect({
            provider,
            schemaName: 'CachedUser',
            sql: countSql,
            bindings: [],
        })).rejects.toThrow('does not support COUNT queries')
    })
})

describe('BalancingReplicaKnexAdapter KV delegation', () => {
    let adapter
    let listAdapter

    beforeEach(() => {
        adapter = createKvBackedAdapter()
        listAdapter = createPostgresListAdapterStub()
        getKVClient.mockReset()
        getKVClient.mockReturnValue(createKvStore({}, 'CachedUser'))
    })

    test('executeCreate and executeFind persist CachedUser in KV without touching postgres adapter', async () => {
        const row = await adapter.executeCreate({
            schemaName: 'CachedUser',
            data: { id: 'cached-2', name: 'From adapter', deletedAt: null },
            listAdapter,
        })

        expect(row).toEqual({ id: 'cached-2', name: 'From adapter', deletedAt: null })

        const rows = await adapter.executeFind({
            schemaName: 'CachedUser',
            condition: { id: 'cached-2' },
            listAdapter,
        })

        expect(rows).toEqual([{ id: 'cached-2', name: 'From adapter', deletedAt: null }])
        expect(listAdapter._create).not.toHaveBeenCalled()
        expect(listAdapter.find).not.toHaveBeenCalled()
    })

    test('executeItemsQuery falls back to list adapter for unsupported KV filters', async () => {
        const listAdapterWithFallback = {
            ...listAdapter,
            itemsQuery: jest.fn().mockResolvedValue([{ id: 'from-sql' }]),
        }

        const rows = await adapter.executeItemsQuery({
            schemaName: 'CachedUser',
            args: { where: { name_contains: 'Alice' } },
            meta: false,
            from: {},
            listAdapter: listAdapterWithFallback,
        })

        expect(rows).toEqual([{ id: 'from-sql' }])
        expect(listAdapterWithFallback.itemsQuery).toHaveBeenCalled()
    })

    test('executeItemsQuery returns count meta from KV rows', async () => {
        getKVClient.mockReturnValue(createKvStore({
            u1: { id: 'u1', name: 'Alice', deletedAt: null },
            u2: { id: 'u2', name: 'Bob', deletedAt: null },
        }, 'CachedUser'))

        const result = await adapter.executeItemsQuery({
            schemaName: 'CachedUser',
            args: { where: { id_in: ['u1', 'u2'] } },
            meta: true,
            from: {},
            listAdapter,
        })

        expect(result).toEqual({ count: 2 })
    })

    test('executeItemsQuery applies first and skip on provider rows', async () => {
        getKVClient.mockReturnValue(createKvStore({
            u1: { id: 'u1', name: 'Alice', deletedAt: null },
            u2: { id: 'u2', name: 'Bob', deletedAt: null },
            u3: { id: 'u3', name: 'Carol', deletedAt: null },
        }, 'CachedUser'))

        const rows = await adapter.executeItemsQuery({
            schemaName: 'CachedUser',
            args: { where: { id_in: ['u1', 'u2', 'u3'] }, sortBy: ['id_ASC'], skip: 1, first: 1 },
            meta: false,
            from: {},
            listAdapter,
        })

        expect(rows).toEqual([{ id: 'u2', name: 'Bob', deletedAt: null }])
    })
})
