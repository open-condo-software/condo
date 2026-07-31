const {
    getFkJoinMetadata,
    extractJoinAliasPredicates,
    rewriteCrossSourceSelectSql,
    planCrossPoolSelect,
    normalizeSqlForCompare,
} = require('./crossSourceSelectSql')

/**
 * Minimal Keystone-style SELECT (same shape as Knex list adapter output in sql.spec.js).
 *
 * Example: filter Messages by related User.name without hitting User DB in one query.
 */
function keystoneSelectWithFkJoin ({
    baseTable = 'Message',
    baseAlias = 't0',
    joinTable = 'User',
    joinAlias = 't0__user',
    fkColumn = 'user',
    extraWhere = '',
    limit = 100,
} = {}) {
    const whereParts = ['true']
    if (extraWhere) whereParts.push(`(${extraWhere})`)
    whereParts.push(`("${baseAlias}"."deletedAt" is null)`)

    return [
        `select "${baseAlias}".* from "public"."${baseTable}" as "${baseAlias}"`,
        `left outer join "public"."${joinTable}" as "${joinAlias}"`,
        `on "${joinAlias}"."id" = "${baseAlias}"."${fkColumn}"`,
        `where ${whereParts.join(' and ')}`,
        'order by "id" ASC',
        `limit ${limit}`,
    ].join(' ')
}

/** Keystone `_all*Meta` count: `SELECT count(*) FROM (SELECT * ... JOIN ...)`. */
function keystoneCountSubselectWithFkJoin ({
    baseTable = 'Message',
    baseAlias = 't0',
    joinTable = 'User',
    joinAlias = 't0__user',
    fkColumn = 'user',
    extraWhere = '',
} = {}) {
    const whereParts = ['true']
    if (extraWhere) whereParts.push(`(${extraWhere})`)
    whereParts.push(`("${baseAlias}"."deletedAt" is null)`)

    const inner = [
        `select * from "public"."${baseTable}" as "${baseAlias}"`,
        `left outer join "public"."${joinTable}" as "${joinAlias}"`,
        `on "${joinAlias}"."id" = "${baseAlias}"."${fkColumn}"`,
        `where ${whereParts.join(' and ')}`,
    ].join(' ')

    return `select count(*) as "count" from (${inner}) as "unused_alias"`
}

/** Assert rewrite outcome with readable diff-friendly checks. */
function expectSqlRewrite ({ inputSql, joinRewrites, mustContain = [], mustNotContain = [], equalsNormalized }) {
    const rewritten = rewriteCrossSourceSelectSql(inputSql, { joinRewrites })
    const normalized = normalizeSqlForCompare(rewritten)

    if (equalsNormalized === null) {
        expect(rewritten).toBeNull()
        return
    }

    expect(rewritten).not.toBeNull()
    for (const fragment of mustNotContain) {
        expect(normalized).not.toContain(normalizeSqlForCompare(fragment))
    }
    for (const fragment of mustContain) {
        expect(normalized).toContain(normalizeSqlForCompare(fragment))
    }
    if (equalsNormalized !== undefined) {
        expect(normalized).toBe(equalsNormalized)
    }
}

describe('crossSourceSelectSql', () => {
    describe('getFkJoinMetadata', () => {
        test('detects Keystone FK join: RelationModel.id = Model.someRelation', () => {
            const sql = keystoneSelectWithFkJoin({
                baseTable: 'Model',
                joinTable: 'RelationModel',
                joinAlias: 't0__someRelation',
                fkColumn: 'someRelation',
            })

            expect(getFkJoinMetadata(sql)).toEqual({
                baseTable: 'Model',
                baseAlias: 't0',
                joins: [{
                    alias: 't0__someRelation',
                    joinTable: 'RelationModel',
                    sourceAlias: 't0',
                    sourceField: 'someRelation',
                    fkExpression: '"t0"."someRelation"',
                }],
            })
        })

        test('returns empty joins when SELECT has no relation join', () => {
            const sql = 'select "t0".* from "public"."Model" as "t0" where ("t0"."deletedAt" is null)'

            expect(getFkJoinMetadata(sql)).toEqual({
                baseTable: 'Model',
                baseAlias: 't0',
                joins: [],
            })
        })

        test('returns null for non-SELECT input', () => {
            expect(getFkJoinMetadata('not a select')).toBeNull()
        })

        test('detects FK join inside count(*) subselect (_allMessagesMeta shape)', () => {
            const sql = keystoneCountSubselectWithFkJoin({
                extraWhere: '"t0__user"."id" = \'user-1\'',
            })

            expect(getFkJoinMetadata(sql)).toEqual({
                baseTable: 'Message',
                baseAlias: 't0',
                joins: [{
                    alias: 't0__user',
                    joinTable: 'User',
                    sourceAlias: 't0',
                    sourceField: 'user',
                    fkExpression: '"t0"."user"',
                }],
            })
        })
    })

    describe('extractJoinAliasPredicates', () => {
        const joinAlias = 't0__user'

        test('extracts equality filter on joined User alias', () => {
            const sql = keystoneSelectWithFkJoin({
                extraWhere: `"${joinAlias}"."name" = 'Ann'`,
            })

            expect(extractJoinAliasPredicates(sql, joinAlias)).toEqual([
                { type: 'binary', column: 'name', operator: '=', value: 'Ann' },
            ])
        })

        test('extracts ilike filter on joined User alias', () => {
            const sql = keystoneSelectWithFkJoin({
                extraWhere: `"${joinAlias}"."name" ilike '%Ann%'`,
            })

            expect(extractJoinAliasPredicates(sql, joinAlias)).toEqual([
                { type: 'binary', column: 'name', operator: 'ilike', value: '%Ann%' },
            ])
        })

        test('returns empty list for nested alias predicate shapes that are not safely rewritable', () => {
            const sql = keystoneSelectWithFkJoin({
                extraWhere: `lower("${joinAlias}"."name") = 'ann'`,
            })

            expect(extractJoinAliasPredicates(sql, joinAlias)).toEqual([])
        })

        test('extracts IN and NOT IN on joined User id', () => {
            const sqlIn = keystoneSelectWithFkJoin({
                extraWhere: `"${joinAlias}"."id" in ('u-1', 'u-2')`,
            })
            const sqlNotIn = keystoneSelectWithFkJoin({
                extraWhere: `"${joinAlias}"."id" not in ('u-3')`,
            })

            expect(extractJoinAliasPredicates(sqlIn, joinAlias)).toEqual([
                { type: 'in', column: 'id', negate: false, values: ['u-1', 'u-2'] },
            ])
            expect(extractJoinAliasPredicates(sqlNotIn, joinAlias)).toEqual([
                { type: 'in', column: 'id', negate: true, values: ['u-3'] },
            ])
        })

        test('returns empty list when OR mixes join alias with base-table predicate', () => {
            const sql = keystoneSelectWithFkJoin({
                extraWhere: `("${joinAlias}"."name" = 'Ann') or ("t0"."deletedAt" is null)`,
            })

            expect(extractJoinAliasPredicates(sql, joinAlias)).toEqual([])
        })

        test('collapses Keystone false OR wrapper and extracts join alias predicate', () => {
            // Keystone `_addWheres` for OR: `whereRaw('false'); orWhere(...)`
            const sql = keystoneSelectWithFkJoin({
                extraWhere: `false or ("${joinAlias}"."id" in ('ctx-1', 'ctx-2'))`,
            })

            expect(extractJoinAliasPredicates(sql, joinAlias)).toEqual([
                { type: 'in', column: 'id', negate: false, values: ['ctx-1', 'ctx-2'] },
            ])
        })

        test('ignores predicates on other aliases', () => {
            const sql = keystoneSelectWithFkJoin({ extraWhere: '"t0"."status" = \'open\'' })

            expect(extractJoinAliasPredicates(sql, joinAlias)).toEqual([])
        })
    })

    describe('rewriteCrossSourceSelectSql', () => {
        const userJoinRewrite = (ids) => ({
            alias: 't0__user',
            fkExpression: '"t0"."user"',
            ids,
        })

        test('removes User JOIN and replaces User-side filters with Message.user IN (...)', () => {
            const inputSql = keystoneSelectWithFkJoin({
                extraWhere: '"t0__user"."name" ilike \'%Ann%\'',
            })
            const resolvedUserIds = ['user-ann-1', 'user-ann-2']

            expectSqlRewrite({
                inputSql,
                joinRewrites: [userJoinRewrite(resolvedUserIds)],
                mustNotContain: ['left outer join', 't0__user'],
                mustContain: [
                    '"t0"."user" in (\'user-ann-1\', \'user-ann-2\')',
                    '"t0"."deletedat" is null',
                ],
            })
        })

        test('keeps base-table predicates and drops only join-alias predicates', () => {
            const inputSql = keystoneSelectWithFkJoin({
                extraWhere: '("t0__user"."name" = \'Ann\') and ("t0"."status" = \'sent\')',
            })

            expectSqlRewrite({
                inputSql,
                joinRewrites: [userJoinRewrite(['user-ann-1'])],
                mustNotContain: ['t0__user', 'left outer join'],
                mustContain: [
                    '"t0"."status" = \'sent\'',
                    '"t0"."user" in (\'user-ann-1\')',
                    '"t0"."deletedat" is null',
                ],
            })
        })

        test('adds false when remote pool returned no matching User ids', () => {
            const inputSql = keystoneSelectWithFkJoin({
                extraWhere: '"t0__user"."name" ilike \'%nobody%\'',
            })

            expectSqlRewrite({
                inputSql,
                joinRewrites: [userJoinRewrite([])],
                mustNotContain: ['join'],
                mustContain: ['false', '"t0"."deletedat" is null'],
            })
        })

        test('throws when rewrite requests an alias with no removable join predicates', () => {
            const inputSql = keystoneSelectWithFkJoin()

            expect(() => rewriteCrossSourceSelectSql(inputSql, {
                joinRewrites: [userJoinRewrite(['user-1'])],
            })).toThrow(/no removable predicates found/)
        })

        test('throws when WHERE uses OR around join-alias predicates', () => {
            const inputSql = keystoneSelectWithFkJoin({
                extraWhere: '("t0__user"."name" = \'Ann\') or ("t0"."status" = \'sent\')',
            })

            expect(() => rewriteCrossSourceSelectSql(inputSql, {
                joinRewrites: [userJoinRewrite(['user-ann-1'])],
            })).toThrow('Unsupported cross-pool JOIN rewrite for alias "t0__user"')
        })

        test('throws when hydration-only join still has nested alias reference in WHERE', () => {
            const inputSql = keystoneSelectWithFkJoin({
                extraWhere: 'lower("t0__user"."name") = \'ann\'',
            })

            expect(() => rewriteCrossSourceSelectSql(inputSql, {
                joinRewrites: [userJoinRewrite(['user-ann-1'])],
            })).toThrow('Unsupported cross-pool JOIN rewrite for alias "t0__user"')
        })

        test('throws when join-alias predicate cannot be converted to a remote filter', () => {
            const inputSql = keystoneSelectWithFkJoin({
                extraWhere: '"t0__user"."id" = "t0"."user"',
            })

            expect(() => rewriteCrossSourceSelectSql(inputSql, {
                joinRewrites: [userJoinRewrite(['user-1'])],
            })).toThrow('Unsupported cross-pool JOIN rewrite for alias "t0__user"')
        })

        test('rewrites Keystone id_not (join.id != x OR join.id IS NULL) onto local FK', () => {
            const inputSql = keystoneSelectWithFkJoin({
                joinTable: 'BillingCategory',
                joinAlias: 't0__category',
                fkColumn: 'category',
                extraWhere: '("t0__category"."id" != \'55dd01e4-a87c-4713-8a91-951516b543f3\') or ("t0__category"."id" is null)',
            })

            expectSqlRewrite({
                inputSql,
                joinRewrites: [{
                    alias: 't0__category',
                    fkExpression: '"t0"."category"',
                    applyIdPredicatesOnFk: true,
                }],
                mustNotContain: ['join', 't0__category'],
                mustContain: [
                    '("t0"."category" is null or "t0"."category" <> \'55dd01e4-a87c-4713-8a91-951516b543f3\')',
                    '"t0"."deletedat" is null',
                ],
            })
        })

        test('rewrites join id equality onto local FK without remote ids list', () => {
            const inputSql = keystoneSelectWithFkJoin({
                joinTable: 'BillingCategory',
                joinAlias: 't0__category',
                fkColumn: 'category',
                extraWhere: '"t0__category"."id" = \'cat-1\'',
            })

            expectSqlRewrite({
                inputSql,
                joinRewrites: [{
                    alias: 't0__category',
                    fkExpression: '"t0"."category"',
                    applyIdPredicatesOnFk: true,
                }],
                mustNotContain: ['join', 't0__category'],
                mustContain: ['"t0"."category" = \'cat-1\''],
            })
        })

        test('rewrites count(*) subselect and drops User JOIN', () => {
            const inputSql = keystoneCountSubselectWithFkJoin({
                extraWhere: '"t0__user"."id" = \'user-1\'',
            })

            expectSqlRewrite({
                inputSql,
                joinRewrites: [userJoinRewrite(['user-1'])],
                mustNotContain: ['left outer join', 't0__user'],
                mustContain: [
                    'count(*)',
                    '"t0"."user" in (\'user-1\')',
                    'unused_alias',
                ],
            })
        })
    })

    describe('planCrossPoolSelect (fail-closed)', () => {
        function createPoolHarness ({
            basePoolName = 'external',
            joinPoolName = 'main',
            remoteIds = ['user-1'],
        } = {}) {
            const invocations = {
                where: [],
                whereRaw: [],
                whereIn: [],
                whereNotIn: [],
            }
            const externalPool = {
                name: 'external',
                getKnexClient: () => {
                    throw new Error('base pool knex should not be used by planner')
                },
            }
            const mainPool = {
                name: 'main',
                getKnexClient: () => {
                    const rows = remoteIds.map(id => ({ id }))
                    const builder = {
                        select: () => builder,
                        limit: () => builder,
                        where: (...args) => {
                            invocations.where.push(args)
                            return builder
                        },
                        whereRaw: (...args) => {
                            invocations.whereRaw.push(args)
                            return builder
                        },
                        whereIn: (...args) => {
                            invocations.whereIn.push(args)
                            return builder
                        },
                        whereNotIn: (...args) => {
                            invocations.whereNotIn.push(args)
                            return builder
                        },
                        then: (resolve) => resolve(rows),
                    }
                    return (tableName) => {
                        expect(tableName).toEqual('User')
                        return builder
                    }
                },
            }
            const pools = { external: externalPool, main: mainPool }

            return {
                invocations,
                routeToPool: ({ tableName }) => {
                    if (tableName === 'Message') return pools[basePoolName]
                    if (tableName === 'User') return pools[joinPoolName]
                    return pools[basePoolName]
                },
                getPoolName: (pool) => pool?.name || null,
            }
        }

        test('rewrites cross-pool Keystone FK join and does not leave JOIN in SQL', async () => {
            const sql = keystoneSelectWithFkJoin({
                extraWhere: '"t0__user"."name" ilike \'%Ann%\'',
            })
            const harness = createPoolHarness()

            const rewritten = await planCrossPoolSelect({
                sql,
                baseTableName: 'Message',
                sqlOperationName: 'select',
                routeToPool: harness.routeToPool,
                getPoolName: harness.getPoolName,
            })

            expect(rewritten).toBeTruthy()
            const normalized = normalizeSqlForCompare(rewritten)
            expect(normalized).not.toContain('join')
            expect(normalized).toContain('"t0"."user" in (\'user-1\')')
            expect(harness.invocations.whereRaw).toEqual([
                ['?? ilike ?', ['name', '%Ann%']],
            ])
            expect(harness.invocations.where).toEqual([])
            expect(harness.invocations.whereIn).toEqual([])
            expect(harness.invocations.whereNotIn).toEqual([])
        })

        test('returns null when all JOINs are same-pool (original SQL is safe)', async () => {
            const sql = keystoneSelectWithFkJoin({
                extraWhere: '"t0__user"."name" ilike \'%Ann%\'',
            })
            const harness = createPoolHarness({ joinPoolName: 'external' })

            await expect(planCrossPoolSelect({
                sql,
                baseTableName: 'Message',
                sqlOperationName: 'select',
                ...harness,
            })).resolves.toBeNull()
        })

        test('throws for unrecognized cross-pool JOIN shape (no silent fallback)', async () => {
            const sql = [
                'select "t0".* from "public"."Message" as "t0"',
                'left outer join "public"."User" as "t0__user"',
                'on "t0__user"."name" = "t0"."email"',
                'where ("t0"."deletedAt" is null)',
            ].join(' ')
            const harness = createPoolHarness()

            await expect(planCrossPoolSelect({
                sql,
                baseTableName: 'Message',
                sqlOperationName: 'select',
                ...harness,
            })).rejects.toThrow(/Unsupported cross-pool JOIN shape: "User"/)
        })

        test('rewrites Keystone id_not OR IS NULL via local FK (no remote query)', async () => {
            const sql = keystoneSelectWithFkJoin({
                baseTable: 'BillingReceipt',
                joinTable: 'BillingCategory',
                joinAlias: 't0__category',
                fkColumn: 'category',
                extraWhere: '("t0__category"."id" != \'55dd01e4-a87c-4713-8a91-951516b543f3\') or ("t0__category"."id" is null)',
            })
            const billingPool = {
                name: 'billing',
                getKnexClient: () => {
                    throw new Error('should not query remote for pure id_not rewrite')
                },
            }
            const mainPool = {
                name: 'main',
                getKnexClient: () => {
                    throw new Error('should not query remote for pure id_not rewrite')
                },
            }

            const rewritten = await planCrossPoolSelect({
                sql,
                baseTableName: 'BillingReceipt',
                sqlOperationName: 'select',
                routeToPool: ({ tableName }) => (tableName === 'BillingReceipt' ? billingPool : mainPool),
                getPoolName: (pool) => pool?.name || null,
            })

            expect(rewritten).toBeTruthy()
            const normalized = normalizeSqlForCompare(rewritten)
            expect(normalized).not.toContain('join')
            expect(normalized).toContain('"t0"."category" is null or "t0"."category" <>')
        })

        test('throws when joined table pool cannot be resolved', async () => {
            const sql = keystoneSelectWithFkJoin({
                extraWhere: '"t0__user"."id" = \'user-1\'',
            })

            await expect(planCrossPoolSelect({
                sql,
                baseTableName: 'Message',
                sqlOperationName: 'select',
                routeToPool: ({ tableName }) => (tableName === 'Message' ? { name: 'external' } : { name: 'orphan' }),
                getPoolName: (pool) => (pool?.name === 'external' ? 'external' : null),
            })).rejects.toThrow(/Cannot resolve pool for joined table "User"/)
        })

        test('throws when base table pool cannot be resolved', async () => {
            const sql = keystoneSelectWithFkJoin({
                extraWhere: '"t0__user"."id" = \'user-1\'',
            })

            await expect(planCrossPoolSelect({
                sql,
                baseTableName: 'Message',
                sqlOperationName: 'select',
                routeToPool: () => ({ name: 'external' }),
                getPoolName: () => null,
            })).rejects.toThrow(/Cannot resolve pool for base table "Message"/)
        })
    })
})
