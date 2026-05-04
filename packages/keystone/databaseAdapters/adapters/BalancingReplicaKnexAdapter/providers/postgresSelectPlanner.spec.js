const { PostgresSelectPlanner } = require('./postgresSelectPlanner')

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
    test('rewrites cross-source regex and in predicates to base fk filter', async () => {
        const mainPool = {
            getKnexClient: () => () => createQueryMock([{ id: 'u-1' }, { id: 'u-2' }]),
        }
        const externalPool = { getKnexClient: () => (() => createQueryMock([])) }

        const planner = new PostgresSelectPlanner({
            selectTargetPoolByContext: ({ tableName }) => tableName === 'User' ? mainPool : externalPool,
            getPoolName: (pool) => pool === mainPool ? 'main' : 'external',
        })

        const sql = 'select "t0".* from "public"."Message" as "t0" left outer join "public"."User" as "t0__user" ' +
            'on "t0__user"."id" = "t0"."user" where true and (("t0__user"."name" ~ E\'crossdb\') and ' +
            '("t0__user"."id" in (\'u-1\', \'u-2\')) and ("t0"."deletedAt" is null)) order by "id" ASC limit 100'

        const plannedSql = await planner.plan({
            sql,
            baseTableName: 'Message',
            gqlOperationType: 'query',
            gqlOperationName: 'allMessages',
            sqlOperationName: 'select',
        })

        expect(plannedSql).toContain('"t0"."user" in (\'u-1\', \'u-2\')')
        expect(plannedSql).not.toContain('"t0__user"."name"')
        expect(plannedSql).not.toContain('left outer join "public"."User"')
    })
})
