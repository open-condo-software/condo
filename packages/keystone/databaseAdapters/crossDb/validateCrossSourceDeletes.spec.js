const {
    ON_DELETE,
    normalizeOnDelete,
    collectCrossSourceInboundForeignKeys,
    extractDeleteTargetIds,
    extractUpdateTargetIds,
    isSoftDeleteUpdate,
    enforceCrossSourceDeleteConstraints,
} = require('./validateCrossSourceDeletes')

const { createPoolBasedSourceRegistry } = require('../sourceRegistry')

function createListAdapters () {
    return {
        BillingReceipt: {
            fieldAdapters: [
                { path: 'deletedAt' },
                { isRelationship: true, refListKey: 'BillingReceiptFile', path: 'file' },
            ],
        },
        Payment: {
            fieldAdapters: [
                { path: 'deletedAt' },
                {
                    isRelationship: true,
                    refListKey: 'BillingReceipt',
                    path: 'receipt',
                    rel: { tableName: 'Payment', columnName: 'receipt' },
                    config: { kmigratorOptions: { null: true, on_delete: 'models.SET_NULL' } },
                },
            ],
        },
        ProtectedNote: {
            fieldAdapters: [
                {
                    isRelationship: true,
                    refListKey: 'BillingReceipt',
                    path: 'receipt',
                    rel: { tableName: 'ProtectedNote', columnName: 'receipt' },
                    config: { kmigratorOptions: { null: false, on_delete: 'models.PROTECT' } },
                },
            ],
        },
        CascadeChild: {
            fieldAdapters: [
                { path: 'deletedAt' },
                {
                    isRelationship: true,
                    refListKey: 'BillingReceipt',
                    path: 'receipt',
                    rel: { tableName: 'CascadeChild', columnName: 'receipt' },
                    config: { kmigratorOptions: { null: false, on_delete: 'models.CASCADE' } },
                },
            ],
        },
    }
}

function createGetPoolByName ({ tables = {} } = {}) {
    const state = tables
    return () => ({
        getKnexClient: () => (tableName) => {
            const rows = () => state[tableName] || []
            const chain = {
                select: () => chain,
                whereIn: (column, ids) => {
                    chain._filter = { column, ids: new Set(ids) }
                    return chain
                },
                whereNull: (column) => {
                    chain._whereNull = column
                    return chain
                },
                update: async (patch) => {
                    const filtered = rows().filter(row => {
                        if (chain._filter && !chain._filter.ids.has(row[chain._filter.column])) return false
                        if (chain._whereNull && row[chain._whereNull] != null) return false
                        return true
                    })
                    for (const row of filtered) Object.assign(row, patch)
                    return filtered.length
                },
                del: async () => {
                    const before = rows()
                    state[tableName] = before.filter(row => {
                        if (chain._filter && !chain._filter.ids.has(row[chain._filter.column])) return true
                        if (chain._whereNull && row[chain._whereNull] != null) return true
                        return false
                    })
                    return before.length - state[tableName].length
                },
                then: (resolve, reject) => {
                    try {
                        const result = rows().filter(row => {
                            if (chain._filter && !chain._filter.ids.has(row[chain._filter.column])) return false
                            if (chain._whereNull && row[chain._whereNull] != null) return false
                            return true
                        })
                        resolve(result)
                    } catch (err) {
                        reject(err)
                    }
                },
            }
            return chain
        },
    })
}

describe('validateCrossSourceDeletes', () => {
    const poolsConfig = {
        main: { databases: ['main'], writable: true },
        billing: { databases: ['billing'], writable: true },
    }

    const sourceRegistry = createPoolBasedSourceRegistry({
        poolTables: {
            main: new Set(['Payment', 'ProtectedNote', 'CascadeChild']),
            billing: new Set(['BillingReceipt']),
        },
        routingRules: [
            { tableName: 'BillingReceipt', target: 'billing' },
            { target: 'main' },
        ],
        replicaPoolsConfig: poolsConfig,
    })

    describe('normalizeOnDelete', () => {
        test('maps kmigrator strings', () => {
            expect(normalizeOnDelete('models.PROTECT')).toBe(ON_DELETE.PROTECT)
            expect(normalizeOnDelete('models.CASCADE')).toBe(ON_DELETE.CASCADE)
            expect(normalizeOnDelete('models.SET_NULL')).toBe(ON_DELETE.SET_NULL)
            expect(normalizeOnDelete('models.DO_NOTHING')).toBe(ON_DELETE.DO_NOTHING)
            expect(normalizeOnDelete(undefined)).toBe(ON_DELETE.PROTECT)
        })
    })

    describe('collectCrossSourceInboundForeignKeys', () => {
        test('finds Payment.receipt → BillingReceipt across pools', () => {
            const inbound = collectCrossSourceInboundForeignKeys({
                listKey: 'BillingReceipt',
                listAdapters: createListAdapters(),
                sourceRegistry,
            })

            expect(inbound).toEqual(expect.arrayContaining([
                expect.objectContaining({
                    dependentListKey: 'Payment',
                    columnName: 'receipt',
                    onDelete: ON_DELETE.SET_NULL,
                }),
                expect.objectContaining({
                    dependentListKey: 'ProtectedNote',
                    onDelete: ON_DELETE.PROTECT,
                }),
                expect.objectContaining({
                    dependentListKey: 'CascadeChild',
                    onDelete: ON_DELETE.CASCADE,
                }),
            ]))
        })

        test('skips same-pool dependents', () => {
            const samePoolRegistry = createPoolBasedSourceRegistry({
                poolTables: {
                    main: new Set(['BillingReceipt', 'Payment']),
                },
                routingRules: [{ target: 'main' }],
                replicaPoolsConfig: { main: { databases: ['main'], writable: true } },
            })

            expect(collectCrossSourceInboundForeignKeys({
                listKey: 'BillingReceipt',
                listAdapters: createListAdapters(),
                sourceRegistry: samePoolRegistry,
            })).toEqual([])
        })
    })

    describe('SQL helpers', () => {
        test('extractDeleteTargetIds from id equality and IN', () => {
            expect(extractDeleteTargetIds(
                'delete from "public"."BillingReceipt" where "id" = $1',
                ['r-1'],
            )).toEqual(['r-1'])

            expect(extractDeleteTargetIds(
                'delete from "public"."BillingReceipt" where "id" in ($1, $2)',
                ['r-1', 'r-2'],
            )).toEqual(['r-1', 'r-2'])
        })

        test('detects soft-delete UPDATE and target ids', () => {
            const sql = 'update "public"."BillingReceipt" set "deletedAt" = $1 where "id" = $2'
            expect(isSoftDeleteUpdate(sql, ['2026-01-01T00:00:00.000Z', 'r-9'])).toBe(true)
            expect(extractUpdateTargetIds(sql, ['2026-01-01T00:00:00.000Z', 'r-9'])).toEqual(['r-9'])
            expect(isSoftDeleteUpdate(
                'update "public"."BillingReceipt" set "period" = $1 where "id" = $2',
                ['2026-01-01', 'r-9'],
            )).toBe(false)
        })
    })

    describe('enforceCrossSourceDeleteConstraints', () => {
        test('PROTECT blocks hard delete when dependents exist', async () => {
            await expect(enforceCrossSourceDeleteConstraints({
                tableName: 'BillingReceipt',
                listAdapters: createListAdapters(),
                sql: 'delete from "public"."BillingReceipt" where "id" = $1',
                bindings: ['r-1'],
                sqlOperationName: 'delete',
                sourceRegistry,
                getPoolByName: createGetPoolByName({
                    tables: {
                        ProtectedNote: [{ id: 'n-1', receipt: 'r-1' }],
                        Payment: [],
                        CascadeChild: [],
                    },
                }),
            })).rejects.toThrow('protected by ProtectedNote.receipt')
        })

        test('SET_NULL clears Payment.receipt on hard delete', async () => {
            const tables = {
                Payment: [{ id: 'p-1', receipt: 'r-1', deletedAt: null }],
                ProtectedNote: [],
                CascadeChild: [],
            }

            await enforceCrossSourceDeleteConstraints({
                tableName: 'BillingReceipt',
                listAdapters: createListAdapters(),
                sql: 'delete from "public"."BillingReceipt" where "id" = $1',
                bindings: ['r-1'],
                sqlOperationName: 'delete',
                sourceRegistry,
                getPoolByName: createGetPoolByName({ tables }),
            })

            expect(tables.Payment[0].receipt).toBeNull()
        })

        test('CASCADE deletes dependents on hard delete', async () => {
            const tables = {
                CascadeChild: [{ id: 'c-1', receipt: 'r-1', deletedAt: null }],
                Payment: [],
                ProtectedNote: [],
            }

            await enforceCrossSourceDeleteConstraints({
                tableName: 'BillingReceipt',
                listAdapters: createListAdapters(),
                sql: 'delete from "public"."BillingReceipt" where "id" = $1',
                bindings: ['r-1'],
                sqlOperationName: 'delete',
                sourceRegistry,
                getPoolByName: createGetPoolByName({ tables }),
            })

            expect(tables.CascadeChild).toEqual([])
        })

        test('soft-delete only enforces PROTECT, does not SET_NULL', async () => {
            const tables = {
                Payment: [{ id: 'p-1', receipt: 'r-1', deletedAt: null }],
                ProtectedNote: [],
                CascadeChild: [{ id: 'c-1', receipt: 'r-1', deletedAt: null }],
            }

            await enforceCrossSourceDeleteConstraints({
                tableName: 'BillingReceipt',
                listAdapters: createListAdapters(),
                sql: 'update "public"."BillingReceipt" set "deletedAt" = $1 where "id" = $2',
                bindings: ['2026-01-01T00:00:00.000Z', 'r-1'],
                sqlOperationName: 'update',
                sourceRegistry,
                getPoolByName: createGetPoolByName({ tables }),
            })

            expect(tables.Payment[0].receipt).toBe('r-1')
            expect(tables.CascadeChild).toHaveLength(1)
        })

        test('soft-delete PROTECT blocks when protected dependents exist', async () => {
            await expect(enforceCrossSourceDeleteConstraints({
                tableName: 'BillingReceipt',
                listAdapters: createListAdapters(),
                sql: 'update "public"."BillingReceipt" set "deletedAt" = $1 where "id" = $2',
                bindings: ['2026-01-01T00:00:00.000Z', 'r-1'],
                sqlOperationName: 'update',
                sourceRegistry,
                getPoolByName: createGetPoolByName({
                    tables: {
                        ProtectedNote: [{ id: 'n-1', receipt: 'r-1' }],
                        Payment: [],
                        CascadeChild: [],
                    },
                }),
            })).rejects.toThrow('protected by ProtectedNote.receipt')
        })
    })
})
