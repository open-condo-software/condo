const {
    getFkJoinMetadata,
    extractJoinAliasPredicates,
    rewriteCrossSourceSelectSql,
    normalizeSqlForCompare,
} = require('./crossSourceSelectSql')

describe('crossSourceSelectSql', () => {
    describe('getFkJoinMetadata', () => {
        const cases = [
            [
                'Message with User fk join',
                'select "t0".* from "public"."Message" as "t0" left outer join "public"."User" as "t0__user" on "t0__user"."id" = "t0"."user" where true and ("t0"."deletedAt" is null)',
                {
                    baseTable: 'Message',
                    baseAlias: 't0',
                    joins: [{
                        alias: 't0__user',
                        joinTable: 'User',
                        sourceAlias: 't0',
                        sourceField: 'user',
                        fkExpression: '"t0"."user"',
                    }],
                },
            ],
            [
                'Model with RelationModel fk join',
                'select "t0".* from "public"."Model" as "t0" left outer join "public"."RelationModel" as "t0__someRelation" on "t0__someRelation"."id" = "t0"."someRelation" where true and ("t0"."deletedAt" is null) limit 1001',
                {
                    baseTable: 'Model',
                    baseAlias: 't0',
                    joins: [{
                        alias: 't0__someRelation',
                        joinTable: 'RelationModel',
                        sourceAlias: 't0',
                        sourceField: 'someRelation',
                        fkExpression: '"t0"."someRelation"',
                    }],
                },
            ],
            [
                'select without fk join',
                'select "t0".* from "public"."Model" as "t0" where true and ("t0"."deletedAt" is null)',
                {
                    baseTable: 'Model',
                    baseAlias: 't0',
                    joins: [],
                },
            ],
            [
                'invalid sql returns null',
                'not a select',
                null,
            ],
        ]

        test.each(cases)('%s', (_, sql, expected) => {
            expect(getFkJoinMetadata(sql)).toStrictEqual(expected)
        })
    })

    describe('extractJoinAliasPredicates', () => {
        const cases = [
            [
                'regex and in on join alias',
                'select "t0".* from "public"."Message" as "t0" left outer join "public"."User" as "t0__user" on "t0__user"."id" = "t0"."user" where true and (("t0__user"."name" ~ E\'crossdb\') and ("t0__user"."id" in (\'u-1\', \'u-2\')) and ("t0"."deletedAt" is null))',
                't0__user',
                [
                    { type: 'binary', column: 'name', operator: '~', value: 'crossdb' },
                    { type: 'in', column: 'id', negate: false, values: ['u-1', 'u-2'] },
                ],
            ],
            [
                'ilike on join alias',
                'select "t0".* from "public"."Message" as "t0" left outer join "public"."User" as "t0__user" on "t0__user"."id" = "t0"."user" where true and ("t0__user"."name" ilike \'%john%\') and ("t0"."deletedAt" is null)',
                't0__user',
                [
                    { type: 'binary', column: 'name', operator: 'ilike', value: '%john%' },
                ],
            ],
            [
                'comparison on join alias',
                'select "t0".* from "public"."Model" as "t0" left outer join "public"."RelationModel" as "t0__someRelation" on "t0__someRelation"."id" = "t0"."someRelation" where true and ("t0__someRelation"."v" > 1) and ("t0"."v" = 1)',
                't0__someRelation',
                [
                    { type: 'binary', column: 'v', operator: '>', value: 1 },
                ],
            ],
            [
                'no predicates for unrelated alias',
                'select "t0".* from "public"."Model" as "t0" where true and ("t0"."v" = 1)',
                't0__someRelation',
                [],
            ],
        ]

        test.each(cases)('%s', (_, sql, alias, expectedPredicates) => {
            expect(extractJoinAliasPredicates(sql, alias)).toStrictEqual(expectedPredicates)
        })
    })

    describe('rewriteCrossSourceSelectSql (SQL raw -> SQL to execute)', () => {
        const cases = [
            [
                'removes join and applies fk IN from resolved ids',
                'select "t0".* from "public"."Message" as "t0" left outer join "public"."User" as "t0__user" on "t0__user"."id" = "t0"."user" where true and (("t0__user"."name" ~ E\'crossdb\') and ("t0__user"."id" in (\'u-1\', \'u-2\')) and ("t0"."deletedAt" is null)) order by "id" ASC limit 100',
                {
                    joinRewrites: [{
                        alias: 't0__user',
                        fkExpression: '"t0"."user"',
                        ids: ['u-1', 'u-2'],
                    }],
                },
                'select "t0".* from "public"."message" as "t0" where ("t0"."deletedat" is null) and "t0"."user" in (\'u-1\', \'u-2\') order by "id" asc limit 100',
            ],
            [
                'empty resolved ids -> false filter',
                'select "t0".* from "public"."Message" as "t0" left outer join "public"."User" as "t0__user" on "t0__user"."id" = "t0"."user" where true and ("t0__user"."name" ilike \'%x%\') and ("t0"."deletedAt" is null)',
                {
                    joinRewrites: [{
                        alias: 't0__user',
                        fkExpression: '"t0"."user"',
                        ids: [],
                    }],
                },
                'select "t0".* from "public"."message" as "t0" where ("t0"."deletedat" is null) and false',
            ],
            [
                'single predicate on join alias',
                'select "t0".* from "public"."Model" as "t0" left outer join "public"."RelationModel" as "t0__someRelation" on "t0__someRelation"."id" = "t0"."someRelation" where true and ("t0__someRelation"."v" > 1) and ("t0"."v" = 1) and ("t0"."deletedAt" is null) limit 1001',
                {
                    joinRewrites: [{
                        alias: 't0__someRelation',
                        fkExpression: '"t0"."someRelation"',
                        ids: ['rel-1', 'rel-2'],
                    }],
                },
                'select "t0".* from "public"."model" as "t0" where ("t0"."v" = 1) and ("t0"."deletedat" is null) and "t0"."somerelation" in (\'rel-1\', \'rel-2\') limit 1001',
            ],
            [
                'no join-alias predicates -> no rewrite',
                'select "t0".* from "public"."Message" as "t0" left outer join "public"."User" as "t0__user" on "t0__user"."id" = "t0"."user" where true and ("t0"."deletedAt" is null)',
                {
                    joinRewrites: [{
                        alias: 't0__user',
                        fkExpression: '"t0"."user"',
                        ids: ['u-1'],
                    }],
                },
                null,
            ],
            [
                'strips join-alias predicates and keeps base-table predicates',
                'select "t0".* from "public"."Message" as "t0" left outer join "public"."User" as "t0__user" on "t0__user"."id" = "t0"."user" where true and (("t0__user"."name" ~ E\'crossdb\') and ("t0"."deletedAt" is null))',
                {
                    joinRewrites: [{
                        alias: 't0__user',
                        fkExpression: '"t0"."user"',
                        ids: ['u-1'],
                    }],
                },
                'select "t0".* from "public"."message" as "t0" where ("t0"."deletedat" is null) and "t0"."user" in (\'u-1\')',
            ],
        ]

        test.each(cases)('%s', (_, sql, options, expectedNormalizedSql) => {
            const rewrittenSql = rewriteCrossSourceSelectSql(sql, options)
            if (expectedNormalizedSql === null) {
                expect(rewrittenSql).toBeNull()
                return
            }
            expect(normalizeSqlForCompare(rewrittenSql)).toBe(expectedNormalizedSql)
        })
    })
})
