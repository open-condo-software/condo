/**
 * Cross-db SELECT rewrite (SQL path).
 * Keystone emits JOIN + filters on related alias (e.g. t0__user.name).
 * When related table lives on another pool, we cannot execute that JOIN in one DB:
 * 1) read filters on the join alias 
 * 2) query related table for matching ids
 * 3) drop JOIN and replace with base FK IN (...). 
 * See PostgresSelectPlanner.plan().
 */
const { Parser } = require('node-sql-parser/build/postgresql')

const parser = new Parser()

function _normalizeTableName (tableName) {
    if (!tableName || typeof tableName !== 'string') return tableName
    const withoutQuotes = tableName.replace(/"/g, '')
    const parts = withoutQuotes.split('.')
    return parts[parts.length - 1]
}

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

function _parseLiteralNode (node) {
    if (!node) return null
    if (node.type === 'null') return null
    if (node.type === 'bool') return node.value
    if (node.type === 'number' || node.type === 'bigint') return Number(node.value)
    if (node.type === 'single_quote_string' || node.type === 'double_quote_string') {
        return node.value
    }
    if (node.type === 'origin') {
        const raw = String(node.value || '')
        if (raw.startsWith('E\'') && raw.endsWith('\'')) {
            return raw.slice(2, -1).replace(/''/g, '\'')
        }
        return raw
    }
    return null
}

function _nodeToPredicate (node) {
    if (!node || node.type !== 'binary_expr') return null

    const operator = String(node.operator || '').toUpperCase()
    if (operator === 'IN') {
        const leftParts = _getColumnRefParts(node.left)
        if (!leftParts) return null
        const values = (node.right?.type === 'expr_list' ? node.right.value : [])
            .map(_parseLiteralNode)
            .filter(value => value !== undefined)
        return {
            type: 'in',
            column: leftParts.column,
            negate: false,
            values,
        }
    }

    const leftParts = _getColumnRefParts(node.left)
    if (!leftParts) return null
    const value = _parseLiteralNode(node.right)
    return {
        type: 'binary',
        column: leftParts.column,
        operator: operator.toLowerCase(),
        value,
    }
}

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

function _formatSelectQuery (parsedQuery) {
    return parser.sqlify(parsedQuery)
}

function _parseWhereCondition (conditionSql) {
    const parsedQuery = _parseSelectQuery(`SELECT 1 AS "_cond" WHERE ${conditionSql}`)
    return parsedQuery.where
}

function _getFkJoinMetadataFromParsedQuery (parsedQuery) {
    const from = parsedQuery.from || []
    if (!from.length) return null

    const baseFrom = from.find(item => !item.join)
    if (!baseFrom) return null

    const baseTable = _normalizeTableName(baseFrom.table)
    const baseAlias = baseFrom.as || baseTable
    const joins = []

    for (const item of from) {
        if (!item.join || !item.on || item.on.type !== 'binary_expr') continue
        if (String(item.on.operator).toUpperCase() !== '=') continue

        const leftParts = _getColumnRefParts(item.on.left)
        const rightParts = _getColumnRefParts(item.on.right)
        if (!leftParts || !rightParts) continue

        const joinAlias = item.as
        const joinTable = _normalizeTableName(item.table)

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

function getFkJoinMetadata (sqlString) {
    try {
        const parsedQuery = _parseSelectQuery(sqlString)
        return _getFkJoinMetadataFromParsedQuery(parsedQuery)
    } catch (err) {
        return null
    }
}

function extractJoinAliasPredicates (sqlString, alias) {
    const parsedQuery = _parseSelectQuery(sqlString)
    return _extractAliasPredicates(parsedQuery.where, alias)
}

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

function _isLogicalBinaryExpr (node) {
    if (!node || node.type !== 'binary_expr') return false
    const operator = String(node.operator || '').toUpperCase()
    return operator === 'AND' || operator === 'OR'
}

function _extractAliasPredicates (where, alias) {
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

function _extractAndRemoveAliasPredicates (where, alias) {
    const predicates = []
    const nextWhere = _simplifyWhere(_mutateWhere(where, (node) => {
        if (_isLogicalBinaryExpr(node) || !_nodeReferencesAlias(node, alias)) return undefined
        const predicate = _nodeToPredicate(node)
        if (predicate) predicates.push(predicate)
        return { type: 'bool', value: true }
    }))
    return { predicates, where: nextWhere }
}

function _removeJoinByAlias (parsedQuery, alias) {
    parsedQuery.from = (parsedQuery.from || []).filter(item => !(item.join && item.as === alias))
}

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

// Applies joinRewrites built by PostgresSelectPlanner: strip JOIN alias, add `"base"."fk" IN (...)`.
function rewriteCrossSourceSelectSql (sqlString, { joinRewrites = [] } = {}) {
    if (!joinRewrites.length) return null

    const parsedQuery = _parseSelectQuery(sqlString)
    let changed = false

    for (const rewrite of joinRewrites) {
        const { alias, fkExpression, ids } = rewrite
        const { predicates, where } = _extractAndRemoveAliasPredicates(parsedQuery.where, alias)
        if (!predicates.length) continue

        parsedQuery.where = where
        _removeJoinByAlias(parsedQuery, alias)

        if (!ids || ids.length === 0) {
            parsedQuery.where = _andWhereCondition(parsedQuery.where, 'false')
        } else {
            const escapedIds = ids.map(id => `'${String(id).replace(/'/g, '\'\'')}'`).join(', ')
            parsedQuery.where = _andWhereCondition(parsedQuery.where, `${fkExpression} IN (${escapedIds})`)
        }
        changed = true
    }

    return changed ? _formatSelectQuery(parsedQuery) : null
}

function normalizeSqlForCompare (sqlString) {
    return String(sqlString || '')
        .replace(/\s+/g, ' ')
        .trim()
        .toLowerCase()
}

module.exports = {
    getFkJoinMetadata,
    extractJoinAliasPredicates,
    rewriteCrossSourceSelectSql,
    normalizeSqlForCompare,
}
