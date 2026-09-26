const { PostgresSelectPlanner } = require('./postgresSelectPlanner')

const { normalizeSqlForCompare } = require('../utils/crossSourceSelectSql')

function createQueryMock (rows) {
    return {
        select () { return this },
        where () { return this },
        whereIn () { return this },
        whereNotIn () { return this },
        whereRaw () { return this },
        then (resolve) { return Promise.resolve(resolve(rows)) },
    }
}

describe('PostgresSelectPlanner', () => {
    const mainPool = {
        getKnexClient: () => () => createQueryMock([]),
    }
    const externalPool = {
        getKnexClient: () => () => createQueryMock([]),
    }

    const planner = new PostgresSelectPlanner({
        selectTargetPoolByContext: ({ tableName }) => tableName === 'User' ? mainPool : externalPool,
        getPoolName: (pool) => pool === mainPool ? 'main' : 'external',
    })

    describe('SQL raw -> SQL to execute', () => {
        const cases = [
            [
                'cross-source regex and in predicates become base fk filter',
                {
                    sql: 'select "t0".* from "public"."Message" as "t0" left outer join "public"."User" as "t0__user" ' +
                        'on "t0__user"."id" = "t0"."user" where true and (("t0__user"."name" ~ E\'crossdb\') and ' +
                        '("t0__user"."id" in (\'u-1\', \'u-2\')) and ("t0"."deletedAt" is null)) order by "id" ASC limit 100',
                    userRows: [{ id: 'u-1' }, { id: 'u-2' }],
                },
                'select "t0".* from "public"."message" as "t0" where ("t0"."deletedat" is null) and "t0"."user" in (\'u-1\', \'u-2\') order by "id" asc limit 100',
            ],
            [
                'cross-source ilike predicate resolves ids on join table',
                {
                    sql: 'select "t0".* from "public"."Message" as "t0" left outer join "public"."User" as "t0__user" ' +
                        'on "t0__user"."id" = "t0"."user" where true and ("t0__user"."name" ilike \'%john%\') and ("t0"."deletedAt" is null)',
                    userRows: [{ id: 'u-10' }],
                },
                'select "t0".* from "public"."message" as "t0" where ("t0"."deletedat" is null) and "t0"."user" in (\'u-10\')',
            ],
            [
                'same-source join is not rewritten',
                {
                    sql: 'select "t0".* from "public"."Message" as "t0" left outer join "public"."User" as "t0__user" ' +
                        'on "t0__user"."id" = "t0"."user" where true and ("t0__user"."name" = \'a\') and ("t0"."deletedAt" is null)',
                    userRows: [{ id: 'u-1' }],
                    sameSourcePools: true,
                },
                null,
            ],
            [
                'no join-alias predicates -> no rewrite',
                {
                    sql: 'select "t0".* from "public"."Message" as "t0" left outer join "public"."User" as "t0__user" ' +
                        'on "t0__user"."id" = "t0"."user" where true and ("t0"."deletedAt" is null)',
                    userRows: [{ id: 'u-1' }],
                },
                null,
            ],
        ]

        test.each(cases)('%s', async (_, input, expectedNormalizedSql) => {
            const userKnex = () => createQueryMock(input.userRows)
            const localMainPool = { getKnexClient: () => userKnex }
            const localExternalPool = { getKnexClient: () => () => createQueryMock([]) }

            const localPlanner = new PostgresSelectPlanner({
                selectTargetPoolByContext: ({ tableName }) => {
                    if (input.sameSourcePools) return localMainPool
                    return tableName === 'User' ? localMainPool : localExternalPool
                },
                getPoolName: (pool) => {
                    if (input.sameSourcePools) return 'main'
                    return pool === localMainPool ? 'main' : 'external'
                },
            })

            const plannedSql = await localPlanner.plan({
                sql: input.sql,
                baseTableName: 'Message',
                gqlOperationType: 'query',
                gqlOperationName: 'allMessages',
                sqlOperationName: 'select',
            })

            if (expectedNormalizedSql === null) {
                expect(plannedSql).toBeNull()
                return
            }

            expect(normalizeSqlForCompare(plannedSql)).toBe(expectedNormalizedSql)
        })
    })

    test('does not plan non-select operations', async () => {
        const result = await planner.plan({
            sql: 'insert into "public"."Message" ("id") values ($1)',
            baseTableName: 'Message',
            gqlOperationType: 'mutation',
            gqlOperationName: 'createMessage',
            sqlOperationName: 'insert',
        })
        expect(result).toBeNull()
    })
})
