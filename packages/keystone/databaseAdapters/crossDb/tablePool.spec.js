const { BalancingReplicaKnexAdapter } = require('../adapters/BalancingReplicaKnexAdapter/adapter')
const { KnexPool } = require('../adapters/BalancingReplicaKnexAdapter/pool')
const { isCrossDbPlannerEnabled } = require('./planner')
const {
    createTablePoolResolver,
    resolveTablePool,
} = require('./tablePool')

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

describe('tablePool (rules-only home pool)', () => {
    test('derives Message home pool from tableName routing rule', () => {
        const resolver = createTablePoolResolver({
            routingRules: multiPoolRoutingRules,
            replicaPoolsConfig: multiPoolsConfig,
        })

        expect(resolver.resolveTablePool('Message')).toEqual('message')
        expect(resolver.resolveTablePool('MessageHistoryRecord')).toEqual('message')
    })

    test('resolves User to default pool (not select→replicas)', () => {
        const resolver = createTablePoolResolver({
            routingRules: multiPoolRoutingRules,
            replicaPoolsConfig: multiPoolsConfig,
        })

        expect(resolver.resolveTablePool('User')).toEqual('main')
        expect(resolver.resolveTablePool('Ticket')).toEqual('main')
    })

    test('uses tableName rule when present, else default', () => {
        const resolver = createTablePoolResolver({
            routingRules: [
                { tableName: 'Message', target: 'message' },
                { target: 'main' },
            ],
            replicaPoolsConfig: multiPoolsConfig,
        })

        expect(resolver.resolveTablePool('Message')).toEqual('message')
        expect(resolver.resolveTablePool('User')).toEqual('main')
    })

    test('resolves kv-backed table via DATABASE_ROUTING_RULES and provider pool', () => {
        const resolver = createTablePoolResolver({
            routingRules: [
                { tableName: 'CachedUser', target: 'kv' },
                { target: 'main' },
            ],
            replicaPoolsConfig: {
                main: { databases: ['main'], writable: true },
                kv: { provider: 'kv', writable: false },
            },
        })

        expect(resolver.resolveTablePool('CachedUser')).toEqual('kv')
        expect(resolver.resolveTablePool('User')).toEqual('main')
    })

    test('resolveTablePool ignores operation-scoped rules for ownership', () => {
        expect(resolveTablePool({
            tableName: 'User',
            routingRules: multiPoolRoutingRules,
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
        adapter._tablePoolResolver = createTablePoolResolver({
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
