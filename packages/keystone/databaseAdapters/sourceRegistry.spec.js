const { BalancingReplicaKnexAdapter } = require('./adapters/BalancingReplicaKnexAdapter/adapter')
const { KnexPool } = require('./adapters/BalancingReplicaKnexAdapter/pool')
const {
    createPoolBasedSourceRegistry,
    isCrossDbPlannerEnabled,
    resolveTablePool,
} = require('./sourceRegistry')

const multiPoolTables = {
    main: new Set(['User', 'Ticket', 'Organization', 'RemoteClient']),
    message: new Set(['Message', 'MessageHistoryRecord']),
    replicas: new Set(['User', 'Ticket', 'Organization', 'RemoteClient']),
}

const multiPoolRoutingRulesRaw = [
    { tableName: '^(Message|MessageHistoryRecord)$', target: 'message' },
    { target: 'main', gqlOperationType: 'mutation' },
    { target: 'replicas', sqlOperationName: 'select' },
    { target: 'main' },
]

const multiPoolRoutingRules = [
    { tableName: /^(Message|MessageHistoryRecord)$/, target: 'message' },
    { target: 'main', gqlOperationType: 'mutation' },
    { target: 'replicas', sqlOperationName: 'select' },
    { target: 'main' },
]

const multiPoolsConfig = {
    main: { databases: ['main'], writable: true },
    message: { databases: ['message'], writable: true },
    replicas: { databases: ['replica'], writable: false },
}

describe('source registry', () => {
    test('derives Message pool from DATABASE_POOLS introspection', () => {
        const registry = createPoolBasedSourceRegistry({
            poolTables: multiPoolTables,
            routingRules: multiPoolRoutingRules,
            replicaPoolsConfig: multiPoolsConfig,
        })

        expect(registry.resolveSource('Message')).toEqual('message')
        expect(registry.resolveSource('MessageHistoryRecord')).toEqual('message')
    })

    test('resolves User to writable main pool when table exists in main and replicas', () => {
        const registry = createPoolBasedSourceRegistry({
            poolTables: multiPoolTables,
            routingRules: multiPoolRoutingRules,
            replicaPoolsConfig: multiPoolsConfig,
        })

        expect(registry.resolveSource('User')).toEqual('main')
        expect(registry.resolveSource('Ticket')).toEqual('main')
    })

    test('uses routing rule when table is not present in pool introspection yet', () => {
        const registry = createPoolBasedSourceRegistry({
            poolTables: { main: new Set(['User']) },
            routingRules: [
                { tableName: 'Message', target: 'message' },
                { target: 'main' },
            ],
            replicaPoolsConfig: multiPoolsConfig,
        })

        expect(registry.resolveSource('Message')).toEqual('message')
        expect(registry.resolveSource('User')).toEqual('main')
    })

    test('resolves kv-backed table via DATABASE_ROUTING_RULES and provider pool', () => {
        const registry = createPoolBasedSourceRegistry({
            poolTables: {
                main: new Set(['User', 'Ticket']),
                kv: new Set(),
            },
            routingRules: [
                { tableName: 'CachedUser', target: 'kv' },
                { target: 'main' },
            ],
            replicaPoolsConfig: {
                main: { databases: ['main'], writable: true },
                kv: { provider: 'kv', writable: false },
            },
        })

        expect(registry.resolveSource('CachedUser')).toEqual('kv')
        expect(registry.resolveSource('User')).toEqual('main')
    })

    test('resolveTablePool picks writable pool for mirrored tables', () => {
        expect(resolveTablePool({
            tableName: 'User',
            poolTables: multiPoolTables,
            routingRules: multiPoolRoutingRules,
            replicaPoolsConfig: multiPoolsConfig,
            defaultPool: 'main',
        })).toEqual('main')
    })

    test('enables planner only for explicit true', () => {
        expect(isCrossDbPlannerEnabled('true')).toEqual(true)
        expect(isCrossDbPlannerEnabled('false')).toEqual(false)
        expect(isCrossDbPlannerEnabled(null)).toEqual(false)
    })
})

describe('BalancingReplicaKnexAdapter routing with main/message/replicas pools', () => {
    function createMultiPoolAdapter () {
        const mainPool = new KnexPool({
            knexClients: [{ poolTag: 'main' }],
            writable: true,
            balancer: 'RoundRobin',
            balancerOptions: {},
        })
        const messagePool = new KnexPool({
            knexClients: [{ poolTag: 'message' }],
            writable: true,
            balancer: 'RoundRobin',
            balancerOptions: {},
        })
        const replicaPool = new KnexPool({
            knexClients: [{ poolTag: 'replica' }],
            writable: false,
            balancer: 'RoundRobin',
            balancerOptions: {},
        })

        const adapter = new BalancingReplicaKnexAdapter({
            databaseUrl: 'custom:{"main":"postgresql://postgres:postgres@127.0.0.1:5432/main","message":"postgresql://postgres:postgres@127.0.0.1:5432/message","replica":"postgresql://postgres:postgres@127.0.0.1:5433/replica"}',
            replicaPools: multiPoolsConfig,
            routingRules: multiPoolRoutingRulesRaw,
        })

        adapter._replicaPools = { main: mainPool, message: messagePool, replicas: replicaPool }
        adapter._replicaPoolsConfig = multiPoolsConfig
        adapter._poolTables = multiPoolTables
        adapter._sourceRegistry = createPoolBasedSourceRegistry({
            poolTables: multiPoolTables,
            routingRules: multiPoolRoutingRules,
            replicaPoolsConfig: multiPoolsConfig,
        })

        return { adapter, mainPool, messagePool, replicaPool }
    }

    test.each([
        [
            'User SELECT uses async replica',
            'select "t0".* from "public"."User" as "t0" where true and ("t0"."deletedAt" is null) and ("t0"."id" = $1) limit $2',
            'replicaPool',
        ],
        [
            'User INSERT uses writable main',
            'insert into "public"."User" ("createdAt", "createdBy", "dv", "id", "name", "sender", "updatedAt", "updatedBy", "v") values ($1, $2, $3, $4, $5, $6, $7, $8, $9) returning *',
            'mainPool',
        ],
        [
            'Message SELECT uses dedicated message pool',
            'select "t0".* from "public"."Message" as "t0" where true and ("t0"."deletedAt" is null) and ("t0"."id" = $1) limit $2',
            'messagePool',
        ],
        [
            'Message INSERT uses message pool owner',
            'insert into "public"."Message" ("id", "type", "status") values ($1, $2, $3) returning *',
            'messagePool',
        ],
    ])('%s', (_, sql, expectedPoolKey) => {
        const pools = createMultiPoolAdapter()
        expect(pools.adapter._selectTargetPool(sql)).toBe(pools[expectedPoolKey])
    })

    test('executeFind on postgres table delegates to list adapter (replica routing stays in knex runner)', async () => {
        const { adapter } = createMultiPoolAdapter()
        const listAdapter = {
            find: jest.fn().mockResolvedValue([{ id: 'user-1', name: 'Alice' }]),
        }

        const rows = await adapter.executeFind({
            schemaName: 'User',
            condition: { id: 'user-1' },
            listAdapter,
        })

        expect(rows).toEqual([{ id: 'user-1', name: 'Alice' }])
        expect(listAdapter.find).toHaveBeenCalledWith({ id: 'user-1' })
    })
})
