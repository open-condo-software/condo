const { Parser } = require('node-sql-parser/build/postgresql')

const { providerSupportsFind } = require('./providerMethods')

const { extractMutationColumnValues } = require('../crossDb/validateCrossSourceReferences')

const parser = new Parser()

function _normalizePositionalBindings (sql) {
    if (!sql || !sql.includes('?')) return sql

    let bindingIndex = 0
    let normalizedSql = ''
    let quoteChar = null
    let lineComment = false
    let blockCommentDepth = 0

    for (let index = 0; index < sql.length; index += 1) {
        const char = sql[index]
        const nextChar = sql[index + 1]

        if (lineComment) {
            normalizedSql += char
            if (char === '\n') lineComment = false
            continue
        }

        if (blockCommentDepth > 0) {
            normalizedSql += char
            if (char === '*' && nextChar === '/') {
                normalizedSql += nextChar
                index += 1
                blockCommentDepth -= 1
            } else if (char === '/' && nextChar === '*') {
                normalizedSql += nextChar
                index += 1
                blockCommentDepth += 1
            }
            continue
        }

        if (!quoteChar) {
            if (char === '-' && nextChar === '-') {
                normalizedSql += char + nextChar
                index += 1
                lineComment = true
                continue
            }
            if (char === '/' && nextChar === '*') {
                normalizedSql += char + nextChar
                index += 1
                blockCommentDepth = 1
                continue
            }
            if (char === '?') {
                bindingIndex += 1
                normalizedSql += `$${bindingIndex}`
                continue
            }
            if (char === '\'' || char === '"') {
                quoteChar = char
                normalizedSql += char
                continue
            }
            normalizedSql += char
            continue
        }

        normalizedSql += char
        if (char === quoteChar && nextChar !== quoteChar) {
            quoteChar = null
        } else if (char === quoteChar && nextChar === quoteChar) {
            normalizedSql += nextChar
            index += 1
        }
    }

    return normalizedSql
}

function _resolveSqlValue (node, bindings) {
    if (!node || typeof node !== 'object') return node
    if (node.type === 'var' && node.prefix === '$') {
        const index = Number(node.name) - 1
        return bindings[index]
    }
    if (node.type === 'null') return null
    if (node.type === 'bool') return node.value
    if (node.type === 'number') return Number(node.value)
    if (node.type === 'single_quote_string' || node.type === 'double_quote_string') {
        return node.value
    }
    return node.value
}

function _normalizeColumnName (columnNode) {
    if (!columnNode) return null
    if (typeof columnNode === 'string') return columnNode.replace(/"/g, '')
    if (columnNode.type === 'column_ref') {
        return _normalizeColumnName(columnNode.column)
    }
    if (columnNode.type === 'double_quote_string' || columnNode.type === 'single_quote_string') {
        return columnNode.value
    }
    if (columnNode.expr) {
        return _normalizeColumnName(columnNode.expr)
    }
    if (typeof columnNode.column === 'string') return columnNode.column.replace(/"/g, '')
    if (columnNode.column?.expr) return _normalizeColumnName(columnNode.column.expr)
    return null
}

function _collectWhereIds (whereNode, bindings, ids = []) {
    if (!whereNode) return ids

    if (whereNode.type === 'binary_expr') {
        const leftColumn = _normalizeColumnName(whereNode.left)
        if (leftColumn === 'id' && whereNode.operator === '=') {
            const value = _resolveSqlValue(whereNode.right, bindings)
            if (value != null) ids.push(value)
            return ids
        }
        if (leftColumn === 'id' && whereNode.operator === 'IN') {
            const values = whereNode.right?.value || whereNode.right?.list || []
            for (const item of values) {
                const value = _resolveSqlValue(item, bindings)
                if (value != null) ids.push(value)
            }
            return ids
        }
        _collectWhereIds(whereNode.left, bindings, ids)
        _collectWhereIds(whereNode.right, bindings, ids)
        return ids
    }

    if (whereNode.type === 'expr_list') {
        for (const item of whereNode.value || []) {
            _collectWhereIds(item, bindings, ids)
        }
        return ids
    }

    return ids
}

function _parseMutationAst (sql) {
    let ast = parser.astify(_normalizePositionalBindings(sql))
    if (Array.isArray(ast)) {
        if (ast.length !== 1) return null
        ast = ast[0]
    }
    return ast
}

/**
 * @param {string} sql
 * @param {Array} bindings
 * @returns {string[]}
 */
function extractMutationWhereIds (sql, bindings = []) {
    const ast = _parseMutationAst(sql)
    if (!ast) return []

    if (ast.type === 'update' || ast.type === 'delete') {
        return _collectWhereIds(ast.where, bindings)
    }

    return []
}

function _hasDeletedAtNullFilter (sql) {
    return /"deletedAt"\s+is\s+null/i.test(sql)
}

/**
 * Parse simple Keystone SELECT patterns supported by KV provider reads.
 *
 * @returns {{ id?: string, id_in?: string[], deletedAt?: null }|null}
 */
function extractSimpleSelectCondition (sql, bindings = []) {
    const idInMatch = sql.match(/(?:"t\d+"\.)?"id"\s+in\s*\(([^)]+)\)/i)
    if (idInMatch) {
        const ids = [...idInMatch[1].matchAll(/\$(\d+)/g)]
            .map((match) => bindings[Number(match[1]) - 1])
            .filter(Boolean)
        const condition = { id_in: ids }
        if (_hasDeletedAtNullFilter(sql)) condition.deletedAt = null
        return condition
    }

    const idEqMatch = sql.match(/(?:"t\d+"\.)?"id"\s*=\s*\$(\d+)/i)
    if (idEqMatch) {
        const condition = { id: bindings[Number(idEqMatch[1]) - 1] }
        if (_hasDeletedAtNullFilter(sql)) condition.deletedAt = null
        return condition
    }

    return null
}

async function _rollbackProviderCreates ({ provider, schemaName, rows }) {
    await Promise.allSettled(rows.map(row => provider.delete({ schemaName, id: row.id })))
}

async function _rollbackProviderUpdates ({ provider, schemaName, snapshots }) {
    await Promise.allSettled(snapshots.map(({ id, before }) => {
        if (!before) return Promise.resolve()
        return provider.update({ schemaName, id, data: before })
    }))
}

async function _rollbackProviderDeletes ({ provider, schemaName, snapshots }) {
    await Promise.allSettled(snapshots.map(({ before }) => {
        if (!before) return Promise.resolve()
        return provider.create({ schemaName, data: before })
    }))
}

/**
 * Execute a provider-backed SQL mutation (GraphQL / knex path).
 *
 * @param {object} options
 * @param {object} options.provider
 * @param {string} options.schemaName
 * @param {string} options.sqlOperationName
 * @param {string} options.sql
 * @param {Array} options.bindings
 * @returns {Promise<{ rows: Array, rowCount: number }>}
 */
async function executeProviderSqlMutation ({ provider, schemaName, sqlOperationName, sql, bindings = [] }) {
    if (sqlOperationName === 'insert') {
        const rows = extractMutationColumnValues(sql, bindings)
        const created = []
        try {
            const inserted = await Promise.all(rows.map(async (data) => {
                const row = await provider.create({ schemaName, data })
                created.push(row)
                return row
            }))
            return { rowCount: inserted.length, rows: inserted }
        } catch (err) {
            await _rollbackProviderCreates({ provider, schemaName, rows: created })
            throw err
        }
    }

    if (sqlOperationName === 'update') {
        const [patch] = extractMutationColumnValues(sql, bindings)
        const ids = extractMutationWhereIds(sql, bindings)
        const snapshots = []
        try {
            const updated = await Promise.all(ids.map(async (id) => {
                const [before] = await provider.find({ schemaName, condition: { id } })
                snapshots.push({ id, before })
                return provider.update({ schemaName, id, data: patch })
            }))
            return { rowCount: updated.length, rows: updated }
        } catch (err) {
            await _rollbackProviderUpdates({ provider, schemaName, snapshots })
            throw err
        }
    }

    if (sqlOperationName === 'delete') {
        const ids = extractMutationWhereIds(sql, bindings)
        const snapshots = []
        try {
            const deleted = await Promise.all(ids.map(async (id) => {
                const [before] = await provider.find({ schemaName, condition: { id } })
                snapshots.push({ id, before })
                return provider.delete({ schemaName, id })
            }))
            return { rowCount: deleted.length, rows: deleted }
        } catch (err) {
            await _rollbackProviderDeletes({ provider, schemaName, snapshots })
            throw err
        }
    }

    throw new Error(`Unsupported provider SQL operation: ${sqlOperationName}`)
}

/**
 * Execute a provider-backed simple SELECT (id / id_in only).
 *
 * @returns {Promise<{ rows: Array }>}
 */
async function executeProviderSqlSelect ({ provider, schemaName, sql, bindings = [] }) {
    if (/count\s*\(\s*\*\s*\)/i.test(sql)) {
        throw new Error(`Provider pool for ${schemaName} does not support COUNT queries`)
    }

    const condition = extractSimpleSelectCondition(sql, bindings)
    if (!condition || !providerSupportsFind(provider, condition)) {
        throw new Error(`Provider pool for ${schemaName} supports only simple id/id_in SELECT queries`)
    }

    const rows = await provider.find({ schemaName, condition })
    return { rows }
}

module.exports = {
    executeProviderSqlMutation,
    executeProviderSqlSelect,
    extractMutationWhereIds,
    extractSimpleSelectCondition,
}
