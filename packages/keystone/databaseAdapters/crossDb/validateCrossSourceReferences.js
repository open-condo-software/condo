/**
 * Cross-database foreign key validation for INSERT/UPDATE mutations.
 *
 * When a table lives on a different source than its related tables, Postgres FK
 * constraints may be absent (CI clones schema without FKs). This module validates
 * relationship column values against the related table's source before the mutation runs.
 */
const { Parser } = require('node-sql-parser/build/postgresql')

const parser = new Parser()

function _appendLineCommentChar (char, state) {
    state.normalizedSql += char
    if (char === '\n') state.lineComment = false
}

function _appendBlockCommentChar (char, nextChar, sql, index, state) {
    state.normalizedSql += char
    if (char === '*' && nextChar === '/') {
        state.normalizedSql += nextChar
        state.index = index + 1
        state.blockCommentDepth -= 1
        return
    }
    if (char === '/' && nextChar === '*') {
        state.normalizedSql += nextChar
        state.index = index + 1
        state.blockCommentDepth += 1
    }
}

function _appendQuotedChar (char, nextChar, state) {
    state.normalizedSql += char
    if (char === state.quoteChar) {
        if (nextChar === state.quoteChar) {
            state.normalizedSql += nextChar
            state.index += 1
        } else {
            state.quoteChar = null
        }
    }
}

function _tryStartCommentOrQuote (char, nextChar, index, state) {
    if (char === '-' && nextChar === '-') {
        state.normalizedSql += char + nextChar
        state.index = index + 1
        state.lineComment = true
        return true
    }
    if (char === '/' && nextChar === '*') {
        state.normalizedSql += char + nextChar
        state.index = index + 1
        state.blockCommentDepth = 1
        return true
    }
    if (char === '\'' || char === '"') {
        state.normalizedSql += char
        state.quoteChar = char
        return true
    }
    return false
}

/**
 * Convert Knex `?` placeholders into PostgreSQL-style `$1`, `$2`, ... placeholders
 * so `node-sql-parser` can parse mutation SQL produced before `positionBindings()`.
 * Keeps placeholders inside quoted strings/comments untouched.
 *
 * @param {string} sql
 * @returns {string}
 */
function _normalizePositionalBindings (sql) {
    if (!sql || !sql.includes('?')) return sql

    const state = {
        bindingIndex: 0,
        normalizedSql: '',
        quoteChar: null,
        lineComment: false,
        blockCommentDepth: 0,
        index: 0,
    }

    for (state.index = 0; state.index < sql.length; state.index++) {
        const char = sql[state.index]
        const nextChar = sql[state.index + 1]

        if (state.lineComment) {
            _appendLineCommentChar(char, state)
            continue
        }

        if (state.blockCommentDepth > 0) {
            _appendBlockCommentChar(char, nextChar, sql, state.index, state)
            continue
        }

        if (state.quoteChar) {
            _appendQuotedChar(char, nextChar, state)
            continue
        }

        if (_tryStartCommentOrQuote(char, nextChar, state.index, state)) continue

        if (char === '?') {
            state.bindingIndex += 1
            state.normalizedSql += `$${state.bindingIndex}`
            continue
        }

        state.normalizedSql += char
    }

    return state.normalizedSql
}

/**
 * @param {object|null} node
 * @returns {string|number|boolean|null|undefined}
 */
function _parseLiteralNode (node) {
    if (!node) return null
    if (node.type === 'null') return null
    if (node.type === 'bool') return node.value
    if (node.type === 'number' || node.type === 'bigint') return Number(node.value)
    if (node.type === 'string' || node.type === 'single_quote_string' || node.type === 'double_quote_string') {
        return node.value
    }
    return undefined
}

/**
 * @param {object|null} node
 * @param {Array} bindings
 * @returns {*}
 */
function _resolveSqlValue (node, bindings) {
    if (!node) return null
    if (node.type === 'var' && node.prefix === '$') {
        return bindings[Number(node.name) - 1]
    }
    return _parseLiteralNode(node)
}

/**
 * @param {*} columnNode
 * @returns {string|null}
 */
function _normalizeColumnName (columnNode) {
    if (!columnNode) return null
    if (typeof columnNode === 'string') return columnNode
    if (columnNode.type === 'double_quote_string' || columnNode.type === 'single_quote_string') {
        return columnNode.value
    }
    if (columnNode.expr) {
        return _normalizeColumnName(columnNode.expr)
    }
    if (typeof columnNode.column === 'string') return columnNode.column
    if (columnNode.column?.expr) return _normalizeColumnName(columnNode.column.expr)
    return null
}

/**
 * @param {object} valueRow
 * @param {string[]} columns
 * @param {Array} bindings
 * @returns {Record<string, *>|null}
 */
function _mapInsertValueRow (valueRow, columns, bindings) {
    if (!valueRow || columns.length !== valueRow.length) return null

    const result = {}
    for (let i = 0; i < columns.length; i++) {
        result[columns[i]] = _resolveSqlValue(valueRow[i], bindings)
    }
    return result
}

/**
 * @param {string} sql
 * @param {Array} bindings
 * @returns {Array<Record<string, *>>}
 */
function extractMutationColumnValues (sql, bindings = []) {
    let ast = parser.astify(_normalizePositionalBindings(sql))
    if (Array.isArray(ast)) {
        if (ast.length !== 1) return []
        ast = ast[0]
    }

    if (ast.type === 'insert') {
        const columns = (ast.columns || []).map(_normalizeColumnName).filter(Boolean)
        return (ast.values || [])
            .map(valueGroup => _mapInsertValueRow(valueGroup?.value, columns, bindings))
            .filter(Boolean)
    }

    if (ast.type === 'update') {
        const result = {}
        for (const item of ast.set || []) {
            const columnName = _normalizeColumnName(item.column)
            if (!columnName) continue
            result[columnName] = _resolveSqlValue(item.value, bindings)
        }
        return Object.keys(result).length ? [result] : []
    }

    return []
}

/**
 * @param {object|null} listAdapter
 * @returns {Array}
 */
function _iterRelationshipFieldAdapters (listAdapter) {
    if (listAdapter?.fieldAdapters?.length) return listAdapter.fieldAdapters
    if (listAdapter?.fieldAdaptersByPath) return Object.values(listAdapter.fieldAdaptersByPath)
    return []
}

/**
 * @param {{ listKey: string, listAdapter: object, sourceRegistry: object }} options
 * @returns {Array<{ columnName: string, refListKey: string }>}
 */
function collectCrossSourceForeignKeys ({ listKey, listAdapter, sourceRegistry }) {
    const baseSource = sourceRegistry.resolveSource(listKey)
    const fields = []

    for (const fieldAdapter of _iterRelationshipFieldAdapters(listAdapter)) {
        if (!fieldAdapter.isRelationship || !fieldAdapter.refListKey) continue

        const refListKey = fieldAdapter.refListKey
        if (sourceRegistry.resolveSource(refListKey) === baseSource) continue

        const columnName = fieldAdapter.rel?.columnName || fieldAdapter.path
        fields.push({ columnName, refListKey })
    }

    return fields
}

/**
 * @param {*} value
 * @returns {boolean}
 */
function _isPresentFkValue (value) {
    return value !== null && value !== undefined
}

/**
 * @param {object} options
 * @param {string} options.tableName
 * @param {object} options.listAdapter
 * @param {string} options.sql
 * @param {Array} [options.bindings]
 * @param {string} options.sqlOperationName
 * @param {object} options.sourceRegistry
 * @param {(poolName: string) => object} options.getPoolByName
 * @returns {Promise<void>}
 */
async function validateCrossSourceReferences ({
    tableName,
    listAdapter,
    sql,
    bindings = [],
    sqlOperationName,
    sourceRegistry,
    getPoolByName,
}) {
    if (!['insert', 'update'].includes(sqlOperationName)) return

    const crossSourceFields = collectCrossSourceForeignKeys({
        listKey: tableName,
        listAdapter,
        sourceRegistry,
    })
    if (!crossSourceFields.length) return

    const columnValueRows = extractMutationColumnValues(sql, bindings)
    if (!columnValueRows.length) return

    for (const columnValues of columnValueRows) {
        for (const { columnName, refListKey } of crossSourceFields) {
            const fkValue = columnValues[columnName]
            if (!_isPresentFkValue(fkValue)) continue

            const relatedPoolName = sourceRegistry.resolveSource(refListKey)
            const relatedPool = getPoolByName(relatedPoolName)
            const relatedClient = relatedPool.getKnexClient()
            const relatedRow = await relatedClient(refListKey)
                .select('id')
                .where({ id: fkValue })
                .first()

            if (!relatedRow) {
                throw new Error(
                    `Cross-database foreign key violation: ${tableName}.${columnName} ` +
                    `references missing ${refListKey} id "${fkValue}"`,
                )
            }
        }
    }
}

module.exports = {
    collectCrossSourceForeignKeys,
    extractMutationColumnValues,
    validateCrossSourceReferences,
}
