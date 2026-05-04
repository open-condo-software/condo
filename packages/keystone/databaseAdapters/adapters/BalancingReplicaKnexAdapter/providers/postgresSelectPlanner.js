const { getFkJoinMetadata } = require('../utils/sql')

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

        let rewrittenSql = sql
        let changed = false

        for (const join of metadata.joins) {
            const joinPool = this._selectTargetPoolByContext({
                gqlOperationType,
                gqlOperationName,
                sqlOperationName,
                tableName: join.joinTable,
            })
            const joinPoolName = this._getPoolName(joinPool)
            if (!joinPoolName || joinPoolName === basePoolName) continue

            const predicates = this._extractAliasLiteralPredicates(rewrittenSql, join.alias)
            if (predicates.length === 0) continue

            const joinClient = joinPool.getKnexClient()
            const query = joinClient(join.joinTable).select('id')
            for (const predicate of predicates) {
                this._applyPredicate(query, predicate)
            }
            const ids = (await query).map(row => row.id)

            const removeJoinRe = new RegExp(
                `\\s+left\\s+outer\\s+join\\s+"[^"]+"\\."[^"]+"\\s+as\\s+"${join.alias}"\\s+on\\s+"${join.alias}"\\."id"\\s*=\\s*"${metadata.baseAlias}"\\."[^"]+"`,
                'ig'
            )
            rewrittenSql = rewrittenSql.replace(removeJoinRe, '')

            const removeAliasPredicateRe = new RegExp(
                `"${join.alias}"\\."[^"]+"\\s*(=|!=|<>|>|>=|<|<=|~|!~|like|ilike)\\s*(E?'(?:[^']|'')*'|\\d+|true|false|null)|` +
                `"${join.alias}"\\."[^"]+"\\s+(not\\s+in|in)\\s*\\(([^)]*)\\)`,
                'ig'
            )
            rewrittenSql = rewrittenSql.replace(removeAliasPredicateRe, 'true')

            if (ids.length === 0) {
                rewrittenSql = this._insertConditionBeforeTail(rewrittenSql, 'false')
            } else {
                const escapedIds = ids.map(id => `'${String(id).replace(/'/g, '\'\'')}'`).join(', ')
                rewrittenSql = this._insertConditionBeforeTail(rewrittenSql, `${join.fkExpression} in (${escapedIds})`)
            }
            changed = true
        }

        return changed ? rewrittenSql : null
    }

    canPlanMutation ({ sqlOperationName }) {
        return ['insert', 'update', 'delete'].includes(sqlOperationName)
    }

    async planMutation () {
        return null
    }

    _extractAliasLiteralPredicates (sql, alias) {
        const predicates = []
        const binaryRe = new RegExp(`"${alias}"\\."([^"]+)"\\s*(=|!=|<>|>|>=|<|<=|~|!~|like|ilike)\\s*(E?'(?:[^']|'')*'|\\d+|true|false|null)`, 'ig')
        let match = null
        while ((match = binaryRe.exec(sql)) !== null) {
            predicates.push({
                type: 'binary',
                column: match[1],
                operator: match[2].toLowerCase(),
                value: this._parseLiteral(match[3]),
            })
        }

        const inRe = new RegExp(`"${alias}"\\."([^"]+)"\\s+(not\\s+in|in)\\s*\\(([^)]*)\\)`, 'ig')
        while ((match = inRe.exec(sql)) !== null) {
            const values = this._parseListLiterals(match[3])
            predicates.push({
                type: 'in',
                column: match[1],
                negate: match[2].toLowerCase().startsWith('not'),
                values,
            })
        }
        return predicates
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

    _parseLiteral (rawValue) {
        if (rawValue === 'null') return null
        if (rawValue === 'true') return true
        if (rawValue === 'false') return false
        if (/^\d+$/.test(rawValue)) return Number(rawValue)
        if (rawValue.startsWith('E\'')) return rawValue.slice(2, -1).replace(/''/g, '\'')
        if (rawValue.startsWith('\'')) return rawValue.slice(1, -1).replace(/''/g, '\'')
        return rawValue
    }

    _parseListLiterals (rawValues) {
        if (!rawValues || !rawValues.trim()) return []
        return rawValues
            .split(',')
            .map(value => value.trim())
            .filter(Boolean)
            .map(value => this._parseLiteral(value))
    }

    _insertConditionBeforeTail (sql, condition) {
        const tailRegex = /\s+(order\s+by|limit\s+\d+|offset\s+\d+)/i
        const match = sql.match(tailRegex)
        if (!match || typeof match.index !== 'number') return `${sql} AND (${condition})`
        return `${sql.slice(0, match.index)} AND (${condition})${sql.slice(match.index)}`
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
