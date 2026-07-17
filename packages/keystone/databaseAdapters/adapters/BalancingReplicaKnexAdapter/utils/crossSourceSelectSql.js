/**
 * Cross-db SELECT rewrite (SQL path).
 *
 * Keystone emits JOIN + filters on related alias (e.g. `t0__user.name`).
 * When the related table lives on another pool, that JOIN cannot run in one DB:
 * 1) read filters on the join alias
 * 2) query the related table on its pool for matching ids
 * 3) drop the JOIN and replace it with `base.fk IN (...)`
 *
 * Entry point: {@link planCrossPoolSelect}.
 */
const { Parser } = require('node-sql-parser/build/postgresql')

const conf = require('@open-condo/config')

const { normalizeTableName } = require('./sql')

const { parseLiteralNode } = require('../../../crossDb/sqlAstUtils')

const parser = new Parser()

/**
 * Read `{ table, column }` from a SQL AST `column_ref` node.
 *
 * With `node-sql-parser` (postgresql build) the column name is usually nested:
 * `node.column` is an object `{ expr: { type, value } }`, not a string —
 * quoted (`t0."id"`) → `expr.type = 'double_quote_string'`,
 * unquoted (`t0.id`) → `expr.type = 'default'`.
 * The actual name is `node.column.expr.value`. Older / other shapes may still
 * put a plain string on `node.column`; both are handled.
 *
 * @param {object|null} node AST node
 * @returns {{ table: string, column: string }|null}
 */
function _getColumnRefParts (node) {
    if (!node || node.type !== 'column_ref') return null
    let column = node.column
    if (column && typeof column === 'object' && column.expr) {
        column = column.expr.value
    }
    return {
        table: node.table,
        column,
    }
}

/**
 * Whether an AST expression subtree references a given table alias.
 * Recurses into `binary_expr` nodes (e.g. `alias.col ILIKE '%x%'`).
 *
 * @param {object|null} node
 * @param {string} alias join alias such as `t0__user`
 * @returns {boolean}
 */
function _nodeReferencesAlias (node, alias) {
    if (!node) return false
    if (node.type === 'column_ref') {
        return node.table === alias
    }
    if (node.type === 'binary_expr') {
        return _nodeReferencesAlias(node.left, alias) || _nodeReferencesAlias(node.right, alias)
    }
    return false
}

/**
 * Turn a comparison AST node into a Knex-friendly predicate descriptor.
 *
 * Supported shapes:
 * - `column IN (...)` / `NOT IN (...)`
 * - `column = value`, `column ILIKE value`, etc.
 *
 * @param {object|null} node `binary_expr` AST node
 * @returns {{ type: 'in', column: string, negate: boolean, values: Array }|{ type: 'binary', column: string, operator: string, value: * }|null}
 */
function _nodeToPredicate (node) {
    if (!node || node.type !== 'binary_expr') return null

    const operator = String(node.operator || '').toUpperCase()
    if (operator === 'IN' || operator === 'NOT IN') {
        const leftParts = _getColumnRefParts(node.left)
        if (!leftParts) return null
        if (node.right?.type !== 'expr_list' || !Array.isArray(node.right.value)) return null
        const values = []
        for (const item of node.right.value) {
            const parsed = parseLiteralNode(item)
            if (parsed === undefined) return null
            values.push(parsed)
        }
        return {
            type: 'in',
            column: leftParts.column,
            negate: operator === 'NOT IN',
            values,
        }
    }

    const leftParts = _getColumnRefParts(node.left)
    if (!leftParts) return null
    const value = parseLiteralNode(node.right)
    if (value === undefined) return null
    return {
        type: 'binary',
        column: leftParts.column,
        operator: operator.toLowerCase(),
        value,
    }
}

/**
 * Parse a SQL string and return the single SELECT AST root.
 *
 * @param {string} sqlString
 * @returns {object} `node-sql-parser` select AST
 * @throws {Error} when the input is not exactly one SELECT
 */
function _parseSelectQuery (sqlString) {
    let parsedQuery = parser.astify(sqlString)
    if (Array.isArray(parsedQuery)) {
        if (parsedQuery.length !== 1) {
            throw new Error(`Expected a single SELECT statement: "${sqlString}"`)
        }
        parsedQuery = parsedQuery[0]
    }
    if (parsedQuery.type !== 'select') {
        throw new Error(`Expected SELECT query, got: ${parsedQuery.type}`)
    }
    return parsedQuery
}

/**
 * Serialize a SELECT AST back to SQL text.
 *
 * @param {object} parsedQuery
 * @returns {string}
 */
function _formatSelectQuery (parsedQuery) {
    return parser.sqlify(parsedQuery)
}

/**
 * When Keystone runs `_allMessagesMeta` count, SQL is `SELECT count(*) FROM (SELECT ... JOIN ...)`.
 * Returns the inner SELECT AST when that pattern is detected.
 *
 * @param {object} parsedQuery outer SELECT AST
 * @returns {object|null} inner SELECT AST
 */
function _unwrapCountSubselect (parsedQuery) {
    const columns = parsedQuery.columns
    if (!columns || columns.length !== 1) return null

    const columnExpr = columns[0]?.expr
    if (!columnExpr || columnExpr.type !== 'aggr_func') return null
    if (String(columnExpr.name).toUpperCase() !== 'COUNT') return null

    const from = parsedQuery.from || []
    if (from.length !== 1) return null

    const innerSelect = from[0]?.expr?.ast
    if (!innerSelect || innerSelect.type !== 'select') return null

    return innerSelect
}

/**
 * SELECT body to rewrite: outer count wrapper or the query itself.
 *
 * @param {object} parsedQuery
 * @returns {object}
 */
function _resolveSelectTargetAst (parsedQuery) {
    return _unwrapCountSubselect(parsedQuery) || parsedQuery
}

/**
 * Parse a standalone WHERE fragment into an AST node.
 * Wraps the fragment as `SELECT 1 WHERE <fragment>` internally.
 *
 * @param {string} conditionSql SQL boolean expression without the `WHERE` keyword
 * @returns {object|null} WHERE AST node
 */
function _parseWhereCondition (conditionSql) {
    const parsedQuery = _parseSelectQuery(`SELECT 1 AS "_cond" WHERE ${conditionSql}`)
    return parsedQuery.where
}

/**
 * Extract base table + FK join metadata from an already-parsed SELECT AST.
 *
 * Detects only Keystone-style FK joins:
 * `LEFT JOIN "User" AS "t0__user" ON "t0__user"."id" = "t0"."user"`.
 *
 * Important: this function is intentionally permissive and does not fail fast.
 * Unsupported join shapes are skipped here so the caller can continue scanning
 * the rest of the query. Actual fail-fast validation happens later in
 * `planCrossPoolSelect()`, when a join is about to be rewritten across pools.
 *
 * In other words:
 * - here: "can I recognize this join as a simple FK join?"
 * - later: "is it safe to rewrite this cross-pool join?"
 *
 * @param {object} parsedQuery SELECT AST
 * @returns {{ baseTable: string, baseAlias: string, joins: Array<{ alias: string, joinTable: string, sourceAlias: string, sourceField: string, fkExpression: string }> }|null}
 */
function _getFkJoinMetadataFromParsedQuery (parsedQuery) {
    const from = parsedQuery.from || []
    if (!from.length) return null

    const baseFrom = from.find(item => !item.join)
    if (!baseFrom) return null

    const baseTable = normalizeTableName(baseFrom.table)
    const baseAlias = baseFrom.as || baseTable
    const joins = []

    for (const item of from) {
        if (!item.join || !item.on || item.on.type !== 'binary_expr') continue
        if (String(item.on.operator).toUpperCase() !== '=') continue

        const leftParts = _getColumnRefParts(item.on.left)
        const rightParts = _getColumnRefParts(item.on.right)
        if (!leftParts || !rightParts) continue

        const joinAlias = item.as
        const joinTable = normalizeTableName(item.table)

        if (leftParts.table === joinAlias && leftParts.column === 'id' && rightParts.table === baseAlias) {
            joins.push({
                alias: joinAlias,
                joinTable,
                sourceAlias: baseAlias,
                sourceField: rightParts.column,
                fkExpression: `"${baseAlias}"."${rightParts.column}"`,
            })
            continue
        }

        if (rightParts.table === joinAlias && rightParts.column === 'id' && leftParts.table === baseAlias) {
            joins.push({
                alias: joinAlias,
                joinTable,
                sourceAlias: baseAlias,
                sourceField: leftParts.column,
                fkExpression: `"${baseAlias}"."${leftParts.column}"`,
            })
        }
    }

    return {
        baseTable,
        baseAlias,
        joins,
    }
}

/**
 * Parse Keystone-style `LEFT JOIN ... ON "alias"."id" = "base"."fk"` metadata from a SELECT.
 *
 * @param {string} sqlString full SELECT SQL
 * @returns {{ baseTable: string, baseAlias: string, joins: Array }|null} `null` when parsing fails or no FK joins found
 */
function getFkJoinMetadata (sqlString) {
    try {
        const parsedQuery = _parseSelectQuery(sqlString)
        return _getFkJoinMetadataFromParsedQuery(_resolveSelectTargetAst(parsedQuery))
    } catch (err) {
        return null
    }
}

/**
 * Collect WHERE predicates that reference a join alias (before querying the remote pool).
 *
 * Example: for alias `t0__user`, extracts `{ column: 'name', operator: 'ilike', value: '%Ann%' }`
 * from `("t0__user"."name" ilike '%Ann%')`.
 *
 * Returns an empty array when OR branches involve the alias (unsafe to split).
 *
 * @param {string} sqlString full SELECT SQL
 * @param {string} alias join table alias
 * @returns {Array<{ type: 'in'|'binary', column: string, operator?: string, value?: *, negate?: boolean, values?: Array }>}
 */
function extractJoinAliasPredicates (sqlString, alias) {
    const parsedQuery = _parseSelectQuery(sqlString)
    return _extractAliasPredicates(_resolveSelectTargetAst(parsedQuery).where, alias)
}

/**
 * Depth-first map over a WHERE AST. The mutator may replace a node by returning a new value;
 * otherwise children are visited recursively.
 *
 * @param {object|null} node WHERE AST node
 * @param {(node: object) => object|undefined} mutator
 * @returns {object|null}
 */
function _mutateWhere (node, mutator) {
    if (!node) return node
    const replaced = mutator(node)
    if (replaced !== undefined) return replaced
    if (node.type === 'binary_expr') {
        return {
            ...node,
            left: _mutateWhere(node.left, mutator),
            right: _mutateWhere(node.right, mutator),
        }
    }
    return node
}

/**
 * Flatten redundant `AND true` nodes left after predicate removal.
 *
 * @param {object|null} node WHERE AST node
 * @returns {object|null}
 */
function _simplifyWhere (node) {
    if (!node) return node
    if (node.type === 'binary_expr' && String(node.operator).toUpperCase() === 'AND') {
        const left = _simplifyWhere(node.left)
        const right = _simplifyWhere(node.right)
        if (left?.type === 'bool' && left.value === true) return right
        if (right?.type === 'bool' && right.value === true) return left
        return { ...node, left, right }
    }
    return node
}

/**
 * @param {object|null} node
 * @returns {boolean} whether the node is `AND` or `OR`
 */
function _isLogicalBinaryExpr (node) {
    if (!node || node.type !== 'binary_expr') return false
    const operator = String(node.operator || '').toUpperCase()
    return operator === 'AND' || operator === 'OR'
}

/**
 * @param {object|null} node
 * @returns {boolean} whether the node is an `OR` expression
 */
function _isOrBinaryExpr (node) {
    return node?.type === 'binary_expr' && String(node.operator || '').toUpperCase() === 'OR'
}

/**
 * Whether the WHERE tree contains an `OR` that references the join alias.
 * Such shapes cannot be rewritten safely (would change result semantics).
 *
 * @param {object|null} where WHERE AST root
 * @param {string} alias join alias
 * @returns {boolean}
 */
function _whereTreeHasOrWithAlias (where, alias) {
    if (!where) return false
    if (_isOrBinaryExpr(where)) {
        return _nodeReferencesAlias(where.left, alias) || _nodeReferencesAlias(where.right, alias)
    }
    if (where.type === 'binary_expr' && String(where.operator || '').toUpperCase() === 'AND') {
        return _whereTreeHasOrWithAlias(where.left, alias) || _whereTreeHasOrWithAlias(where.right, alias)
    }
    return false
}

/**
 * Walk WHERE and collect predicate descriptors for conditions on `alias.*` columns.
 * Skips the whole tree (returns `[]`) when an OR involving the alias is present.
 *
 * @param {object|null} where WHERE AST root
 * @param {string} alias join alias
 * @returns {Array}
 */
function _extractAliasPredicates (where, alias) {
    if (_whereTreeHasOrWithAlias(where, alias)) return []

    const predicates = []
    const walk = (node) => {
        if (!node) return
        if (node.type === 'binary_expr') {
            if (_isLogicalBinaryExpr(node)) {
                walk(node.left)
                walk(node.right)
                return
            }
            if (_nodeReferencesAlias(node, alias)) {
                const predicate = _nodeToPredicate(node)
                if (predicate) predicates.push(predicate)
                return
            }
            walk(node.left)
            walk(node.right)
        }
    }
    walk(where)
    return predicates
}

/**
 * Extract alias predicates for the remote query and remove them from the base SELECT WHERE.
 * Replaced predicate nodes become `true` so the remaining WHERE stays valid.
 * If any alias-backed node cannot be converted, abort and leave the original WHERE unchanged.
 *
 * @param {object|null} where WHERE AST root
 * @param {string} alias join alias
 * @returns {{ predicates: Array, where: object|null, unsupported: boolean }}
 */
function _extractAndRemoveAliasPredicates (where, alias) {
    if (_whereTreeHasOrWithAlias(where, alias)) {
        return { predicates: [], where, unsupported: true }
    }

    const predicates = []
    let unsupported = false
    const nextWhere = _simplifyWhere(_mutateWhere(where, (node) => {
        if (_isLogicalBinaryExpr(node) || !_nodeReferencesAlias(node, alias)) return undefined
        const predicate = _nodeToPredicate(node)
        if (!predicate) {
            unsupported = true
            return undefined
        }
        predicates.push(predicate)
        return { type: 'bool', value: true }
    }))
    if (unsupported) {
        return { predicates: [], where, unsupported: true }
    }
    return { predicates, where: nextWhere, unsupported: false }
}

/**
 * Remove a JOIN entry from the SELECT `FROM` clause by alias.
 *
 * @param {object} parsedQuery SELECT AST (mutated in place)
 * @param {string} alias join alias to drop
 */
function _removeJoinByAlias (parsedQuery, alias) {
    parsedQuery.from = (parsedQuery.from || []).filter(item => !(item.join && item.as === alias))
}

/**
 * AND a SQL condition string onto an existing WHERE AST node.
 *
 * @param {object|null} where existing WHERE AST
 * @param {string} conditionSql boolean SQL fragment without `WHERE`
 * @returns {object} combined WHERE AST
 */
function _andWhereCondition (where, conditionSql) {
    const conditionNode = _parseWhereCondition(conditionSql)
    if (!where) return conditionNode
    return {
        type: 'binary_expr',
        operator: 'AND',
        left: where,
        right: conditionNode,
    }
}

/**
 * Rewrite a cross-pool SELECT: drop JOINs and replace alias filters with `base.fk IN (...)`.
 *
 * @param {string} sqlString original SELECT SQL
 * @param {{ joinRewrites?: Array<{ alias: string, fkExpression: string, ids: string[] }> }} options
 * @returns {string|null} rewritten SQL, or `null` when nothing changed
 * @throws {Error} when OR conditions on a join alias make rewrite unsafe
 */
function rewriteCrossSourceSelectSql (sqlString, { joinRewrites = [] } = {}) {
    if (!joinRewrites.length) return null

    const parsedQuery = _parseSelectQuery(sqlString)
    const targetQuery = _resolveSelectTargetAst(parsedQuery)
    let changed = false

    for (const rewrite of joinRewrites) {
        const { alias, fkExpression, ids } = rewrite
        const { predicates, where, unsupported } = _extractAndRemoveAliasPredicates(targetQuery.where, alias)
        if (unsupported) {
            throw new Error(`Unsupported cross-pool JOIN rewrite for alias "${alias}"`)
        }
        if (!predicates.length) continue

        targetQuery.where = where
        _removeJoinByAlias(targetQuery, alias)

        if (!ids || ids.length === 0) {
            targetQuery.where = _andWhereCondition(targetQuery.where, 'false')
        } else {
            const escapedIds = ids.map(id => `'${String(id).replace(/'/g, '\'\'')}'`).join(', ')
            targetQuery.where = _andWhereCondition(targetQuery.where, `${fkExpression} IN (${escapedIds})`)
        }
        changed = true
    }

    return changed ? _formatSelectQuery(parsedQuery) : null
}

/**
 * Lowercase and collapse whitespace — for stable test assertions only.
 *
 * @param {string} sqlString
 * @returns {string}
 */
function normalizeSqlForCompare (sqlString) {
    return String(sqlString || '')
        .replace(/\s+/g, ' ')
        .trim()
        .toLowerCase()
}

/** Max ids allowed when resolving a cross-pool JOIN (`CROSS_DB_JOIN_FILTER_IDS_LIMIT`). */
const CROSS_DB_JOIN_IDS_HARD_LIMIT = Number(conf.CROSS_DB_JOIN_FILTER_IDS_LIMIT) ||
    Number(conf.CROSS_DB_RELATION_FILTER_IDS_LIMIT) || 10000

/**
 * Apply a parsed join predicate to a Knex query builder on the remote table.
 *
 * @param {import('knex').QueryBuilder} query
 * @param {{ type: 'in'|'binary', column: string, operator?: string, value?: *, negate?: boolean, values?: Array }} predicate
 */
function _applyJoinPredicate (query, predicate) {
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

/**
 * Plan and execute a cross-pool SELECT rewrite.
 *
 * For each JOIN whose table routes to a different pool than the base table:
 * 1. extract filters on the join alias from SQL
 * 2. run `SELECT id FROM join_table WHERE ...` on the join table's pool
 * 3. rewrite the original SQL to `base.fk IN (...)` without the JOIN
 *
 * @param {object} options
 * @param {string} options.sql original SELECT SQL from Knex
 * @param {string} options.baseTableName Keystone list / table name for the main FROM clause
 * @param {string} [options.gqlOperationType]
 * @param {string} [options.gqlOperationName]
 * @param {string} options.sqlOperationName `select`, `insert`, etc.
 * @param {(context: object) => object} options.routeToPool returns the pool for a table context
 * @param {(pool: object) => string|null} options.getPoolName pool name used for same-pool comparison
 * @returns {Promise<string|null>} rewritten SQL, or `null` when rewrite is not needed
 * @throws {Error} when JOIN shape is unsupported or id limit is exceeded
 */
async function planCrossPoolSelect ({
    sql,
    baseTableName,
    gqlOperationType,
    gqlOperationName,
    sqlOperationName,
    routeToPool,
    getPoolName,
}) {
    if (sqlOperationName !== 'select') return null

    const metadata = getFkJoinMetadata(sql)
    if (!metadata || metadata.joins.length === 0) return null

    const basePool = routeToPool({
        gqlOperationType,
        gqlOperationName,
        sqlOperationName,
        tableName: baseTableName || metadata.baseTable,
    })
    const basePoolName = getPoolName(basePool)
    if (!basePoolName) return null

    const joinRewrites = []
    const unsupportedCrossPoolJoins = []

    for (const join of metadata.joins) {
        const joinPool = routeToPool({
            gqlOperationType,
            gqlOperationName,
            sqlOperationName,
            tableName: join.joinTable,
        })
        const joinPoolName = getPoolName(joinPool)
        if (!joinPoolName || joinPoolName === basePoolName) continue

        const predicates = extractJoinAliasPredicates(sql, join.alias)
        if (predicates.length === 0) {
            unsupportedCrossPoolJoins.push(join.joinTable)
            continue
        }

        const joinClient = joinPool.getKnexClient()
        const query = joinClient(join.joinTable)
            .select('id')
            .limit(CROSS_DB_JOIN_IDS_HARD_LIMIT + 1)
        for (const predicate of predicates) {
            _applyJoinPredicate(query, predicate)
        }
        const ids = (await query).map(row => row.id)
        if (ids.length > CROSS_DB_JOIN_IDS_HARD_LIMIT) {
            throw new Error(
                `Cross-pool join on "${join.joinTable}" resolved too many ids (${ids.length}). ` +
                `Limit: ${CROSS_DB_JOIN_IDS_HARD_LIMIT}`,
            )
        }

        joinRewrites.push({
            alias: join.alias,
            fkExpression: join.fkExpression,
            ids,
        })
    }

    if (unsupportedCrossPoolJoins.length) {
        throw new Error(
            'Unsupported cross-pool JOIN shape: ' +
            `${unsupportedCrossPoolJoins.join(', ')}. ` +
            'Filters on the joined alias are required for cross-source rewrite.',
        )
    }

    if (!joinRewrites.length) return null
    return rewriteCrossSourceSelectSql(sql, { joinRewrites })
}

module.exports = {
    getFkJoinMetadata,
    extractJoinAliasPredicates,
    rewriteCrossSourceSelectSql,
    planCrossPoolSelect,
    normalizeSqlForCompare,
}
