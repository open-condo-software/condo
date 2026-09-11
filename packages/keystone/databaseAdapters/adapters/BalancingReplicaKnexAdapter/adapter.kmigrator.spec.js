const { createKmigratorKnexAdapter } = require('@open-condo/keystone/databaseAdapters/utils')

const { BalancingReplicaKnexAdapter } = require('./adapter')
const { isDefaultRule } = require('./utils/env')

const { createTablePoolResolver } = require('../../crossDb/tablePool')

jest.mock('./utils/knex', () => ({
    initKnexClient: jest.fn(async () => ({
        raw: jest.fn(),
        destroy: jest.fn(),
        context: { transaction: jest.fn() },
        client: { runner: jest.fn() },
    })),
}))

jest.mock('./pool', () => ({
    KnexPool: jest.fn().mockImplementation(({ knexClients }) => ({
        getKnexClient: () => knexClients[0],
        getQueryRunner: jest.fn(),
        _writable: true,
    })),
}))

describe('createKmigratorKnexAdapter', () => {
    test('returns kmigrator stub with required methods', () => {
        const knex = { schema: { withSchema: jest.fn(() => 'schemaBuilder') } }
        const listAdapters = {
            Foo: {
                fieldAdapters: [{ path: 'name', listAdapter: null }],
                fieldAdaptersByPath: { name: { path: 'name', listAdapter: null } },
            },
        }
        const getListAdapterByKey = jest.fn()
        const rels = [{ left: { listKey: 'Foo', path: 'name' }, right: { listKey: 'Foo', path: 'name' } }]

        const stub = createKmigratorKnexAdapter({
            knex,
            listAdapters,
            getListAdapterByKey,
            rels,
            schemaName: 'public',
        })

        expect(stub.knex).toBe(knex)
        expect(stub.schemaName).toBe('public')
        expect(stub.rels).toHaveLength(rels.length)
        expect(typeof stub.schema).toBe('function')
        expect(typeof stub._createTables).toBe('function')
        expect(typeof stub.getListAdapterByKey).toBe('function')
        expect(stub.schema()).toBe('schemaBuilder')
        expect(knex.schema.withSchema).toHaveBeenCalledWith('public')
        expect(stub.listAdapters.Foo.parentAdapter).toBe(stub)
        expect(stub.listAdapters.Foo.fieldAdapters[0].listAdapter).toBe(stub.listAdapters.Foo)
        expect(stub.listAdapters.Foo.fieldAdaptersByPath.name.listAdapter).toBe(stub.listAdapters.Foo)
        expect(stub.getListAdapterByKey('Foo')).toBe(stub.listAdapters.Foo)
        expect(stub.rels[0].left.adapter).toBe(stub.listAdapters.Foo.fieldAdaptersByPath.name)
        expect(stub.rels[0].right.adapter).toBe(stub.listAdapters.Foo.fieldAdaptersByPath.name)
    })
})

describe('BalancingReplicaKnexAdapter.__kmigratorKnexAdapters', () => {
    const mainKnex = { id: 'main-knex', destroy: jest.fn() }
    const externalKnex = { id: 'external-knex', destroy: jest.fn() }
    const replicaKnex = { id: 'replica-knex', destroy: jest.fn() }

    function createConnectedAdapter () {
        const adapter = new BalancingReplicaKnexAdapter({
            databaseUrl: 'custom:{"main":"postgresql://u:p@127.0.0.1:5432/main","external":"postgresql://u:p@127.0.0.1:5433/external"}',
            replicaPools: '{"main":{"databases":["main"],"writable":true},"external":{"databases":["external"],"writable":true}}',
            routingRules: '[{"target":"main"}]',
        })

        adapter.listAdapters = {}
        adapter.getListAdapterByKey = jest.fn()
        adapter.rels = [{ left: { listKey: 'Foo' }, right: { listKey: 'Bar' } }]
        adapter._knexClients = {
            main: mainKnex,
            external: externalKnex,
        }
        adapter._routingRules = [{ target: 'main' }]
        adapter._replicaPoolsConfig = {
            main: { databases: ['main'], writable: true },
            external: { databases: ['external'], writable: true },
        }

        return adapter
    }

    test('throws if adapter is not connected', () => {
        const adapter = new BalancingReplicaKnexAdapter({
            databaseUrl: 'custom:{"main":"postgresql://u:p@127.0.0.1:5432/main"}',
            replicaPools: '{"main":{"databases":["main"],"writable":true}}',
            routingRules: '[{"target":"main"}]',
        })

        expect(() => adapter.__kmigratorKnexAdapters()).toThrow('not connected')
    })

    test('returns one kmigrator stub per named database', () => {
        const adapter = createConnectedAdapter()
        const stubs = adapter.__kmigratorKnexAdapters()

        expect(stubs).toHaveLength(2)
        expect(stubs[0].dbName).toBe('external')
        expect(stubs[0].knex).toBe(externalKnex)
        expect(stubs[0].rels).toHaveLength(adapter.rels.length)
        expect(stubs[1].dbName).toBe('main')
        expect(stubs[1].knex).toBe(mainKnex)
        expect(stubs[1].rels).toHaveLength(adapter.rels.length)
        stubs.forEach((stub) => {
            expect(typeof stub._createTables).toBe('function')
            expect(typeof stub.schema).toBe('function')
            expect(typeof stub.getListAdapterByKey).toBe('function')
        })
    })

    test('places default pool database last for kmigrator connection file', () => {
        const adapter = createConnectedAdapter()
        const defaultRule = adapter._routingRules.find(rule => isDefaultRule(rule))
        const defaultDbName = adapter._replicaPoolsConfig[defaultRule.target].databases[0]

        expect(defaultDbName).toBe('main')

        const stubs = adapter.__kmigratorKnexAdapters()
        expect(stubs[stubs.length - 1].knex).toBe(mainKnex)
    })

    test('skips read-only replica databases', () => {
        const adapter = new BalancingReplicaKnexAdapter({
            databaseUrl: 'custom:{"main":"postgresql://u:p@127.0.0.1:5432/main","replica":"postgresql://u:p@127.0.0.1:5433/replica"}',
            replicaPools: '{"main":{"databases":["main"],"writable":true},"replicas":{"databases":["replica"],"writable":false}}',
            routingRules: '[{"target":"main"}]',
        })

        adapter.listAdapters = {}
        adapter.getListAdapterByKey = jest.fn()
        adapter._knexClients = {
            main: mainKnex,
            replica: replicaKnex,
        }
        adapter._routingRules = [{ target: 'main' }]
        adapter._replicaPoolsConfig = {
            main: { databases: ['main'], writable: true },
            replicas: { databases: ['replica'], writable: false },
        }

        const stubs = adapter.__kmigratorKnexAdapters()

        expect(stubs).toHaveLength(1)
        expect(stubs[0].dbName).toBe('main')
        expect(stubs[0].knex).toBe(mainKnex)
    })

    test('skips writable provider pools without databases', () => {
        const adapter = new BalancingReplicaKnexAdapter({
            databaseUrl: 'custom:{"main":"postgresql://u:p@127.0.0.1:5432/main"}',
            replicaPools: '{"main":{"databases":["main"],"writable":true},"kv":{"provider":"kv","writable":true}}',
            routingRules: '[{"target":"main"}]',
        })

        adapter.listAdapters = {}
        adapter.getListAdapterByKey = jest.fn()
        adapter._knexClients = { main: mainKnex }
        adapter._routingRules = [{ target: 'main' }]
        adapter._replicaPoolsConfig = {
            main: { databases: ['main'], writable: true },
            kv: { provider: 'kv', writable: true },
        }

        const stubs = adapter.__kmigratorKnexAdapters()

        expect(stubs).toHaveLength(1)
        expect(stubs[0].dbName).toBe('main')
    })

    test('skips writable provider pools that list redis DATABASE_URL names', () => {
        const adapter = new BalancingReplicaKnexAdapter({
            databaseUrl: 'custom:{"main":"postgresql://u:p@127.0.0.1:5432/main","cache":"redis://127.0.0.1:6379/6"}',
            replicaPools: '{"main":{"databases":["main"],"writable":true},"kv":{"provider":"kv","databases":["cache"],"writable":true}}',
            routingRules: '[{"target":"main"}]',
        })

        adapter.listAdapters = {}
        adapter.getListAdapterByKey = jest.fn()
        adapter._knexClients = { main: mainKnex }
        adapter._routingRules = [{ target: 'main' }]
        adapter._replicaPoolsConfig = {
            main: { databases: ['main'], writable: true },
            kv: { provider: 'kv', writable: true, databases: ['cache'] },
        }

        const stubs = adapter.__kmigratorKnexAdapters()

        expect(stubs).toHaveLength(1)
        expect(stubs[0].dbName).toBe('main')
        expect(stubs[0].knex).toBe(mainKnex)
    })

    test('migrates every writable postgres database so each holds the full schema', () => {
        const adapter = createConnectedAdapter()

        expect(adapter._getKmigratorDatabaseNames()).toEqual(['external', 'main'])
    })
})

describe('BalancingReplicaKnexAdapter.resolveTableDatabase', () => {
    function createRoutedAdapter () {
        const adapter = new BalancingReplicaKnexAdapter({
            databaseUrl: 'custom:{"main":"postgresql://u:p@127.0.0.1:5432/main","message":"postgresql://u:p@127.0.0.1:5432/message"}',
            replicaPools: '{"main":{"databases":["main"],"writable":true},"message":{"databases":["message"],"writable":true}}',
            routingRules: '[{"tableName":"^(Message|MessageHistoryRecord)$","target":"message"},{"target":"main"}]',
        })
        adapter._tablePoolResolver = createTablePoolResolver({
            routingRules: adapter._routingRules,
            replicaPoolsConfig: adapter._replicaPoolsConfig,
        })
        return adapter
    }

    test('maps a table to the database of its home pool', () => {
        const adapter = createRoutedAdapter()

        expect(adapter.resolveTableDatabase('Message')).toBe('message')
        expect(adapter.resolveTableDatabase('MessageHistoryRecord')).toBe('message')
        expect(adapter.resolveTableDatabase('User')).toBe('main')
    })

    test('pools sharing one database resolve to the same database', () => {
        const adapter = new BalancingReplicaKnexAdapter({
            databaseUrl: 'custom:{"main":"postgresql://u:p@127.0.0.1:5432/main"}',
            replicaPools: '{"main":{"databases":["main"],"writable":true},"historical":{"databases":["main"],"writable":true}}',
            routingRules: '[{"tableName":"^.+HistoryRecord$","target":"historical"},{"target":"main"}]',
        })
        adapter._tablePoolResolver = createTablePoolResolver({
            routingRules: adapter._routingRules,
            replicaPoolsConfig: adapter._replicaPoolsConfig,
        })

        // Different pools, one database: FKs between them stay satisfiable
        expect(adapter.resolveTableDatabase('TicketHistoryRecord')).toBe('main')
        expect(adapter.resolveTableDatabase('Ticket')).toBe('main')
    })
})

describe('BalancingReplicaKnexAdapter._selectTargetPoolName', () => {
    test('delegates to first matching DATABASE_ROUTING_RULES via _routeToPoolName', () => {
        const adapter = Object.create(BalancingReplicaKnexAdapter.prototype)

        adapter._routeToPoolName = jest.fn(({ tableName, sqlOperationName }) => {
            if (tableName === 'Message') return 'message'
            if (sqlOperationName === 'select') return 'replicas'
            return 'main'
        })

        expect(adapter._selectTargetPoolName('select "t0".* from "public"."Message" as "t0"'))
            .toBe('message')
        expect(adapter._selectTargetPoolName('select "t0".* from "public"."User" as "t0"'))
            .toBe('replicas')

        expect(adapter._routeToPoolName).toHaveBeenCalledWith(expect.objectContaining({
            tableName: 'Message',
            sqlOperationName: 'select',
        }))
        expect(adapter._routeToPoolName).toHaveBeenCalledWith(expect.objectContaining({
            tableName: 'User',
            sqlOperationName: 'select',
        }))
    })
})
