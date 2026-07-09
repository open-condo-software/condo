const { BalancingReplicaKnexAdapter } = require('./adapter')
const { isDefaultRule } = require('./utils/env')

const { createKmigratorKnexAdapter } = require('../../utils/kmigratorKnexAdapter')

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
        const listAdapters = {}
        const getListAdapterByKey = jest.fn()
        const rels = [{ left: { listKey: 'Foo' }, right: { listKey: 'Bar' } }]

        const stub = createKmigratorKnexAdapter({
            knex,
            listAdapters,
            getListAdapterByKey,
            rels,
            schemaName: 'public',
        })

        expect(stub.knex).toBe(knex)
        expect(stub.schemaName).toBe('public')
        expect(stub.rels).toBe(rels)
        expect(typeof stub.schema).toBe('function')
        expect(typeof stub._createTables).toBe('function')
        expect(stub.getListAdapterByKey).toBe(getListAdapterByKey)
        expect(stub.schema()).toBe('schemaBuilder')
        expect(knex.schema.withSchema).toHaveBeenCalledWith('public')
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
        expect(stubs[0].rels).toBe(adapter.rels)
        expect(stubs[1].dbName).toBe('main')
        expect(stubs[1].knex).toBe(mainKnex)
        expect(stubs[1].rels).toBe(adapter.rels)
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
})
