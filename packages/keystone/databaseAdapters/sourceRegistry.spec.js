const {
    createPoolBasedSourceRegistry,
    isCrossDbPlannerEnabled,
    resolveTablePool,
} = require('./sourceRegistry')

describe('source registry', () => {
    const ciLikePoolTables = {
        main: new Set(['User', 'Ticket', 'Organization', 'RemoteClient']),
        message: new Set(['Message', 'MessageHistoryRecord']),
        replicas: new Set(['User', 'Ticket', 'Organization', 'RemoteClient']),
    }

    const ciLikeRoutingRules = [
        { tableName: /^(Message|MessageHistoryRecord)$/, target: 'message' },
        { target: 'main', gqlOperationType: 'mutation' },
        { target: 'replicas', sqlOperationName: 'select' },
        { target: 'main' },
    ]

    const ciLikePoolsConfig = {
        main: { databases: ['main'], writable: true },
        message: { databases: ['message'], writable: true },
        replicas: { databases: ['replica'], writable: false },
    }

    test('derives Message pool from DATABASE_POOLS introspection', () => {
        const registry = createPoolBasedSourceRegistry({
            poolTables: ciLikePoolTables,
            routingRules: ciLikeRoutingRules,
            replicaPoolsConfig: ciLikePoolsConfig,
        })

        expect(registry.resolveSource('Message')).toEqual('message')
        expect(registry.resolveSource('MessageHistoryRecord')).toEqual('message')
    })

    test('resolves User to writable main pool when table exists in main and replicas', () => {
        const registry = createPoolBasedSourceRegistry({
            poolTables: ciLikePoolTables,
            routingRules: ciLikeRoutingRules,
            replicaPoolsConfig: ciLikePoolsConfig,
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
            replicaPoolsConfig: ciLikePoolsConfig,
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
            poolTables: ciLikePoolTables,
            routingRules: ciLikeRoutingRules,
            replicaPoolsConfig: ciLikePoolsConfig,
            defaultPool: 'main',
        })).toEqual('main')
    })

    test('enables planner only for explicit true', () => {
        expect(isCrossDbPlannerEnabled('true')).toEqual(true)
        expect(isCrossDbPlannerEnabled('false')).toEqual(false)
        expect(isCrossDbPlannerEnabled(null)).toEqual(false)
    })
})
