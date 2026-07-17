const { Parser } = require('node-sql-parser/build/postgresql')

const { providerSupportsFind } = require('./providerMethods')

const {
    normalizeColumnName,
    normalizePositionalBindings,
    resolveSqlValue,
} = require('../crossDb/sqlAstUtils')
const { extractMutationColumnValues } = require('../crossDb/validateCrossSourceReferences')

const parser = new Parser()

function _collectWhereIds (whereNode, bindings, ids = []) {
    if (!whereNode) return ids

    if (whereNode.type === 'binary_expr') {
        const leftColumn = normalizeColumnName(whereNode.left)
        if (leftColumn === 'id' && whereNode.operator === '=') {
            const value = resolveSqlValue(whereNode.right, bindings)
            if (value != null) ids.push(value)
            return ids
        }
        if (leftColumn === 'id' && whereNode.operator === 'IN') {
            const values = whereNode.right?.value || whereNode.right?.list || []
            for (const item of values) {
                const value = resolveSqlValue(item, bindings)
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
    let ast = parser.astify(normalizePositionalBindings(sql))
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
            const inserted = []
            for (const data of rows) {
                const row = await provider.create({ schemaName, data })
                created.push(row)
                inserted.push(row)
            }
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
            const updated = []
            for (const id of ids) {
                const [before] = await provider.find({ schemaName, condition: { id } })
                snapshots.push({ id, before })
                updated.push(await provider.update({ schemaName, id, data: patch }))
            }
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
            const deleted = []
            for (const id of ids) {
                const [before] = await provider.find({ schemaName, condition: { id } })
                snapshots.push({ id, before })
                deleted.push(await provider.delete({ schemaName, id }))
            }
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
