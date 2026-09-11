const { createTablePoolResolver } = require('./tablePool')
const {
    ON_DELETE,
    normalizeOnDelete,
    collectCrossSourceInboundForeignKeys,
    extractDeleteTargetIds,
    enforceCrossSourceDeleteConstraints,
} = require('./validateCrossSourceDeletes')

function createListAdapters () {
    return {
        BillingReceipt: {
            fieldAdapters: [
                { isRelationship: true, refListKey: 'BillingReceiptFile', path: 'file' },
            ],
        },
        Payment: {
            fieldAdapters: [
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

    const tablePoolResolver = createTablePoolResolver({
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
                tablePoolResolver,
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
            const samePoolResolver = createTablePoolResolver({
                routingRules: [{ target: 'main' }],
                replicaPoolsConfig: { main: { databases: ['main'], writable: true } },
            })

            expect(collectCrossSourceInboundForeignKeys({
                listKey: 'BillingReceipt',
                listAdapters: createListAdapters(),
                tablePoolResolver: samePoolResolver,
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
    })

    describe('enforceCrossSourceDeleteConstraints', () => {
        test('throws when hard delete target ids cannot be resolved', async () => {
            await expect(enforceCrossSourceDeleteConstraints({
                tableName: 'BillingReceipt',
                listAdapters: createListAdapters(),
                sql: 'delete from "public"."BillingReceipt" where "period" = $1',
                bindings: ['2026-01'],
                sqlOperationName: 'delete',
                tablePoolResolver,
                getPoolByName: createGetPoolByName({ tables: {} }),
            })).rejects.toThrow('could not resolve target BillingReceipt id(s) for DELETE statement')
        })

        test('ignores UPDATE (logical/soft-delete is not adapter core)', async () => {
            const tables = {
                ProtectedNote: [{ id: 'n-1', receipt: 'r-1' }],
                Payment: [{ id: 'p-1', receipt: 'r-1' }],
                CascadeChild: [{ id: 'c-1', receipt: 'r-1' }],
            }

            await enforceCrossSourceDeleteConstraints({
                tableName: 'BillingReceipt',
                listAdapters: createListAdapters(),
                sql: 'update "public"."BillingReceipt" set "deletedAt" = $1 where "id" = $2',
                bindings: ['2026-01-01T00:00:00.000Z', 'r-1'],
                sqlOperationName: 'update',
                tablePoolResolver,
                getPoolByName: createGetPoolByName({ tables }),
            })

            expect(tables.Payment[0].receipt).toBe('r-1')
            expect(tables.CascadeChild).toHaveLength(1)
            expect(tables.ProtectedNote).toHaveLength(1)
        })

        test('PROTECT blocks hard delete when dependents exist', async () => {
            await expect(enforceCrossSourceDeleteConstraints({
                tableName: 'BillingReceipt',
                listAdapters: createListAdapters(),
                sql: 'delete from "public"."BillingReceipt" where "id" = $1',
                bindings: ['r-1'],
                sqlOperationName: 'delete',
                tablePoolResolver,
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
                tablePoolResolver,
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
                tablePoolResolver,
                getPoolByName: createGetPoolByName({ tables }),
            })

            expect(tables.CascadeChild).toEqual([])
        })
    })
})
