const {
    collectCrossSourceForeignKeys,
    extractMutationColumnValues,
    validateCrossSourceReferences,
} = require('./validateCrossSourceReferences')

const {
    normalizePositionalBindings,
    parseLiteralNode,
} = require('./sqlAstUtils')

const { createPoolBasedSourceRegistry } = require('../sourceRegistry')


function createMessageListAdapter () {
    return {
        fieldAdapters: [
            { isRelationship: true, refListKey: 'User', path: 'user', rel: { columnName: 'user' } },
            { isRelationship: true, refListKey: 'RemoteClient', path: 'remoteClient', rel: { columnName: 'remoteClient' } },
            { isRelationship: true, refListKey: 'Organization', path: 'organization', rel: { columnName: 'organization' } },
            { isRelationship: false, path: 'type' },
        ],
    }
}

function createGetPoolByName ({ existingIdsByTable = {} } = {}) {
    return () => ({
        getKnexClient: () => (tableName) => ({
            select: () => ({
                where: ({ id }) => ({
                    first: async () => {
                        const rows = existingIdsByTable[tableName] || []
                        return rows.find(row => row.id === id) || null
                    },
                }),
                whereIn: async (column, ids) => {
                    const idSet = new Set(ids)
                    const rows = existingIdsByTable[tableName] || []
                    return rows.filter(row => idSet.has(row.id))
                },
            }),
        }),
    })
}

describe('validateCrossSourceReferences', () => {
    const poolsConfig = {
        main: { databases: ['main'], writable: true },
        message: { databases: ['message'], writable: true },
    }

    const sourceRegistry = createPoolBasedSourceRegistry({
        poolTables: {
            main: new Set(['User', 'RemoteClient', 'Organization']),
            message: new Set(['Message']),
        },
        routingRules: [
            { tableName: 'Message', target: 'message' },
            { target: 'main' },
        ],
        replicaPoolsConfig: poolsConfig,
    })

    describe('collectCrossSourceForeignKeys', () => {
        test('returns only relationships whose ref table is on another source', () => {
            const fields = collectCrossSourceForeignKeys({
                listKey: 'Message',
                listAdapter: createMessageListAdapter(),
                sourceRegistry,
            })

            expect(fields).toEqual([
                { columnName: 'user', refListKey: 'User' },
                { columnName: 'remoteClient', refListKey: 'RemoteClient' },
                { columnName: 'organization', refListKey: 'Organization' },
            ])
        })

        test('returns empty list when all relationships are on the same source', () => {
            const sameSourceRegistry = createPoolBasedSourceRegistry({
                poolTables: { main: new Set(['Message', 'User']) },
                routingRules: [{ target: 'main' }],
                replicaPoolsConfig: { main: { databases: ['main'], writable: true } },
            })

            expect(collectCrossSourceForeignKeys({
                listKey: 'Message',
                listAdapter: createMessageListAdapter(),
                sourceRegistry: sameSourceRegistry,
            })).toEqual([])
        })

        test('adapts when User is moved to another source while Message stays on main', () => {
            const userMovedRegistry = createPoolBasedSourceRegistry({
                poolTables: {
                    main: new Set(['Message', 'Ticket']),
                    users_db: new Set(['User']),
                },
                routingRules: [
                    { tableName: 'User', target: 'users_db' },
                    { target: 'main' },
                ],
                replicaPoolsConfig: {
                    main: { databases: ['main'], writable: true },
                    users_db: { databases: ['users'], writable: true },
                },
            })

            const listAdapter = {
                fieldAdapters: [
                    { isRelationship: true, refListKey: 'User', path: 'user', rel: { columnName: 'user' } },
                    { isRelationship: true, refListKey: 'Ticket', path: 'ticket', rel: { columnName: 'ticket' } },
                ],
            }

            expect(collectCrossSourceForeignKeys({
                listKey: 'Message',
                listAdapter,
                sourceRegistry: userMovedRegistry,
            })).toEqual([
                { columnName: 'user', refListKey: 'User' },
            ])
        })

        test('reads relationships from fieldAdaptersByPath when fieldAdapters is absent', () => {
            const fields = collectCrossSourceForeignKeys({
                listKey: 'Message',
                listAdapter: {
                    fieldAdaptersByPath: {
                        user: { isRelationship: true, refListKey: 'User', path: 'user', rel: { columnName: 'user' } },
                    },
                },
                sourceRegistry,
            })

            expect(fields).toEqual([
                { columnName: 'user', refListKey: 'User' },
            ])
        })
    })

    describe('extractMutationColumnValues', () => {
        test('maps INSERT positional bindings to column names', () => {
            const sql = [
                'insert into "public"."Message"',
                '("user", "remoteClient", "type")',
                'values ($1, $2, $3) returning *',
            ].join(' ')

            expect(extractMutationColumnValues(sql, ['user-1', null, 'CUSTOM_CONTENT_MESSAGE_PUSH_TYPE'])).toEqual([{
                user: 'user-1',
                remoteClient: null,
                type: 'CUSTOM_CONTENT_MESSAGE_PUSH_TYPE',
            }])
        })

        test('maps INSERT knex placeholders to column names', () => {
            const sql = [
                'insert into "public"."Message"',
                '("user", "remoteClient", "type")',
                'values (?, ?, ?) returning *',
            ].join(' ')

            expect(extractMutationColumnValues(sql, ['user-1', null, 'CUSTOM_CONTENT_MESSAGE_PUSH_TYPE'])).toEqual([{
                user: 'user-1',
                remoteClient: null,
                type: 'CUSTOM_CONTENT_MESSAGE_PUSH_TYPE',
            }])
        })

        test('maps UPDATE SET assignments to column names', () => {
            const sql = 'update "public"."Message" set "user" = $1, "status" = $2 where "id" = $3 returning *'

            expect(extractMutationColumnValues(sql, ['user-2', 'sent', 'message-1'])).toEqual([{
                user: 'user-2',
                status: 'sent',
            }])
        })

        test('maps UPDATE knex placeholders to column names', () => {
            const sql = 'update "public"."Message" set "user" = ?, "status" = ? where "id" = ? returning *'

            expect(extractMutationColumnValues(sql, ['user-2', 'sent', 'message-1'])).toEqual([{
                user: 'user-2',
                status: 'sent',
            }])
        })

        test('returns empty array for unsupported SQL', () => {
            expect(extractMutationColumnValues('select 1')).toEqual([])
        })

        test('maps every INSERT value row for multi-row statements', () => {
            const sql = [
                'insert into "public"."Message"',
                '("user", "type")',
                'values ($1, $2), ($3, $4) returning *',
            ].join(' ')

            expect(extractMutationColumnValues(sql, ['user-1', 'TYPE_A', 'user-2', 'TYPE_B'])).toEqual([
                { user: 'user-1', type: 'TYPE_A' },
                { user: 'user-2', type: 'TYPE_B' },
            ])
        })
    })

    describe('validateCrossSourceReferences', () => {
        test('passes when cross-source FK value exists on related source', async () => {
            await expect(validateCrossSourceReferences({
                tableName: 'Message',
                listAdapter: createMessageListAdapter(),
                sql: 'insert into "public"."Message" ("user", "type") values ($1, $2) returning *',
                bindings: ['existing-user', 'CUSTOM_CONTENT_MESSAGE_PUSH_TYPE'],
                sqlOperationName: 'insert',
                sourceRegistry,
                getPoolByName: createGetPoolByName({
                    existingIdsByTable: { User: [{ id: 'existing-user' }] },
                }),
            })).resolves.toBeUndefined()
        })

        test('skips null cross-source FK values', async () => {
            await expect(validateCrossSourceReferences({
                tableName: 'Message',
                listAdapter: createMessageListAdapter(),
                sql: 'insert into "public"."Message" ("user", "email", "type") values ($1, $2, $3) returning *',
                bindings: [null, 'a@b.com', 'CUSTOM_CONTENT_MESSAGE_EMAIL_TYPE'],
                sqlOperationName: 'insert',
                sourceRegistry,
                getPoolByName: createGetPoolByName(),
            })).resolves.toBeUndefined()
        })

        test('throws when cross-source FK value is missing on related source', async () => {
            await expect(validateCrossSourceReferences({
                tableName: 'Message',
                listAdapter: createMessageListAdapter(),
                sql: 'insert into "public"."Message" ("user", "type") values ($1, $2) returning *',
                bindings: ['missing-user', 'CUSTOM_CONTENT_MESSAGE_PUSH_TYPE'],
                sqlOperationName: 'insert',
                sourceRegistry,
                getPoolByName: createGetPoolByName({ existingIdsByTable: { User: [] } }),
            })).rejects.toThrow(
                'Cross-database foreign key violation: Message.user references missing User id "missing-user"',
            )
        })

        test('validates every row in multi-row INSERT statements', async () => {
            await expect(validateCrossSourceReferences({
                tableName: 'Message',
                listAdapter: createMessageListAdapter(),
                sql: 'insert into "public"."Message" ("user", "type") values ($1, $2), ($3, $4) returning *',
                bindings: ['existing-user', 'TYPE_A', 'missing-user', 'TYPE_B'],
                sqlOperationName: 'insert',
                sourceRegistry,
                getPoolByName: createGetPoolByName({
                    existingIdsByTable: { User: [{ id: 'existing-user' }] },
                }),
            })).rejects.toThrow(
                'Cross-database foreign key violation: Message.user references missing User id "missing-user"',
            )
        })

        test('validates UPDATE assignments for cross-source relationships', async () => {
            await expect(validateCrossSourceReferences({
                tableName: 'Message',
                listAdapter: createMessageListAdapter(),
                sql: 'update "public"."Message" set "remoteClient" = $1 where "id" = $2 returning *',
                bindings: ['missing-rc', 'message-1'],
                sqlOperationName: 'update',
                sourceRegistry,
                getPoolByName: createGetPoolByName({ existingIdsByTable: { RemoteClient: [] } }),
            })).rejects.toThrow(
                'Cross-database foreign key violation: Message.remoteClient references missing RemoteClient id "missing-rc"',
            )
        })

        test('checks related row in owning pool, not generic select target', async () => {
            const replicaAwareRegistry = createPoolBasedSourceRegistry({
                poolTables: {
                    main: new Set(['User', 'Organization', 'Message']),
                    replicas: new Set(['User', 'Organization']),
                    message: new Set(['Message']),
                },
                routingRules: [
                    { tableName: 'Message', target: 'message' },
                    { target: 'main', gqlOperationType: 'mutation' },
                    { target: 'replicas', sqlOperationName: 'select' },
                    { target: 'main' },
                ],
                replicaPoolsConfig: {
                    main: { databases: ['main'], writable: true },
                    replicas: { databases: ['replica'], writable: false },
                    message: { databases: ['message'], writable: true },
                },
            })

            const getPoolByName = (poolName) => ({
                getKnexClient: () => (tableName) => ({
                    select: () => ({
                        where: ({ id }) => ({
                            first: async () => {
                                if (poolName === 'main' && tableName === 'Organization' && id === 'org-1') {
                                    return { id }
                                }
                                return null
                            },
                        }),
                        whereIn: async (column, ids) => {
                            if (poolName === 'main' && tableName === 'Organization' && ids.includes('org-1')) {
                                return [{ id: 'org-1' }]
                            }
                            return []
                        },
                    }),
                }),
            })

            await expect(validateCrossSourceReferences({
                tableName: 'Message',
                listAdapter: createMessageListAdapter(),
                sql: 'insert into "public"."Message" ("organization", "type") values ($1, $2) returning *',
                bindings: ['org-1', 'CUSTOM_CONTENT_MESSAGE_EMAIL_TYPE'],
                sqlOperationName: 'insert',
                sourceRegistry: replicaAwareRegistry,
                getPoolByName,
            })).resolves.toBeUndefined()
        })

        test('no-op for tables without cross-source relationships', async () => {
            const sameSourceRegistry = createPoolBasedSourceRegistry({
                poolTables: { main: new Set(['User']) },
                routingRules: [{ target: 'main' }],
                replicaPoolsConfig: { main: { databases: ['main'], writable: true } },
            })

            await expect(validateCrossSourceReferences({
                tableName: 'User',
                listAdapter: { fieldAdapters: [] },
                sql: 'insert into "public"."User" ("id") values ($1) returning *',
                bindings: ['user-1'],
                sqlOperationName: 'insert',
                sourceRegistry: sameSourceRegistry,
                getPoolByName: createGetPoolByName(),
            })).resolves.toBeUndefined()
        })

        test('no-op for select statements', async () => {
            await expect(validateCrossSourceReferences({
                tableName: 'Message',
                listAdapter: createMessageListAdapter(),
                sql: 'select * from "public"."Message"',
                bindings: [],
                sqlOperationName: 'select',
                sourceRegistry,
                getPoolByName: createGetPoolByName(),
            })).resolves.toBeUndefined()
        })
    })
})

describe('sqlAstUtils', () => {
    describe('normalizePositionalBindings', () => {
        test('rewrites standalone bind placeholders', () => {
            expect(normalizePositionalBindings('select * from t where a = ? and b = ?'))
                .toEqual('select * from t where a = $1 and b = $2')
        })

        test('preserves PostgreSQL JSON operators ?| and ?&', () => {
            expect(normalizePositionalBindings('select * from t where tags ?| array[?]'))
                .toEqual('select * from t where tags ?| array[$1]')
            expect(normalizePositionalBindings('select * from t where tags ?& array[?]'))
                .toEqual('select * from t where tags ?& array[$1]')
        })

        test('leaves question marks inside dollar-quoted strings unchanged', () => {
            expect(normalizePositionalBindings('select $$a?b$$, ?'))
                .toEqual('select $$a?b$$, $1')
            expect(normalizePositionalBindings('select $tag$a?b$tag$, ?'))
                .toEqual('select $tag$a?b$tag$, $1')
        })

        test('leaves question marks inside E-prefixed strings unchanged', () => {
            expect(normalizePositionalBindings('select E\'a\\?b\', ?'))
                .toEqual('select E\'a\\?b\', $1')
        })
    })

    describe('parseLiteralNode', () => {
        test('preserves bigint values without Number() coercion', () => {
            expect(parseLiteralNode({ type: 'bigint', value: '9007199254740993' }))
                .toEqual('9007199254740993')
        })

        test('converts number literals with Number()', () => {
            expect(parseLiteralNode({ type: 'number', value: '42' })).toEqual(42)
        })

        test('decodes PostgreSQL E-string backslash escapes', () => {
            expect(parseLiteralNode({ type: 'origin', value: 'E\'a\\nb\\t\\\\\'' }))
                .toEqual('a\nb\t\\')
        })
    })
})
