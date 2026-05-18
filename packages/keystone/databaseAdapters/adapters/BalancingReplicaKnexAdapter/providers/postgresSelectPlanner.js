const {
    getFkJoinMetadata,
    extractJoinAliasPredicates,
    rewriteCrossSourceSelectSql,
} = require('../utils/crossSourceSelectSql')

/**
 * Cross-db join for raw SQL (Knex/GraphQL list adapter SELECTs).
 * For each FK join whose table is on a different pool: run filters on that pool,
 * collect ids, then rewrite SQL via crossSourceSelectSql.rewriteCrossSourceSelectSql.
 */
class PostgresSelectPlanner {
    constructor ({ selectTargetPoolByContext, getPoolName }) {
        this._selectTargetPoolByContext = selectTargetPoolByContext
        this._getPoolName = getPoolName
    }

    canPlan ({ sqlOperationName }) {
        return sqlOperationName === 'select'
    }

    async plan ({ sql, baseTableName, gqlOperationType, gqlOperationName, sqlOperationName }) {
        if (!this.canPlan({ sqlOperationName })) return null
        // Detect Keystone-style LEFT JOIN ... ON "alias"."id" = "base"."fk"
        const metadata = getFkJoinMetadata(sql)
        if (!metadata || metadata.joins.length === 0) return null

        const basePool = this._selectTargetPoolByContext({
            gqlOperationType,
            gqlOperationName,
            sqlOperationName,
            tableName: baseTableName || metadata.baseTable,
        })
        const basePoolName = this._getPoolName(basePool)
        if (!basePoolName) return null

        const joinRewrites = []

        for (const join of metadata.joins) {
            const joinPool = this._selectTargetPoolByContext({
                gqlOperationType,
                gqlOperationName,
                sqlOperationName,
                tableName: join.joinTable,
            })
            const joinPoolName = this._getPoolName(joinPool)
            if (!joinPoolName || joinPoolName === basePoolName) continue

            const predicates = extractJoinAliasPredicates(sql, join.alias)
            if (predicates.length === 0) continue

            const joinClient = joinPool.getKnexClient()
            const query = joinClient(join.joinTable).select('id')
            for (const predicate of predicates) {
                this._applyPredicate(query, predicate)
            }
            const ids = (await query).map(row => row.id)

            joinRewrites.push({
                alias: join.alias,
                fkExpression: join.fkExpression,
                ids,
            })
        }

        if (!joinRewrites.length) return null
        return rewriteCrossSourceSelectSql(sql, { joinRewrites })
    }

    canPlanMutation ({ sqlOperationName }) {
        return ['insert', 'update', 'delete'].includes(sqlOperationName)
    }

    async planMutation () {
        return null
    }

    _applyPredicate (query, predicate) {
        if (predicate.type === 'in') {
            if (predicate.values.length === 0) return
            if (predicate.negate) query.whereNotIn(predicate.column, predicate.values)
            else query.whereIn(predicate.column, predicate.values)
            return
        }

        const op = predicate.operator
        if (op === 'like' || op === 'ilike' || op === '~' || op === '!~') {
            query.whereRaw(`?? ${op} ?`, [predicate.column, predicate.value])
            return
        }
        if (op === '<>') {
            query.where(predicate.column, '!=', predicate.value)
            return
        }
        query.where(predicate.column, op, predicate.value)
    }
}

const POSTGRES_PROVIDER_CAPABILITIES = Object.freeze({
    provider: 'postgres',
    supportsSqlRouting: true,
    supportsCrossSourceSelectPlanning: true,
    supportsCrossSourceMutationPlanning: false,
    supportsCrossSourceSortPushdown: false,
})

module.exports = {
    PostgresSelectPlanner,
    POSTGRES_PROVIDER_CAPABILITIES,
}
