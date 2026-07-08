const {
    getFkJoinMetadata,
    extractJoinAliasPredicates,
    rewriteCrossSourceSelectSql,
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

        test('returns null when join is present but there are no filters on join alias to rewrite', () => {
            const inputSql = keystoneSelectWithFkJoin()

            expectSqlRewrite({
                inputSql,
                joinRewrites: [userJoinRewrite(['user-1'])],
                equalsNormalized: null,
            })
        })

        test('throws when WHERE uses OR around join-alias predicates', () => {
            const inputSql = keystoneSelectWithFkJoin({
                extraWhere: '("t0__user"."name" = \'Ann\') or ("t0"."status" = \'sent\')',
            })

            expect(() => rewriteCrossSourceSelectSql(inputSql, {
                joinRewrites: [userJoinRewrite(['user-ann-1'])],
            })).toThrow('Unsupported cross-pool JOIN rewrite: OR condition on alias "t0__user"')
        })
    })
})
