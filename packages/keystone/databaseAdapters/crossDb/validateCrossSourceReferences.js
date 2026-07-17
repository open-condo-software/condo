/**
 * Cross-database foreign key validation for INSERT/UPDATE mutations.
 *
 * When a table lives on a different source than its related tables, Postgres FK
 * constraints may be absent (CI clones schema without FKs). This module validates
 * relationship column values against the related table's source before the mutation runs.
 */
const { Parser } = require('node-sql-parser/build/postgresql')

const {
    normalizeColumnName,
    normalizePositionalBindings,
    resolveSqlValue,
} = require('./sqlAstUtils')

const parser = new Parser()

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
        result[columns[i]] = resolveSqlValue(valueRow[i], bindings)
    }
    return result
}

/**
 * @param {string} sql
 * @param {Array} bindings
 * @returns {Array<Record<string, *>>}
 */
function extractMutationColumnValues (sql, bindings = []) {
    let ast = parser.astify(normalizePositionalBindings(sql))
    if (Array.isArray(ast)) {
        if (ast.length !== 1) return []
        ast = ast[0]
    }

    if (ast.type === 'insert') {
        const columns = (ast.columns || []).map(normalizeColumnName).filter(Boolean)
        return (ast.values || [])
            .map(valueGroup => _mapInsertValueRow(valueGroup?.value, columns, bindings))
            .filter(Boolean)
    }

    if (ast.type === 'update') {
        const result = {}
        for (const item of ast.set || []) {
            const columnName = normalizeColumnName(item.column)
            if (!columnName) continue
            result[columnName] = resolveSqlValue(item.value, bindings)
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

    const idsByRefListKey = new Map()
    for (const columnValues of columnValueRows) {
        for (const { columnName, refListKey } of crossSourceFields) {
            const fkValue = columnValues[columnName]
            if (!_isPresentFkValue(fkValue)) continue

            if (!idsByRefListKey.has(refListKey)) {
                idsByRefListKey.set(refListKey, new Set())
            }
            idsByRefListKey.get(refListKey).add(fkValue)
        }
    }

    const foundIdsByRefListKey = new Map()
    for (const [refListKey, ids] of idsByRefListKey) {
        const relatedPoolName = sourceRegistry.resolveSource(refListKey)
        const relatedPool = getPoolByName(relatedPoolName)
        const relatedClient = relatedPool.getKnexClient()
        const relatedRows = await relatedClient(refListKey)
            .select('id')
            .whereIn('id', [...ids])
        foundIdsByRefListKey.set(refListKey, new Set(relatedRows.map(row => row.id)))
    }

    for (const columnValues of columnValueRows) {
        for (const { columnName, refListKey } of crossSourceFields) {
            const fkValue = columnValues[columnName]
            if (!_isPresentFkValue(fkValue)) continue

            const foundIds = foundIdsByRefListKey.get(refListKey)
            if (!foundIds || !foundIds.has(fkValue)) {
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
